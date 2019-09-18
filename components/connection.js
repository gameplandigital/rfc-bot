"use strict";

var mysql = require("mysql");
var http = require("http");
var express = require('express');
var app = express();
var bodyParser = require('body-parser');

var con = mysql.createConnection({
  host: "patsydb.com4k2xtorpw.ap-southeast-1.rds.amazonaws.com",
  user: "patsydigital01",
  password: "pAtsy06072018",
  database: "patsy_db",
  multipleStatements: true
});

con.connect(function(err) {
  if (err) throw err;
  console.log("MySQL Connected!");
});


module.exports.connection = con;


app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({// to support URL-encoded bodies
  extended: true
}));
