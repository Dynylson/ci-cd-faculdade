# 🍽️ Delivery de Restaurantes — API

> API REST para gerenciamento de pratos em um sistema de delivery de restaurantes.  
> Construída com **Node.js** + **Express**, testada com **Jest** + **Supertest** e integrada com **GitHub Actions**.

---

## 📋 Rotas disponíveis

| Método | Rota          | Descrição                             |
|--------|---------------|---------------------------------------|
| GET    | `/api/pratos` | Retorna a lista completa de pratos    |
| POST   | `/api/pratos` | Cadastra um novo prato                |

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

## 🚀 Como executar localmente

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

Este projeto possui uma esteira de integração contínua (CI) com dois fluxos automatizados:

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

### 📌 Por que exigir 90% de cobertura?

A cobertura de código mede **quais linhas, branches e funções** do código-fonte são efetivamente exercitadas pelos testes. Exigir um mínimo de 90% serve para:

- **Detectar regressões automaticamente** — qualquer novo código sem testes faz o CI falhar.
- **Garantir confiança no código** — rotas e validações críticas da API estão cobertas.
- **Tornar o histórico auditável** — cada commit no GitHub mostra claramente se os testes passaram.

---

## 🌿 Workflow de Git

Optamos pelo **GitHub Flow**:

- A branch `main` é sempre estável e reflete o que está funcionando.
- Cada nova funcionalidade é desenvolvida em uma branch própria a partir da `main` (ex.: `feature/post-prato`).
- Ao concluir a feature, a branch é integrada de volta à `main` via Pull Request — passando obrigatoriamente pelo CI.

O GitHub Flow foi escolhido por ser simples e adequado para projetos pequenos e de desenvolvimento solo, sem a necessidade das branches adicionais (`develop`, `release/*`, `hotfix/*`) que o Git Flow exige.

---

## 🗂️ Estrutura do projeto

```
.
├── .github/
│   └── workflows/
│       ├── workflow-commits.yml  # CI em push
│       └── workflow-pr.yml       # CI em pull_request
├── src/
│   ├── app.js                    # Rotas Express (exporta o app)
│   ├── server.js                 # Inicialização do servidor HTTP
│   └── pratos.js                 # Dados iniciais (pratos em memória)
├── tests/
│   └── pratos.test.js            # Suite de testes (Jest + Supertest)
├── package.json
└── README.md
```
