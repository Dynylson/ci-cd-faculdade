# Delivery de Restaurantes - API

API REST simples de produtos (pratos), feita para o tema **Delivery de Restaurantes**.

## Rotas

| Método | Rota           | Descrição                  |
|--------|----------------|-----------------------------|
| GET    | `/api/pratos`  | Retorna a lista de pratos    |

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
