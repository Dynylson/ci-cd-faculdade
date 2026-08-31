const express = require("express");
const { pratos } = require("./pratos");

const app = express();
const PORT = 8080;

app.use(express.json());

app.get("/api/pratos", (req, res) => {
  res.json(pratos);
});

app.post("/api/pratos", (req, res) => {
  const { nome, restaurante, preco } = req.body;

  if (!nome || !restaurante || typeof preco !== "number") {
    return res.status(400).json({
      erro: "Campos obrigatórios: nome (string), restaurante (string), preco (number)"
    });
  }

  const novoPrato = {
    id: pratos.length ? Math.max(...pratos.map((p) => p.id)) + 1 : 1,
    nome,
    restaurante,
    preco
  };

  pratos.push(novoPrato);
  res.status(201).json(novoPrato);
});

app.listen(PORT, () => {
  console.log(`API rodando em http://localhost:${PORT}`);
});
