var connection = require('../database/db');
var async = require('async');

var follow = function(req, res){

    const id = req.user.id,
        followId = req.body.followId;

    const sqlFollow =
        "INSERT INTO follow (follower_id, following_id) " +
        "VALUES (?, ?) ";

    connection.query(sqlFollow, [id, followId],
        function(err, result){
            if(err) return res.status(400).json({code: -1, message: err});

            return res.status(200).json({code: 1, message:'팔로우 시작'});
    });
};

exports.follow = follow;