# Delivery de Restaurantes - API

API REST simples de produtos (pratos), feita para o tema **Delivery de Restaurantes**.

## Rotas

| Método | Rota           | Descrição                              |
|--------|----------------|------------------------------------------|
| GET    | `/api/pratos`  | Retorna a lista de pratos                |
| POST   | `/api/pratos`  | Cadastra um novo prato                   |

### POST /api/pratos

Body (JSON):

```json
{
  "nome": "Sushi Combo",
  "restaurante": "Sushi House",
  "preco": 55.9
}
```

Resposta `201 Created` com o prato criado (incluindo `id` gerado). Se `nome`, `restaurante` ou `preco` estiverem ausentes/inválidos, retorna `400 Bad Request`.

## Como executar

Pré-requisitos: [Node.js](https://nodejs.org/) instalado (recomendado v18+).

```bash
# 1. Instalar dependências
npm install

# 2. Rodar a aplicação
npm start
```

A API sobe em `http://localhost:8080`.

Teste a rota com:

```bash
curl http://localhost:8080/api/pratos
```

Testando a rota POST:

```bash
curl -X POST http://localhost:8080/api/pratos \
  -H "Content-Type: application/json" \
  -d '{"nome":"Sushi Combo","restaurante":"Sushi House","preco":55.9}'
```

## Workflow de Git escolhido

Optei pelo **GitHub Flow**.

- A branch `main` é sempre estável e reflete o que está funcionando.
- Cada nova funcionalidade é desenvolvida em uma branch própria a partir da `main` (ex.: `feature/post-prato`, usada para a rota `POST /api/pratos`).
- Ao concluir a feature, a branch é integrada de volta à `main` via merge/Pull Request.

Escolhi o GitHub Flow porque é um workflow simples e direto, adequado para um projeto pequeno e de desenvolvimento solo como este, sem a necessidade das branches adicionais (`develop`, `release/*`, `hotfix/*`) que o Git Flow exige. Ele também deixa claro o histórico de cada funcionalidade adicionada, já que cada rota nova nasce em sua própria branch de feature antes de ir para a `main`.
