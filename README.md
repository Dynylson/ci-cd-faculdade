# 🍽️ Delivery de Restaurantes — API

[![CI/CD Status](https://github.com/Dynylson/ci-cd-faculdade/actions/workflows/workflow-qualidade.yml/badge.svg)](https://github.com/Dynylson/ci-cd-faculdade/actions/workflows/workflow-qualidade.yml)
[![Docker Hub](https://badgen.net/badge/Docker%20Hub/lucgbrel%2Fci-cd-faculdade/blue?icon=docker)](https://hub.docker.com/repository/docker/lucgbrel/ci-cd-faculdade/general)
[![Docker Size](https://badgen.net/docker/size/lucgbrel/ci-cd-faculdade?icon=docker&label=image%20size)](https://hub.docker.com/repository/docker/lucgbrel/ci-cd-faculdade/general)
[![Docker Pulls](https://badgen.net/docker/pulls/lucgbrel/ci-cd-faculdade?icon=docker&label=pulls)](https://hub.docker.com/repository/docker/lucgbrel/ci-cd-faculdade/general)
[![Coverage](https://badgen.net/badge/coverage/100%25/green)](https://github.com/Dynylson/ci-cd-faculdade)
[![Node.js Version](https://badgen.net/badge/node/%3E=20/green?icon=node)](https://nodejs.org/)

> API REST para gerenciamento de pratos em um sistema de delivery de restaurantes.  
> Construída com **Node.js** + **Express**, testada com **Jest** + **Supertest**, conteinerizada com **Docker** e com esteira CI/CD automatizada no **GitHub Actions** integrada ao **Docker Hub**.

---

## 📋 Rotas disponíveis

| Método | Rota          | Descrição                             |
|--------|---------------|---------------------------------------|
| GET    | `/api/pratos` | Retorna a lista completa de pratos    |
| POST   | `/api/pratos` | Cadastra um novo prato                |
| DELETE | `/api/pratos/:id` | Remove um prato (`204` se removido, `404` se não existir) |

### `POST /api/pratos` — Body esperado

```json
{
  "nome": "Sushi Combo",
  "restaurante": "Sushi House",
  "preco": 55.9
}
```

**Resposta de sucesso:** `201 Created` com o objeto do prato criado (incluindo `id` gerado automaticamente).  
**Resposta de erro:** `400 Bad Request` se `nome`, `restaurante` ou `preco` estiverem ausentes ou com tipo inválido.

---

## 🐳 Docker & Docker Hub

A imagem da aplicação está hospedada e versionada publicamente no **Docker Hub**:

🔗 **Repositório no Docker Hub:** [lucgbrel/ci-cd-faculdade](https://hub.docker.com/repository/docker/lucgbrel/ci-cd-faculdade/general) (ou [hub.docker.com/r/lucgbrel/ci-cd-faculdade](https://hub.docker.com/r/lucgbrel/ci-cd-faculdade))

### 🚀 Como executar via Docker Hub

Você pode rodar a aplicação imediatamente em qualquer ambiente com Docker instalado, sem precisar clonar o repositório ou instalar o Node.js:

```bash
# 1. Baixar a imagem mais recente
docker pull lucgbrel/ci-cd-faculdade:latest

# 2. Executar o container mapeando a porta 8080
docker run -d -p 8080:8080 --name delivery-api lucgbrel/ci-cd-faculdade:latest

# 3. Testar a rota de listagem de pratos
curl http://localhost:8080/api/pratos
```

### 🔨 Como construir e testar a imagem localmente

```bash
# Construir a imagem a partir do Dockerfile
docker build -t lucgbrel/ci-cd-faculdade:local .

# Executar o container localmente
docker run -d -p 8080:8080 --name delivery-local lucgbrel/ci-cd-faculdade:local

# Parar e remover o container após o uso
docker stop delivery-local && docker rm delivery-local
```

---

## 🚀 Como executar localmente (sem Docker)

**Pré-requisito:** [Node.js](https://nodejs.org/) v18 ou superior.

```bash
# 1. Instalar dependências
npm install

# 2. Rodar a API
npm start
```

A API estará disponível em `http://localhost:8080`.

### Exemplos com curl

```bash
# Listar todos os pratos
curl http://localhost:8080/api/pratos

# Cadastrar um novo prato
curl -X POST http://localhost:8080/api/pratos \
  -H "Content-Type: application/json" \
  -d '{"nome":"Sushi Combo","restaurante":"Sushi House","preco":55.9}'
```

---

## 🧪 Testes automatizados

O projeto usa **Jest** + **Supertest** com **100% de cobertura de código**.

```bash
# Rodar os testes
npm test

# Rodar com relatório de cobertura
npm run test:coverage

# Rodar o linter (ESLint)
npm run lint
```

### Cobertura atual

| Arquivo     | Statements | Branches | Functions | Lines |
|-------------|:----------:|:--------:|:---------:|:-----:|
| `app.js`    | 100%       | 100%     | 100%      | 100%  |
| `pratos.js` | 100%       | 100%     | 100%      | 100%  |
| **Total**   | **100%**   | **100%** | **100%**  | **100%** |

> ⚙️ O Jest está configurado para **falhar automaticamente** caso a cobertura fique abaixo de **90%** em qualquer métrica (statements, branches, functions, lines). Veja a configuração em [`package.json`](./package.json).

---

## ⚙️ CI/CD com GitHub Actions

Este projeto possui uma esteira automatizada com GitHub Actions dividida em três fluxos:

### 🔁 Fluxo 1 — [`workflow-commits.yml`](./.github/workflows/workflow-commits.yml)

**Disparado em:** todo `push` para qualquer branch.

```
push → checkout → setup Node.js 20 → npm ci → npm run test:coverage
```

**Por quê?** Garante que nenhum commit introduzido diretamente em uma branch quebre os testes ou derrube a cobertura de código.

---

### 🔀 Fluxo 2 — [`workflow-pr.yml`](./.github/workflows/workflow-pr.yml)

**Disparado em:** toda abertura ou atualização de `pull_request`.

```
pull_request → checkout → setup Node.js 20 → npm ci → npm run test:coverage
```

**Por quê?** Age como uma barreira de qualidade antes do merge. Se um PR quebrar qualquer teste ou reduzir a cobertura abaixo de 90%, o CI falha e o merge fica bloqueado.

---

### 🚀 Fluxo 3 (Baseline) — [`workflow-qualidade.yml`](./.github/workflows/workflow-qualidade.yml)

**Workflow principal da baseline**, configurado com **3 jobs encadeados**:

```
[ 1. Qualidade e Testes ] ──► [ 2. Construção da Imagem Docker ] ──► [ 3. Publicação no DockerHub ]
      (qualquer branch)                 (qualquer branch)                     (apenas na baseline)
```

1. **Job 1: Qualidade e Testes (`qualidade`)**
   - **Gatilho:** Pushes e Pull Requests em qualquer branch.
   - **Ações:** Execução de ESLint, testes unitários/integração e verificação de cobertura mínima de 90%.
2. **Job 2: Construção da Imagem Docker (`build-docker`)**
   - **Gatilho:** Executado sempre que houver mudança em qualquer branch (depende do sucesso do Job 1).
   - **Ações:** Prepara o ambiente Docker Buildx, compila a imagem via `Dockerfile` (`push: false`) e realiza um **smoke test** no container disparando requisição contra `/api/pratos`.
3. **Job 3: Publicação da Imagem no DockerHub (`publish-docker`)**
   - **Gatilho:** Executado **exclusivamente na baseline** (`main`), em eventos de `push` direto ou pós-merge.
   - **Ações:** Autentica de forma segura no Docker Hub via GitHub Secrets (`DOCKERHUB_USERNAME` e `DOCKERHUB_TOKEN`) e publica a imagem tagueada como `:latest` e `:<commit-sha>`.

---

### 📌 Por que exigir 90% de cobertura?

A cobertura de código mede **quais linhas, branches e funções** do código-fonte são efetivamente exercitadas pelos testes. Exigir um mínimo de 90% serve para:

- **Detectar regressões automaticamente** — qualquer novo código sem testes faz o CI falhar.
- **Garantir confiança no código** — rotas e validações críticas da API estão cobertas.
- **Tornar o histórico auditável** — cada commit no GitHub mostra claramente se os testes passaram.

---

## 🌿 Workflow de Git

Optamos pelo **GitHub Flow**:

- A branch `main` é a **baseline estável** e reflete o que está pronto para produção.
- Cada nova funcionalidade é desenvolvida em uma branch própria a partir da `main` (ex.: `feature/post-prato`).
- Ao concluir a feature, a branch é integrada de volta à `main` via Pull Request — passando obrigatoriamente pelas validações de qualidade e compilação da imagem Docker.

---

## 🔐 Commits assinados e proteção de branches

- Todos os commits são assinados com uma chave SSH (`gpg.format ssh`, `commit.gpgsign true`); a chave pública está cadastrada no GitHub como *Signing Key*.
- Branches `main` (produção) e `homologacao` protegidas: PR obrigatório, check `Qualidade` obrigatório e atualizado, commits assinados obrigatórios, histórico linear, sem force push e sem deleção.

---

## 🗂️ Estrutura do projeto

```
.
├── .dockerignore              # Arquivos ignorados no build do Docker
├── Dockerfile                 # Especificação da imagem de produção Node.js
├── .github/
│   └── workflows/
│       ├── workflow-commits.yml   # CI em push
│       ├── workflow-pr.yml        # CI em pull_request
│       └── workflow-qualidade.yml # Pipeline da baseline: Qualidade, Build e Publicação Docker
├── src/
│   ├── app.js                 # Rotas Express (exporta o app)
│   ├── server.js              # Inicialização do servidor HTTP (porta 8080)
│   └── pratos.js              # Dados iniciais (pratos em memória)
├── tests/
│   └── pratos.test.js         # Suite de testes (Jest + Supertest)
├── eslint.config.js           # Configuração do linter
├── package.json
└── README.md
```
