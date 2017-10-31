var connection = require('../database/db');
var user = require('./users');
var async = require('async');





var createComment = function(req, res){
    const data = req.body;

    const sql = "INSERT INTO comment (id, footprint_id, content) VALUES (?, ?, ?)";

    connection.query(sql, [req.user.id, data.footprintId, data.content], function(err, rows){
        if(err)
            return res.status(400)
                .json({code: -1,
                    message: err});

        return res.status(200)
            .json({code: 1,
                message: "success to write comment"});
    });
};

var getCommentsByFootprintId = function(req, res){
    const footprintId = req.query.footprintId;

    const sql = "SELECT * FROM comment WHERE footprint_id = ?";

    connection.query(sql, [footprintId], function(err, rows){
        if(err)
            return res.status(400)
                    .json({code: -1,
                        message: err});
        if(rows)
        {
            return res.status(200)
                .json(JSON.parse(JSON.stringify(rows)));
        }else
        {
            res.status(400)
                .json({code: -1,
                    message: 'rows not exist'});
        }
    });
};

exports.createComment = createComment;
exports.getCommentsByFootprintId = getCommentsByFootprintId;