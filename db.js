//Database
var pg = require('pg');
var connectionString = "tcp://postgres://jrvenknemncwiw:e30025c1205881535893b0a93dd41a2b6e4da3e17f425066f31484f2c566489f@ec2-54-243-39-245.compute-1.amazonaws.com:5432/d9dkdotlj74l6o";

var client = new pg.Client(connectionString);
client.connect();

module.exports = client;