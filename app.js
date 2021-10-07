const express = require('express')
const mysql = require('mysql');
var request = require('request'); // "Request" library

const CONFIG = require('./config');

const app = express()
const port = 3000

const db = mysql.createConnection({
  host: CONFIG.host,
  port: CONFIG.port,
  user: CONFIG.user,
  password: CONFIG.password,
  database: CONFIG.database,
  socketPath: CONFIG.socketPath
});

db.connect((err, db) => {
  if (err) throw err
  console.log("Connected !!!!")
})

var allowCrossDomain = function (req, res, next) {
  // Website you wish to allow to connect
  res.setHeader('Access-Control-Allow-Origin', '*');

  // Request methods you wish to allow
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

  // Request headers you wish to allow
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

  // Set to true if you need the website to include cookies in the requests sent
  // to the API (e.g. in case you use sessions)
  res.setHeader('Access-Control-Allow-Credentials', true);
  next();
}

app.use(allowCrossDomain);

app.get('/', (req, res) => {
  db.query("SELECT * FROM wrk_user", (err, result, fields) => {
    if (err) throw err;
    console.log(result);
  });
})

app.get('/query', async (req, res) => {
  const resultat = await new Promise((resolve, reject) => {
    let requete = `SELECT * FROM ${req.query.TABLE} `
    if (req.query.WHERE) {
      requete += `WHERE ${eq.query.WHERE}`
    }
    db.query(requete, (err, result) => {
      if (err) throw err;
      resolve(result);
    });
  })
  res.json(resultat)
})

app.get('/queryUneLigne', async (req, res) => {
  const resultat = await new Promise((resolve, reject) => {
    let requete = `SELECT * FROM ${req.query.TABLE} `
    requete += `WHERE ${req.query.WHERE}`
    db.query(requete, (err, result) => {
      if (err) throw err;
      resolve(result);
    });
  })
  res.json(resultat[0])
})

app.get('/queryLibre', async (req, res) => {
  const resultat = await new Promise((resolve, reject) => {
    db.query(req.query.QUERY, (err, result) => {
      if (err) throw err;
      resolve(result);
    });
  })
  res.json(resultat)
})

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})