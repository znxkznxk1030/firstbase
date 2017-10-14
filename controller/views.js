var connection = require('../database/db');


var getViewCountByFootprintId = function(req, res){
    var footprintId = req.query.footprint_id;
    var sql = "SELECT count(*) AS viewCount FROM view WHERE footprint_id = ?";

    connection.query(sql, [footprintId], function(err, result){
        if(err) res.json({"message" : "error to load view count"});
        console.log(result);

        res.json(result);
    });
};

var testMakeViewCount = function(req, res){

};

exports.getViewCountByFootprintId = getViewCountByFootprintId;
exports.testMakeViewCount = testMakeViewCount;