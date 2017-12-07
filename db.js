//Database
var pg = require('pg');
var connectionString = "tcp://postgres:admin@localhost:5432/pg_express";

var client = new pg.Client(connectionString);
client.connect();

module.exports = client;