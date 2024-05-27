const express = require("express");
const cors = require("cors");
const { pool } = require("./database/connection.js");
const app = express();
const { Reporte } = require("./middleware/Reporte.js");

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on PORT:${PORT}`);
});

app.use(express.json());
app.use(cors());

app.get("/joyas", Reporte, async (req, res) => {
  try {
    const { limits, page, order_by } = req.query;
    let consultas = "";
    if (order_by) {
      const [campo, ordenamiento] = order_by.split("_");
      consultas += ` ORDER BY  ${campo}  ${ordenamiento}`;
    }
    if (limits) {
      consultas += ` LIMIT ${limits}`;
    }
    if (page && limits) {
      const offset = page * limits - limits;
      consultas += ` OFFSET ${offset}`;
    }
    const query = ` SELECT * FROM inventario ${consultas};`;
    const { rows: joyas } = await pool.query(query);
    const results = joyas.map((joya) => {
      return {
        name: joya.nombre,
        href: `/joyas/joya/${joya.id}`,
        stock: joyas.stock,
    }})
    const totalJoyas = joyas.length;
    const stockTotal = joyas.reduce(
      (acumulador, valorActual) => acumulador + valorActual.stock,
      0
    );
    const HATEOAS = { results, totalJoyas, stockTotal };
    res.json(HATEOAS);
   }catch (error) {
    res.status(500).send(error);
   }
    });

app.get("/joyas/joya/:id", Reporte, async (req, res) => {
    try {
        const {id} = req.params;
        const query = "SELECT * FROM inventario WHERE id = $1;";
        const values = [id];
        const { rows: data} = await pool.query(query, values);
        res.json(data);
    } catch (error) {
        res.status(500).send(error);
    }
})

app.get("/joyas/filtros", Reporte, async (req, res) => {
    try {
       const {precio_max, precio_min, metal, categoria} = req.query;
       let filtros = [];
       const values = [];
       const agregarFiltro = (campo, comparador, valor) => { 
        values.push(valor);
        const posicion = filtros.length + 1;
        filtros.push(`${campo} ${comparador} $${posicion}`); //ex: id = $1 
    }
    if(precio_max) {
        agregarFiltro("precio", "<=", precio_max)
    }
    if(precio_min) {
        agregarFiltro("precio", ">=", precio_min)
    }
    if(categoria){
        agregarFiltro("categoria", "=" , categoria)
    }
    if(metal){
        agregarFiltro("metal", "=" , metal)
    }

    const nuevosFiltros = filtros.join(" AND ");
    filtros = ` WHERE ${nuevosFiltros}`;
    const query = `SELECT * FROM inventario ${filtros};`;
    const { rows: data } = await pool.query(query, values);
    res.json(data);

    } catch (error) {
        res.status(500).send(error);
    }
})

app.get("*", Reporte, (req, res) => {
    res.status(404).send("Esta ruta no existe")
})
