'use strict';

require('dotenv').config();
const express = require("express");
const cors = require("cors");
const pg = require("pg");
const superagent = require("superagent");
const methodOverride = require("method-override");

const PORT = process.env.PORT || 3000;
const app = express();
const client = new pg.Client(process.env.DATABASE_URL);

app.use(cors());
app.use(express.json());
app.use(express.static("./public"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.set("view engine", "ejs");

app.get("/", homeHandler);
function homeHandler(req, res) {
  let url = "https://digimon-api.herokuapp.com/api/digimon";
  superagent.get(url).then((data) => {
    let digiArray = data.body.map((vals) => {
      return new Digimons(vals);
    });
    res.render("index", { data: digiArray });
  });
}
app.get("/addToDb", addToDbHandler);
app.get("/selectData", selectDataHandler);
function addToDbHandler(req, res) {
  let { name, img, level } = req.query;
  let sql = "INSERT INTO digimonss (name,img,level)VALUES($1,$2,$3);";
  let safeVal = [name, img, level];
  client.query(sql,safeVal).then(() => {
    res.redirect("/selectData");
  });
}
function selectDataHandler(req, res) {
  let sql = "SELECT * FROM digimonss;";
  client.query(sql).then((result) => {
    res.render("pages/favorite", { data: result.rows });
  });
}
// app.post();
// app.put();
// app.delete();

function Digimons(vals) {
  this.name = vals.name;
  this.img = vals.img;
  this.level = vals.level;
}
client.connect().then(() => {
  app.listen(PORT, () => console.log(`up and run on PORT ${PORT}`));
});

const notFoundHandler = (req, res) => {
  res.status(404).send("not found");
};

function errorHandler(error, req, res) {
  res.status(500).send(error);
}

app.use("*", notFoundHandler);
