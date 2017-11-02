var connection = require('../database/db');
var async = require('async');

var follow = function(req, res){

    const id = req.user.id,
        targetDisplayName = req.body.targetDisplayName;

    const sqlFollow =
        "INSERT INTO follow (follower_id, target_id) " +
        "VALUES (?, ?) ";

    const sqlGetId =
        "SELECT id FROM user WHERE displayName = ?";

    var task = [
        function(cb){
            connection.query(sqlGetId, [targetDisplayName], function(err, targetId){
                if(err) return cb(err, null);

                return cb(null, targetId);
            });
        },
        function(targetId, cb){
            connection.query(sqlFollow, [id, followId],
                function(err, result){
                    if(err) return cb(err, null);

                    return cb(null);
                });
        }
    ];


    async.waterfall(task, function(err, result){
        if(err) return res.status(400).json({code: -1, message: err});
        else{
            return res.status(200).json({code: 1, message:'팔로우 시작'});
        }

    });
};

var getFollowerList = function(req, res){

    const displayName = req.query.displayName;

    if(displayName === null || displayName === '' || displayName === 'undefined')
    {
        return res.status(400).json({code: -1, message: '닉네임이 비어있습니다.'});
    }

    const sqlGetFollowerList =
        "SELECT user.displayName " +
        "FROM user INNER JOIN follow " +
        "ON user.id = follow.target_id " +
        "WHERE user.displayName = ? ";

    connection.query(sqlGetFollowerList, displayName, function(err, followers){
        if(err) return res.status(400).json({code: -1, message: err});

        return res.status(200).json({code: 1, followers : followers, message: '팔로워 찾기 성공'});
    })


};

var getFollowingList = function(req, res){

    const displayName = req.query.displayName;

    if(displayName === null || displayName === '' || displayName === 'undefined')
    {
        return res.status(400).json({code: -1, message: '닉네임이 비어있습니다.'});
    }

    const sqlGetFollowerList =
        "SELECT user.displayName " +
        "FROM user INNER JOIN follow " +
        "ON user.id = follow.follower_id " +
        "WHERE user.displayName = ? ";

    connection.query(sqlGetFollowerList, displayName, function(err, followers){
        if(err) return res.status(400).json({code: -1, message: err});

        return res.status(200).json({code: 1, followers : followers, message: '팔로잉한 유저들 찾기 성공'});
    })

};

exports.follow = follow;
exports.getFollowerList = getFollowerList;
exports.getFollowingList = getFollowingList;