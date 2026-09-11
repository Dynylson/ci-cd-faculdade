/**
 * Testes automatizados — API Delivery de Restaurantes
 * Rotas cobertas: GET /api/pratos e POST /api/pratos
 */

const request = require("supertest");

// Cada teste precisa de um estado limpo da lista de pratos,
// então reiniciamos o módulo antes de cada teste.
let app;

beforeEach(() => {
  // Limpa o cache do Node para garantir estado inicial isolado
  jest.resetModules();
  app = require("../src/app");
});

// ---------------------------------------------------------------------------
// GET /api/pratos
// ---------------------------------------------------------------------------

describe("GET /api/pratos", () => {
  it("deve retornar status 200", async () => {
    const res = await request(app).get("/api/pratos");
    expect(res.statusCode).toBe(200);
  });

  it("deve retornar um array", async () => {
    const res = await request(app).get("/api/pratos");
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("deve retornar 3 pratos na lista inicial", async () => {
    const res = await request(app).get("/api/pratos");
    expect(res.body).toHaveLength(3);
  });

  it("cada prato deve ter as propriedades id, nome, restaurante e preco", async () => {
    const res = await request(app).get("/api/pratos");
    res.body.forEach((prato) => {
      expect(prato).toHaveProperty("id");
      expect(prato).toHaveProperty("nome");
      expect(prato).toHaveProperty("restaurante");
      expect(prato).toHaveProperty("preco");
    });
  });

  it("deve retornar o primeiro prato como Pizza Margherita", async () => {
    const res = await request(app).get("/api/pratos");
    expect(res.body[0]).toMatchObject({
      id: 1,
      nome: "Pizza Margherita",
      restaurante: "Cantina Italiana",
      preco: 42.9
    });
  });
});

// ---------------------------------------------------------------------------
// POST /api/pratos
// ---------------------------------------------------------------------------

describe("POST /api/pratos", () => {
  const pratovalido = {
    nome: "Sushi Combo",
    restaurante: "Sushi House",
    preco: 55.9
  };

  it("deve retornar status 201 ao cadastrar um prato válido", async () => {
    const res = await request(app).post("/api/pratos").send(pratovalido);
    expect(res.statusCode).toBe(201);
  });

  it("deve retornar o prato criado com os campos corretos", async () => {
    const res = await request(app).post("/api/pratos").send(pratovalido);
    expect(res.body).toMatchObject({
      nome: "Sushi Combo",
      restaurante: "Sushi House",
      preco: 55.9
    });
  });

  it("deve gerar um id automático para o novo prato", async () => {
    const res = await request(app).post("/api/pratos").send(pratovalido);
    expect(res.body).toHaveProperty("id");
    expect(typeof res.body.id).toBe("number");
  });

  it("deve gerar o id como max(ids) + 1 (ou seja, 4 na lista inicial)", async () => {
    const res = await request(app).post("/api/pratos").send(pratovalido);
    expect(res.body.id).toBe(4);
  });

  it("o novo prato deve aparecer na lista após cadastro (GET)", async () => {
    await request(app).post("/api/pratos").send(pratovalido);
    const res = await request(app).get("/api/pratos");
    expect(res.body).toHaveLength(4);
    expect(res.body[3]).toMatchObject({ nome: "Sushi Combo" });
  });

  // ---- Validações de campos obrigatórios ----

  it("deve retornar 400 quando o campo nome está ausente", async () => {
    const res = await request(app)
      .post("/api/pratos")
      .send({ restaurante: "Sushi House", preco: 55.9 });
    expect(res.statusCode).toBe(400);
  });

  it("deve retornar 400 quando o campo restaurante está ausente", async () => {
    const res = await request(app)
      .post("/api/pratos")
      .send({ nome: "Sushi Combo", preco: 55.9 });
    expect(res.statusCode).toBe(400);
  });

  it("deve retornar 400 quando o campo preco está ausente", async () => {
    const res = await request(app)
      .post("/api/pratos")
      .send({ nome: "Sushi Combo", restaurante: "Sushi House" });
    expect(res.statusCode).toBe(400);
  });

  it("deve retornar 400 quando preco não é um número (é string)", async () => {
    const res = await request(app)
      .post("/api/pratos")
      .send({ nome: "Sushi Combo", restaurante: "Sushi House", preco: "grátis" });
    expect(res.statusCode).toBe(400);
  });

  it("a resposta de erro deve conter a mensagem descritiva esperada", async () => {
    const res = await request(app)
      .post("/api/pratos")
      .send({ restaurante: "Sushi House", preco: 55.9 });
    expect(res.body).toHaveProperty("erro");
    expect(res.body.erro).toMatch(/nome/i);
  });

  it("deve retornar 400 quando o body está completamente vazio", async () => {
    const res = await request(app).post("/api/pratos").send({});
    expect(res.statusCode).toBe(400);
  });

  it("deve gerar id 1 quando a lista de pratos está vazia", async () => {
    // Reseta os módulos para manipular o estado do módulo pratos
    jest.resetModules();
    const pratosModule = require("../src/pratos");
    // Esvazia a lista
    pratosModule.pratos.splice(0, pratosModule.pratos.length);
    // Reimporta o app com a lista zerada
    const appVazio = require("../src/app");

    const res = await request(appVazio)
      .post("/api/pratos")
      .send({ nome: "Prato Único", restaurante: "Rest. Teste", preco: 10.0 });

    expect(res.statusCode).toBe(201);
    expect(res.body.id).toBe(1);
  });
});
