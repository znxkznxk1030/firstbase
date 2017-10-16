var connection = require('../database/db');
var user = require('../passport_auth/user');
var async = require('async');

var createComment = function(req, res){
    const data = req.body;

    const sql = "INSERT INTO comment (id, footprint_id, content) VALUES (?, ?, ?)";

    connection.query(sql, [req.user.id, data.footprintId, data.content], function(err, rows){
        if(err) return res.json(err);

        res.json({message: "success to write comment"});
    });
};

var getCommentsByFootprintId = function(req, res){
    const footprintId = req.query.footprintid;

    const sql = "SELECT * FROM comment WHERE footprint_id = ?";

    connection.query(sql, [footprintId], function(err, rows){
        if(err) return res.json(err);

        res.json(JSON.parse(JSON.stringify(rows)));
    });
};

exports.createComment = createComment;
exports.getCommentsByFootprintId = getCommentsByFootprintId;