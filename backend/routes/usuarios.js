const express = require("express");
const connectDB = require("../db");
const router = express.Router();

// GET todos los usuarios
router.get("/", async (req, res) => {
  try {
    const db = await connectDB();
    const usuarios = await db.collection("usuarios").find().toArray();
    res.json(usuarios);
  } catch (error) {
    res.status(500).send("Error al obtener usuarios");
  }
});

// POST - Crear usuario
router.post("/", async (req, res) => {
  try {
    let data = req.body;

    // Normalizar a mayúsculas
    if (data.nombre) data.nombre = data.nombre.toUpperCase().trim();
    if (data.banco) data.banco = data.banco.toUpperCase().trim();
    data.estado = (data.estado || "ACTIVO").toUpperCase().trim();

    data.intentosFallidos = data.intentosFallidos || 0;
    data.fechaCreacion = data.fechaCreacion || new Date();

    const db = await connectDB();
    await db.collection("usuarios").insertOne(data);
    res.send("Usuario creado correctamente");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error al crear usuario");
  }
});

// PUT - Actualizar usuario (incluye normalización de estado)
router.put("/:numeroCuenta", async (req, res) => {
  try {
    let data = req.body;

    // Normalizar campos editables
    if (data.nombre) data.nombre = data.nombre.toUpperCase().trim();
    if (data.banco) data.banco = data.banco.toUpperCase().trim();
    if (data.estado) data.estado = data.estado.toUpperCase().trim();

    const db = await connectDB();
    const result = await db.collection("usuarios").updateOne(
      { numeroCuenta: req.params.numeroCuenta },
      { $set: data }
    );

    if (result.matchedCount === 0) {
      return res.status(404).send("Usuario no encontrado");
    }

    res.send("Usuario actualizado correctamente");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error al actualizar usuario");
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { numeroCuenta, clave } = req.body;

    if (!numeroCuenta || !clave) {
      return res.status(400).send("Faltan número de cuenta o clave");
    }

    const db = await connectDB();
    const usuario = await db.collection("usuarios").findOne({ numeroCuenta });

    if (!usuario) {
      return res.status(401).send("Cuenta o clave incorrecta");
    }

    // Comparar en mayúsculas (ya debería estar normalizado, pero por seguridad)
    if (usuario.estado.toUpperCase() !== "ACTIVO") {
      return res.status(403).send("Cuenta bloqueada o inactiva. Contacte a su banco.");
    }

    if (usuario.clave !== clave) {
      const nuevosIntentos = (usuario.intentosFallidos || 0) + 1;
      await db.collection("usuarios").updateOne(
        { numeroCuenta },
        { $set: { intentosFallidos: nuevosIntentos } }
      );

      const config = (await db.collection("configuracion").find().limit(1).toArray())[0] || {};
      const maxIntentos = config.maxIntentosClave || 3;

      if (nuevosIntentos >= maxIntentos) {
        await db.collection("usuarios").updateOne(
          { numeroCuenta },
          { $set: { estado: "BLOQUEADO" } }  // siempre mayúsculas
        );
        return res.status(403).send("Cuenta bloqueada por múltiples intentos fallidos");
      }

      return res.status(401).send("Cuenta o clave incorrecta");
    }

    await db.collection("usuarios").updateOne(
      { numeroCuenta },
      { $set: { intentosFallidos: 0 } }
    );

    const { clave: _, ...usuarioSeguro } = usuario;
    res.json(usuarioSeguro);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error en el servidor");
  }
});

// Cambiar clave
router.put("/:numeroCuenta/cambiar-clave", async (req, res) => {
  try {
    const { claveActual, nuevaClave } = req.body;

    if (!claveActual || !nuevaClave) {
      return res.status(400).send("Debe proporcionar la clave actual y la nueva clave");
    }

    if (claveActual === nuevaClave) {
      return res.status(400).send("La nueva clave no puede ser igual a la actual");
    }

    if (!/^\d{4}$/.test(nuevaClave)) {
      return res.status(400).send("La nueva clave debe ser exactamente 4 dígitos numéricos");
    }

    const db = await connectDB();
    const usuario = await db.collection("usuarios").findOne({ numeroCuenta: req.params.numeroCuenta });

    if (!usuario) return res.status(404).send("Cuenta no encontrada");

    // Comparar en mayúsculas
    if (usuario.estado.toUpperCase() !== "ACTIVO") {
      return res.status(403).send("Cuenta bloqueada o inactiva");
    }

    if (usuario.clave !== claveActual) {
      return res.status(401).send("La clave actual es incorrecta");
    }

    await db.collection("usuarios").updateOne(
      { numeroCuenta: req.params.numeroCuenta },
      { $set: { clave: nuevaClave } }
    );

    res.send("Clave actualizada correctamente");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error al cambiar la clave");
  }
});

// Login de administrador
router.post("/admin/login", async (req, res) => {
  try {
    const { usuario, clave } = req.body;

    if (!usuario || !clave) {
      return res.status(400).send("Faltan usuario o clave de administrador");
    }

    const db = await connectDB();
    const admin = await db.collection("admins").findOne({ usuario });

    if (!admin) {
      return res.status(401).send("Credenciales de administrador inválidas");
    }

    if (admin.estado !== "ACTIVO") {
      return res.status(403).send("Cuenta de administrador inactiva");
    }

    if (admin.clave !== clave) {
      return res.status(401).send("Credenciales de administrador inválidas");
    }

    const { clave: _, ...adminSeguro } = admin;
    res.json(adminSeguro);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error en el servidor");
  }
});
module.exports = router;