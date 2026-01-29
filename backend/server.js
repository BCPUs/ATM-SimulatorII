//server.js
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const path = require("path");
app.use(express.static(path.join(__dirname, "../frontend")));

app.use("/usuarios", require("./routes/usuarios"));
app.use("/cajero", require("./routes/cajero"));
app.use("/transacciones", require("./routes/transacciones"));
app.use("/configuracion", require("./routes/configuracion"));

app.listen(3000, () => {
  console.log("Servidor corriendo en http://localhost:3000");
});
