// routes/cajero.js
const express = require("express");
const connectDB = require("../db");
const router = express.Router();

// Obtener todos los cajeros (para admin o monitoreo)
router.get("/", async (req, res) => {
  try {
    const db = await connectDB();
    const cajeros = await db.collection("cajero").find().toArray();
    res.json(cajeros);
  } catch (error) {
    res.status(500).send("Error al obtener cajeros");
  }
});

// Crear un nuevo cajero (para admin)
router.post("/", async (req, res) => {
  try {
    const db = await connectDB();
    await db.collection("cajero").insertOne(req.body);
    res.send("Cajero creado correctamente");
  } catch (error) {
    res.status(500).send("Error al crear cajero");
  }
});

router.put("/:codigoCajero", async (req, res) => {
  try {
    const db = await connectDB();
    await db.collection("cajero").updateOne(
      { codigoCajero: req.params.codigoCajero },
      { $set: req.body }
    );
    res.send("Cajero actualizado correctamente");
  } catch (error) {
    res.status(500).send("Error al actualizar cajero");
  }
});
router.post("/retirar", async (req, res) => {
  try {
    const { numeroCuenta, monto } = req.body;
    const montoNum = Number(monto);

    if (!numeroCuenta || isNaN(montoNum) || montoNum <= 0) {
      return res.status(400).send("Número de cuenta o monto inválido");
    }

    const db = await connectDB();

    // Buscar usuario
    const usuario = await db.collection("usuarios").findOne({ numeroCuenta });
    if (!usuario) return res.status(404).send("Cuenta no encontrada");
    if (usuario.estado !== "ACTIVO") return res.status(403).send("Cuenta bloqueada o inactiva");

    // Cargar configuración general
    const config = (await db.collection("configuracion").find().limit(1).toArray())[0] || {};
    const maxRetiro = config.retiroMaximo || 300;
    const denominaciones = config.denominaciones || [5, 10, 20, 50, 100];

    if (montoNum > maxRetiro) {
      return res.status(400).send(`El monto máximo por retiro es $${maxRetiro}`);
    }

    // Validar múltiplo de denominaciones
    const esMultiploValido = denominaciones.some(d => montoNum % d === 0);
    if (!esMultiploValido) {
      return res.status(400).send("Monto no válido según denominaciones del cajero");
    }

    // Buscar el cajero activo (usamos ATM01 por defecto)
    const cajero = await db.collection("cajero").findOne({ codigoCajero: "ATM01" });
    if (!cajero) return res.status(500).send("Cajero no encontrado");
    if (cajero.estado !== "OPERATIVO") {
      return res.status(503).send("Cajero fuera de servicio en este momento");
    }

    // Validar saldo disponible en el cajero
    if (cajero.saldoDisponible < montoNum) {
      // Marcar cajero como fuera de servicio
      await db.collection("cajero").updateOne(
        { codigoCajero: "ATM01" },
        { $set: { estado: "FUERA_SERVICIO", ultimaActualizacion: new Date() } }
      );
      return res.status(400).send("El cajero no tiene suficiente dinero disponible. Intente más tarde.");
    }

    // Validar saldo del usuario
    if (montoNum > usuario.saldo) {
      return res.status(400).send("Saldo insuficiente en su cuenta");
    }

    // Realizar retiro del usuario
    const nuevoSaldoUsuario = usuario.saldo - montoNum;
    await db.collection("usuarios").updateOne(
      { numeroCuenta },
      { $set: { saldo: nuevoSaldoUsuario } }
    );

    // Descontar del cajero físico
    const nuevoSaldoCajero = cajero.saldoDisponible - montoNum;
    await db.collection("cajero").updateOne(
      { codigoCajero: "ATM01" },
      { $set: { saldoDisponible: nuevoSaldoCajero, ultimaActualizacion: new Date() } }
    );

    // Registrar transacción
    await db.collection("transacciones").insertOne({
      numeroCuenta,
      tipo: "RETIRO",
      monto: montoNum,
      saldoAnterior: usuario.saldo,
      saldoFinal: nuevoSaldoUsuario,
      fecha: new Date(),
      descripcion: "Retiro desde cajero ATM01"
    });

    res.json({
      exito: true,
      mensaje: "Retiro realizado con éxito",
      nuevoSaldo: nuevoSaldoUsuario
    });

  } catch (error) {
    console.error(error);
    res.status(500).send("Error al procesar el retiro");
  }
});

router.post("/depositar", async (req, res) => {
  try {
    const { numeroCuenta, monto } = req.body;
    const montoNum = Number(monto);

    if (!numeroCuenta || isNaN(montoNum) || montoNum <= 0) {
      return res.status(400).send("Número de cuenta o monto inválido");
    }

    const db = await connectDB();

    const usuario = await db.collection("usuarios").findOne({ numeroCuenta });
    if (!usuario) {
      return res.status(404).send("Cuenta no encontrada");
    }
    if (usuario.estado !== "activo") {
      return res.status(403).send("Cuenta bloqueada o inactiva");
    }

    const nuevoSaldo = usuario.saldo + montoNum;

    await db.collection("usuarios").updateOne(
      { numeroCuenta },
      { $set: { saldo: nuevoSaldo } }
    );

    await db.collection("transacciones").insertOne({
      numeroCuenta,
      tipo: "deposito",
      monto: montoNum,
      saldoAnterior: usuario.saldo,
      saldoFinal: nuevoSaldo,
      fecha: new Date(),
      descripcion: "Depósito en cajero automático"
    });

    res.json({
      exito: true,
      mensaje: "Depósito realizado con éxito",
      nuevoSaldo: nuevoSaldo
    });

  } catch (error) {
    console.error(error);
    res.status(500).send("Error al procesar el depósito");
  }
});

module.exports = router;