# -*- mode: ruby -*-
# vi: set ft=ruby :
#
# Infraestrutura virtual da API "Delivery de Restaurantes"
#
#   +---------------------------+   SSH (Ansible)   +---------------------------------+
#   | VM1 - cliente + controle  | ----------------> | VM2 - backend                   |
#   | 192.168.56.10 | 1024 MB   | curl/wget :8080   | 192.168.56.11 | 1024 MB         |
#   | ansible-core              | curl/wget :3000   | :8080 API de /vagrant_data      |
#   | ~/ansible <-> ./ansible   |                   | :3000 API clonada pelo Ansible  |
#   +---------------------------+                   +---------------------------------+
#
# Provedor: VirtualBox. Passo a passo completo no README.md.

require "fileutils"
require "openssl"

# Garante o VirtualBox mesmo que outro provedor (ex.: libvirt) seja o padrão do host
ENV["VAGRANT_DEFAULT_PROVIDER"] = "virtualbox"

BOX = "bento/ubuntu-24.04" # Ubuntu Server 24.04 LTS

# Endereços IPv4 privados Classe C (faixa 192.168.0.0/16 da RFC 1918), dentro
# da faixa 192.168.56.0/21 que o VirtualBox libera para redes host-only.
VM1_IP = "192.168.56.10"
VM2_IP = "192.168.56.11"

# VM1: valor exigido pelo enunciado.
VM1_MEMORY = 1024
# VM2: Ubuntu Server ocioso (~250 MB) + duas instâncias da API (~65 MB cada:
# a do Vagrant e a do Ansible) + picos do apt, do "npm ci" e dos módulos
# Python que o Ansible executa na VM2. 1024 MB evitam falta de memória.
VM2_MEMORY = 1024

NODE_MAJOR = "22"                # Node.js LTS instalado na VM2
APP_PORT   = "8080"              # porta padrão de src/server.js
APP_DIR    = "/vagrant_data"     # pasta da VM2 sincronizada com este repositório
DEPS_DIR   = "/opt/delivery-api" # node_modules da VM2 (fora da pasta sincronizada)

# ---------------------------------------------------------------------------
# Chave SSH do Ansible (VM1 -> VM2)
# Gerada uma única vez no host, em .vagrant/ansible/ (ignorado pelo git). A
# privada vai para a VM1 (nó de controle) e a pública é autorizada na VM2
# (nó gerenciado), qualquer que seja a ordem em que as VMs sobem.
# ---------------------------------------------------------------------------
ANSIBLE_KEY = File.join(__dir__, ".vagrant", "ansible", "id_rsa")

unless File.exist?(ANSIBLE_KEY)
  FileUtils.mkdir_p(File.dirname(ANSIBLE_KEY))
  File.write(ANSIBLE_KEY, OpenSSL::PKey::RSA.new(3072).to_pem, perm: 0o600)
end

# Converte a chave pública para o formato do authorized_keys ("ssh-rsa AAAA...").
def openssh_public_key(rsa, comment)
  field = ->(bytes) { [bytes.bytesize].pack("N") + bytes }
  mpint = ->(bn) { b = bn.to_s(2); field.(b.getbyte(0) >= 0x80 ? "\0".b + b : b) }
  blob  = field.("ssh-rsa".b) + mpint.(rsa.e) + mpint.(rsa.n)
  "ssh-rsa #{[blob].pack('m0')} #{comment}"
end

ANSIBLE_PUBLIC_KEY = openssh_public_key(OpenSSL::PKey::RSA.new(File.read(ANSIBLE_KEY)), "ansible@vm1")

# ---------------------------------------------------------------------------
# Scripts de provisionamento (shell). Todos são idempotentes.
# ---------------------------------------------------------------------------

# VM1: ferramentas de teste (curl/wget) e o Ansible, tornando-a o nó de controle.
VM1_CONTROL_NODE = <<~'SHELL'
  #!/usr/bin/env bash
  set -euo pipefail
  export DEBIAN_FRONTEND=noninteractive

  apt-get update -qq
  apt-get install -y -qq curl wget ansible-core
  ansible --version | head -1

  # Chave privada copiada pelo provisionador "file": o SSH exige permissão 600
  chown vagrant:vagrant /home/vagrant/.ssh/id_rsa
  chmod 600 /home/vagrant/.ssh/id_rsa

  echo "VM1 pronta (no de controle): cd ~/ansible && ansible-playbook configura-node.yaml"
SHELL

# VM2: autoriza a chave do Ansible para o usuário vagrant.
VM2_AUTHORIZE_ANSIBLE = <<~'SHELL'
  #!/usr/bin/env bash
  set -euo pipefail
  AUTH=/home/vagrant/.ssh/authorized_keys
  grep -qxF "$ANSIBLE_PUBLIC_KEY" "$AUTH" || echo "$ANSIBLE_PUBLIC_KEY" >> "$AUTH"
  echo "Chave do Ansible (VM1) autorizada na VM2"
SHELL

# VM2: instala o Node.js e as dependências npm da aplicação.
VM2_DEPENDENCIES = <<~'SHELL'
  #!/usr/bin/env bash
  set -euo pipefail
  export DEBIAN_FRONTEND=noninteractive

  # 1) Node.js + npm a partir do repositório oficial da NodeSource
  #    (mesmos arquivos que o playbook ansible/configura-node.yaml gerencia)
  if ! node --version 2>/dev/null | grep -q "^v${NODE_MAJOR}\."; then
    apt-get update -qq
    apt-get install -y -qq ca-certificates curl
    install -d -m 0755 /etc/apt/keyrings
    curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key \
      -o /etc/apt/keyrings/nodesource.asc
    echo "deb [signed-by=/etc/apt/keyrings/nodesource.asc] https://deb.nodesource.com/node_${NODE_MAJOR}.x nodistro main" \
      > /etc/apt/sources.list.d/nodesource.list
    apt-get update -qq
    apt-get install -y -qq nodejs
  fi
  echo "Node.js $(node --version) | npm $(npm --version)"

  # 2) Dependências de produção da API (npm ci), reinstaladas só quando o
  #    package.json/package-lock.json mudar. Ficam FORA da pasta sincronizada
  #    para não sobrescrever o node_modules do host nem esbarrar em limitações
  #    de symlink das pastas compartilhadas; o Node as encontra via NODE_PATH.
  install -d -m 0755 "$DEPS_DIR"
  cd "$APP_DIR"
  if ! sha256sum --status -c "$DEPS_DIR/package.sha256" 2>/dev/null; then
    cp package.json package-lock.json "$DEPS_DIR/"
    (cd "$DEPS_DIR" && npm ci --omit=dev --ignore-scripts --no-audit --no-fund --no-update-notifier)
    sha256sum package.json package-lock.json > "$DEPS_DIR/package.sha256"
  fi
  echo "Dependencias npm instaladas em $DEPS_DIR/node_modules"
SHELL

# VM2: registra a API como serviço systemd, (re)inicia e confere se responde.
VM2_RUN_APP = <<~'SHELL'
  #!/usr/bin/env bash
  set -euo pipefail

  cat > /etc/systemd/system/delivery-api.service <<UNIT
  [Unit]
  Description=API Delivery de Restaurantes (Node.js + Express)
  After=network-online.target
  Wants=network-online.target
  RequiresMountsFor=${APP_DIR}

  [Service]
  User=vagrant
  WorkingDirectory=${APP_DIR}
  Environment=NODE_ENV=production
  Environment=NODE_PATH=${DEPS_DIR}/node_modules
  Environment=PORT=${APP_PORT}
  ExecStart=/usr/bin/node src/server.js
  Restart=on-failure
  RestartSec=3

  [Install]
  WantedBy=multi-user.target
  UNIT

  systemctl daemon-reload
  systemctl enable --quiet delivery-api
  systemctl restart delivery-api

  # Aguarda a API responder; se não subir, o "vagrant up" falha com o log.
  for _ in $(seq 1 30); do
    if curl -fs -o /dev/null "http://localhost:${APP_PORT}/api/pratos"; then
      echo "API no ar: http://${VM2_IP}:${APP_PORT}/api/pratos"
      exit 0
    fi
    sleep 1
  done
  echo "ERRO: a API nao respondeu na porta ${APP_PORT}" >&2
  journalctl -u delivery-api --no-pager -n 30 >&2
  exit 1
SHELL

VM2_ENV = {
  "NODE_MAJOR" => NODE_MAJOR,
  "APP_PORT"   => APP_PORT,
  "APP_DIR"    => APP_DIR,
  "DEPS_DIR"   => DEPS_DIR,
  "VM2_IP"     => VM2_IP,
}

# ---------------------------------------------------------------------------
# Máquinas virtuais
# ---------------------------------------------------------------------------
Vagrant.configure("2") do |config|
  config.vm.box = BOX

  # Nenhuma VM usa a pasta padrão /vagrant; cada uma define as suas.
  config.vm.synced_folder ".", "/vagrant", disabled: true

  # ------------------------ VM1 (cliente + nó de controle) ------------------------
  config.vm.define "vm1" do |vm1|
    vm1.vm.hostname = "vm1"
    vm1.vm.network "private_network", ip: VM1_IP

    vm1.vm.provider "virtualbox" do |vb|
      vb.name   = "delivery-vm1"
      vb.memory = VM1_MEMORY
      vb.cpus   = 1
    end

    # Configuração do Ansible (ansible.cfg, inventário e playbook) montada na VM1.
    # Permissões 755/644: o Ansible ignora um ansible.cfg em pasta gravável por
    # todos, que é o padrão das pastas compartilhadas do VirtualBox.
    vm1.vm.synced_folder "ansible", "/home/vagrant/ansible",
      mount_options: ["dmode=755", "fmode=644"]

    vm1.vm.provision "file", source: ANSIBLE_KEY, destination: "/home/vagrant/.ssh/id_rsa"
    vm1.vm.provision "shell", name: "no-de-controle", inline: VM1_CONTROL_NODE
  end

  # ----------------------------- VM2 (backend) -----------------------------
  config.vm.define "vm2" do |vm2|
    vm2.vm.hostname = "vm2"
    vm2.vm.network "private_network", ip: VM2_IP

    vm2.vm.provider "virtualbox" do |vb|
      vb.name   = "delivery-vm2"
      vb.memory = VM2_MEMORY
      vb.cpus   = 1
    end

    # Pasta da aplicação (este repositório) <-> /vagrant_data dentro da VM2
    vm2.vm.synced_folder ".", APP_DIR

    # Rodam a cada "vagrant up"/"vagrant reload" (são idempotentes), para a API
    # voltar a subir após reiniciar a VM e refletir mudanças nas dependências.
    vm2.vm.provision "shell", name: "acesso-ansible", run: "always",
      env: { "ANSIBLE_PUBLIC_KEY" => ANSIBLE_PUBLIC_KEY }, inline: VM2_AUTHORIZE_ANSIBLE
    vm2.vm.provision "shell", name: "dependencias", run: "always",
      env: VM2_ENV, inline: VM2_DEPENDENCIES
    vm2.vm.provision "shell", name: "executar-api", run: "always",
      env: VM2_ENV, inline: VM2_RUN_APP
  end
end
