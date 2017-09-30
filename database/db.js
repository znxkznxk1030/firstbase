var dbconfig = require('./dbconfig.js');
var connection = require('mysql').createConnection(dbconfig);

connection.query('USE firstbase');

module.exports = connection;
