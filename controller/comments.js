var connection = require('../database/db');
var user = require('./users');
var async = require('async');


var createComment = function(req, res){

    const id = req.user.id,
        footprintId = req.body.footprintId,
        content = req.body.content;

    if(content !== null && content !== 'undefined' && content.length > 500)
    {
        return res.status(400)
            .json({code: -1,
                message: "댓글의 길이가 너무 깁니다."});
    }

    const sql = "INSERT INTO comment (id, footprint_id, content) VALUES (?, ?, ?)";

    connection.query(sql, [id, footprintId, content], function(err, rows){
        if(err)
            return res.status(400)
                .json({code: -1,
                    message: err});

        return res.status(200)
            .json({code: 1,
                message: "댓글 작성 완료"});
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