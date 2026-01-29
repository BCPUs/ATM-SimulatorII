//transacciones.js
const express = require("express");
const connectDB = require("../db");
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const db = await connectDB();
    const transacciones = await db.collection("transacciones").find().toArray();
    res.json(transacciones);
  } catch (error) {
    res.status(500).send("Error al obtener transacciones");
  }
});

router.post("/", async (req, res) => {
  try {
    const db = await connectDB();
    await db.collection("transacciones").insertOne(req.body);
    res.send("Transacción registrada correctamente");
  } catch (error) {
    res.status(500).send("Error al registrar transacción");
  }
});

module.exports = router;
