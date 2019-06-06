//Database
var pg = require('pg');
var connectionString = "AWS";

var client = new pg.Client(connectionString);
client.connect();

module.exports = client;
