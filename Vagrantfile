# -*- mode: ruby -*-
# vi: set ft=ruby :
#
# Infraestrutura virtual da API "Delivery de Restaurantes"
#
#   +-------------------------+     curl / wget (:8080)     +---------------------------+
#   | VM1 - cliente           | --------------------------> | VM2 - backend             |
#   | 192.168.56.10 | 1024 MB |                             | 192.168.56.11 | 512 MB    |
#   +-------------------------+                             | Node.js + API (systemd)   |
#                                                           | /vagrant_data <-> projeto |
#                                                           +---------------------------+
#
# Provedor: VirtualBox. Passo a passo completo no README.md.

# Garante o VirtualBox mesmo que outro provedor (ex.: libvirt) seja o padrão do host
ENV["VAGRANT_DEFAULT_PROVIDER"] = "virtualbox"

BOX = "bento/ubuntu-24.04" # Ubuntu Server 24.04 LTS

# Endereços IPv4 privados Classe C (faixa 192.168.0.0/16 da RFC 1918), dentro
# da faixa 192.168.56.0/21 que o VirtualBox libera para redes host-only.
VM1_IP = "192.168.56.10"
VM2_IP = "192.168.56.11"

# VM1: valor exigido pelo enunciado.
VM1_MEMORY = 1024
# VM2: Ubuntu Server ocioso (~250 MB) + processo Node/Express (~65 MB) + folga
# para o "npm ci" e para o apt. 512 MB atendem o backend com margem.
VM2_MEMORY = 512

NODE_MAJOR = "22"                # Node.js LTS instalado na VM2
APP_PORT   = "8080"              # porta definida em src/server.js
APP_DIR    = "/vagrant_data"     # pasta da VM2 sincronizada com este repositório
DEPS_DIR   = "/opt/delivery-api" # node_modules da VM2 (fora da pasta sincronizada)

# ---------------------------------------------------------------------------
# Scripts de provisionamento (shell). Todos são idempotentes.
# ---------------------------------------------------------------------------

# VM1: garante as ferramentas usadas para testar a API.
VM1_TOOLS = <<~'SHELL'
  #!/usr/bin/env bash
  set -eu
  if ! command -v curl >/dev/null || ! command -v wget >/dev/null; then
    export DEBIAN_FRONTEND=noninteractive
    apt-get update -qq
    apt-get install -y -qq curl wget
  fi
  echo "VM1 pronta: curl e wget disponiveis"
SHELL

# VM2: instala o Node.js e as dependências npm da aplicação.
VM2_DEPENDENCIES = <<~'SHELL'
  #!/usr/bin/env bash
  set -euo pipefail
  export DEBIAN_FRONTEND=noninteractive

  # 1) Node.js + npm a partir do repositório oficial da NodeSource
  if ! node --version 2>/dev/null | grep -q "^v${NODE_MAJOR}\."; then
    apt-get update -qq
    apt-get install -y -qq ca-certificates curl gnupg
    install -d -m 0755 /etc/apt/keyrings
    curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key \
      | gpg --dearmor --yes -o /etc/apt/keyrings/nodesource.gpg
    echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_${NODE_MAJOR}.x nodistro main" \
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

  # Nenhuma VM usa a pasta padrão /vagrant; a VM2 define a sua própria.
  config.vm.synced_folder ".", "/vagrant", disabled: true

  # ----------------------------- VM1 (cliente) -----------------------------
  config.vm.define "vm1" do |vm1|
    vm1.vm.hostname = "vm1"
    vm1.vm.network "private_network", ip: VM1_IP

    vm1.vm.provider "virtualbox" do |vb|
      vb.name   = "delivery-vm1"
      vb.memory = VM1_MEMORY
      vb.cpus   = 1
    end

    vm1.vm.provision "shell", name: "ferramentas", inline: VM1_TOOLS
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
    vm2.vm.provision "shell", name: "dependencias", run: "always",
      env: VM2_ENV, inline: VM2_DEPENDENCIES
    vm2.vm.provision "shell", name: "executar-api", run: "always",
      env: VM2_ENV, inline: VM2_RUN_APP
  end
end
