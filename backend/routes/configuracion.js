//configuracion.js
const express = require("express");
const connectDB = require("../db");
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const db = await connectDB();
    const configuraciones = await db.collection("configuracion").find().toArray();
    res.json(configuraciones);
  } catch (error) {
    res.status(500).send("Error al obtener configuraciones");
  }
});

router.post("/", async (req, res) => {
  try {
    const db = await connectDB();
    await db.collection("configuracion").insertOne(req.body);
    res.send("Configuración guardada correctamente");
  } catch (error) {
    res.status(500).send("Error al guardar configuración");
  }
});

module.exports = router;
