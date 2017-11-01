var connection = require('../database/db');
var user = require('./users');
var async = require('async');
var util = require("../utils/util");


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

    connection.query(sql, [id, footprintId, content], function(err, result){
        if(err)
            return res.status(400)
                .json({code: -1,
                    message: err});

        return res.status(200)
            .json({code: 1,
                message: result});
    });
};

var updateComment = function(req, res){

    const id = req.user.id,
        commentId = req.body.commentId,
        content = req.body.content;

    if(commentId === null || typeof commentId === 'undefined' || commentId === ''){
        res.status(400).json({code: -1, message:"comment id가 잘못 들어왔습니다."});
    }

    if(content !== null || typeof content !== 'undefine' && content.length > 500)
    {
        res.status(400).json(util.message(-1, '댓글의 길이가 너무 깁니다.'));
    }

    const sqlGetAuthor = "SELECT id FROM comment WHERE comment_id = ?";
    const sqlUpdateComment = "UPDATE comment SET content = ? WHERE comment_id = ?";

    var task = [
        function(cb){
            connection.query(sqlGetAuthor, [commentId], function(err, author) {
                if(err) return cb(err, null);

                const objectAuthor = JSON.parse(JSON.stringify(author))[0];

                if(objectAuthor === id)
                {
                    return cb(null);
                }else{
                    return cb('작성자만 댓글 수정이 가능합니다.', null);
                }
            });
        },
        function(cb){
            connection.query(sqlUpdateComment, [content, commentId], function(err, result){
                if(err) return cb(err, null);

                return cb(result);
            });
        }
    ];

    async.series(task, function(err, result){
        if(err) {
            return res.status(400)
                .json(util.message(-1, err));
        }else{
            return res.status(200)
                .json(util.message(1, result));
        }
    });
};

var deleteComment = function(req, res){
    const id = req.user.id,
        commentId = req.body.commentId;

    if(commentId === null || typeof commentId === 'undefined' || commentId === ''){
        res.status(400).json({code: -1, message:"comment id가 잘못 들어왔습니다."});
    }

    const sqlGetAuthor = "SELECT id FROM comment WHERE comment_id = ?";
    const sqlDeleteComment = "DELETE FROM comment WHERE comment_id = ?";

    var task = [
        function(cb){
            connection.query(sqlGetAuthor, [commentId], function(err, author) {
                if(err) return cb(err, null);

                const objectAuthor = JSON.parse(JSON.stringify(author))[0];

                if(objectAuthor === id)
                {
                    return cb(null);
                }else{
                    return cb('작성자만 댓글 삭제가 가능합니다.', null);
                }
            });
        },
        function(cb){
            connection.query(sqlDeleteComment, [commentId], function(err, result){
                if(err) return cb(err, null);

                return cb(result);
            });
        }
    ];

    async.series(task, function(err, result){
        if(err) {
            return res.status(400)
                .json(util.message(-1, err));
        }else{
            return res.status(200)
                .json(util.message(1, result));
        }
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
exports.deleteComment = deleteComment;
exports.updateComment = updateComment;