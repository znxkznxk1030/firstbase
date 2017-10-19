var dbconfig = require('./dbconfig.js');
var connection = require('mysql').createConnection(dbconfig);
//var connection = require('mysql').createPool(dbconfig);


connection.query('USE firstbase');

module.exports = connection;
