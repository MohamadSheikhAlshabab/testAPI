'use strict';

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pg = require('pg');
const superagent = require('superagent');
const methodOverride = require('method-override');

const PORT = process.env.PORT || 6000;
const app = express();
const client = new pg.Client(process.env.DATABASE_URL);

app.use(cors());
app.use(express.json());
app.use(express.static('./public'));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.set('view engine', 'ejs');

app.get('/', homeHandler);

function homeHandler(req, res) {
  // let url = 'https://digimon-api.herokuapp.com/api/digimon';
  let url='https://digimon-api.vercel.app/api/digimon';
  superagent.get(url).then((data) => {
    let digiArray = data.body.map((vals) => {
      return new Digimons(vals);
    });
    res.render('index', { data: digiArray });
  });
}
function Digimons(vals) {
  this.name = vals.name || 'no name';
  this.img = vals.img || 'no img';
  this.level = vals.level || 'no level';
}
app.get('/addToDb', addToDbHandler);
function addToDbHandler(req, res) {
  let { name, img, level } = req.query;
  let sql = 'INSERT INTO digimonss (name,img,level)VALUES($1,$2,$3);';
  let safeVal = [name, img, level];
  client.query(sql, safeVal).then(() => {
    res.redirect('/selectData');
  });
}
app.get('/selectData', selectDataHandler);
function selectDataHandler(req, res) {
  let sql = 'SELECT * FROM digimonss;';
  client.query(sql).then((result) => {
    res.render('pages/favorite', { data: result.rows });
  });
}
app.get('/details/:dig_id', detailsHandler);
function detailsHandler(req, res) {
  let param = req.params.dig_id;
  let sql = 'SELECT *  FROM digimonss WHERE id = $1;';
  let safeVal = [param];
  client.query(sql, safeVal)
    .then(result => {
      res.render('pages/detail', { data: result.rows[0] });
    });
}
app.put('/update/:digi_id', updateHandler);
function updateHandler(req, res) {
  let param = req.params.digi_id;
  let { name, img, level } = req.body;
  let sql = 'UPDATE digimonss SET name=$1,img=$2,level=$3 WHERE id=$4;';
  let safeVal = [name, img, level, param];
  client.query(sql, safeVal)
    .then(() => {
      res.redirect(`/details/${param}`);
    });
}

+


client.connect().then(() => {
  app.listen(PORT, () => console.log(`up and run on PORT ${PORT} `));
});

const notFoundHandler = (req, res) => {
  res.status(404).send('not found');
};

function errorHandler(error, req, res) {
  res.status(500).send(error);
}

app.use('*', notFoundHandler);
