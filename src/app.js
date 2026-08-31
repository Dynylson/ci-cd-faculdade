const express = require("express");
const { pratos } = require("./pratos");

const app = express();
const PORT = 8080;

app.get("/api/pratos", (req, res) => {
  res.json(pratos);
});

app.listen(PORT, () => {
  console.log(`API rodando em http://localhost:${PORT}`);
});
