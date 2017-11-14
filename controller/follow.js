var connection = require('../database/db');
var async = require('async');

var unfollow = function(req, res){
    const id = req.user.id,
        targetDisplayName = req.body.targetDisplayName;

    const sqlGetId =
        "SELECT id FROM user WHERE displayName = ?";

    const sqlUnFollow =
        "DELETE FROM follow WHERE follower_id = ? AND target_id = ?";

    var task = [
        function(cb){
            connection.query(sqlGetId, [targetDisplayName], function(err, targetId){
                if(err) return cb(err, null);

                return cb(null, targetId);
            });
        },
        function(targetId, cb){
            connection.query(sqlUnFollow, [id, targetId],
                function(err, result){
                    if(err) return cb(err, null);

                    return cb(null);
                });
        }
    ];

    async.waterfall(task, function(err, result){
        if(err) return res.status(400).json({code: -1, message: '팔로우 오류'});
        else{
            return res.status(200).json({code: 1, message:'팔로우 시작'});
        }

    });

};

var follow = function(req, res){

    const id = req.user.id,
        targetDisplayName = req.body.targetDisplayName;

    const sqlFollow =
        "INSERT INTO follow (follower_id, target_id) " +
        "VALUES (?, ?) ";

    const sqlIsFollow =
        "SELECT * " +
        "FROM follow " +
        "WHERE follower_id = ? AND target_id = ? ";

    const sqlGetId =
        "SELECT id FROM user WHERE displayName = ?";

    const sqlUnFollow =
        "DELETE FROM follow WHERE follower_id = ? AND target_id = ?";


    var task = [
        function(cb){
            connection.query(sqlGetId, [targetDisplayName], function(err, targetId){
                if(err) return cb('해당 아이디가 없습니다.', null);

                return cb(null, JSON.parse(JSON.stringify(targetId))[0].id);
            });
        },
        function(targetId, cb){
            connection.query(sqlIsFollow, [id, targetId], function(err, isFollow){
                if(err) return cb('팔로우 오류', null);
                else{
                    if(JSON.parse(JSON.stringify(isFollow))[0]) {
                        connection.query(sqlUnFollow, [id, targetId],
                            function (err, result) {
                                if (err) return cb('팔로우 오류', null);

                                return cb(null, false);
                            });
                    }else{
                        connection.query(sqlFollow, [id, targetId],
                            function(err, result){
                                if(err) return cb('팔로우 오류', null);

                                return cb(null, true);
                            });
                    }
                }
            });
        }
    ];

    async.waterfall(task, function(err, result){
        if(err) return res.status(200).json({code: -1, message: err});
        else{
            console.log(result);
            return res.status(200).json({code: 1, isFollow: result, message: '팔로우를 한건지 안한건지 모르겠습니다.'});
        }

    });
};

var getFollowingList = function(req, res){

    const displayName = req.query.displayName;

    if(displayName === null || displayName === '' || displayName === 'undefined')
    {
        return res.status(400).json({code: -1, message: '닉네임이 비어있습니다.'});
    }

    const sqlGetId =
        "SELECT id FROM user WHERE displayName = ?";

    const sqlGetFollowingList =
        "SELECT user.* " +
        "FROM user INNER JOIN follow " +
        "ON user.id = follow.target_id " +
        "WHERE follow.follower_id = ? ";

    var task = [
        function(cb){
            connection.query(sqlGetId, displayName, function(err, id){
                if(err) return cb('팔로워 리스트 불러오기 오류');
                else{
                    id = JSON.parse(JSON.stringify(id))[0].id;

                    if(!id){
                        return cb('팔로워 리스트 불러오기 오류');
                    }else{
                        return cb(null, id);
                    }
                }
            });
        },
        function(id, cb){
            connection.query(sqlGetFollowingList, id, function(err, followings){
                if(err) return cb('팔로잉 리스트 불러오기 오류');

                followings = JSON.parse(JSON.stringify(followings));
                followings.map(function(followings){
                    delete followings.id;
                    return followings;
                });

                return cb(null, followings);

            });
        }
    ];

    async.waterfall(task, function(err, followings){
        if(err) return res.status(400).json({code: -1, message: err});
        else {
            return res.status(200).json({code: 1, followings: followings, message: '팔로잉 찾기 성공'});
        }
    });


};

var getFollowerList = function(req, res){

    const displayName = req.query.displayName;

    if(displayName === null || displayName === '' || displayName === 'undefined')
    {
        return res.status(400).json({code: -1, message: '닉네임이 비어있습니다.'});
    }

    const sqlGetId =
        "SELECT id FROM user WHERE displayName = ?";

    const sqlGetFollowerList =
        "SELECT user.* " +
        "FROM user INNER JOIN follow " +
        "ON user.id = follow.follower_id " +
        "WHERE follow.target_id = ? ";

    var task = [
        function(cb){
            connection.query(sqlGetId, displayName, function(err, id){
                if(err) return cb('팔로워 리스트 불러오기 오류');
                else{
                    id = JSON.parse(JSON.stringify(id))[0].id;

                    if(!id){
                        return cb('팔로워 리스트 불러오기 오류');
                    }else{
                        return cb(null, id);
                    }
                }
            });
        },
        function(id, cb){
            connection.query(sqlGetFollowerList, id, function(err, followers){
                if(err) return cb('팔로잉 리스트 불러오기 오류');

                followers = JSON.parse(JSON.stringify(followers));

                followers.map(function(follower){
                    delete follower.id;
                    return follower;
                });

                return cb(null, followers);

            });
        }
    ];

    async.waterfall(task, function(err, followers){
        if(err) return res.status(400).json({code: -1, message: err});
        else {
            return res.status(200).json({code: 1, followers: followers, message: '팔로잉 찾기 성공'});
        }
    });

};

exports.follow = follow;
exports.getFollowerList = getFollowerList;
exports.getFollowingList = getFollowingList;
exports.unfollow = unfollow;