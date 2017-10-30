const connection = require('../database/db');
const async = require('async');
const retrieveByKey = require("./files").retrieveByKey;
const profileDefaultKey = 'profiledefault.png';
const _ = require('underscore');
var uploadUserImage = require("./files").uploadUserImage;

var nicknameCheck = function(req, res){

    const nickName = req.param.nickName;
    const sql = "SELECT * FROM user WHERE user.displayName = ?";

    //todo: validate nickName
    if(!nickName)
    {
        return res.status(200)
            .json({code: -1,
                isPossible: -1,
                message: "nickName should be not null"});
    }


    connection.query(sql, [nickName],
        function(err, profile){
            if (err) return res.status(400)
                .json({code: -1,
                    message: err});

            if(profile.displayName){
                return res.status(200)
                    .json({code: 1,
                        isPossible: -1,
                        message : 'this name is already existed!'});
            }else{
                return res.status(200)
                    .json({code:1,
                        isPossible: 1,
                        message : 'possible to use'});
            }
    })
};

var updateUserInfo = function(req, res){
    const sql = "UPDATE user SET displayName = ?, description = ? WHERE user.id = ? ";
    const body = req.body;

    const user = req.user;

    const displayName = body.displayName;
    var description = body.description;

    // todo: vaildate parameters
    if(!displayName)
    {
        return res.status(400)
            .json({code: -1,
            message: "display name should be not null"});
    }

    if(!description)
    {
        description = "Say Something About Me";
    }

    connection.query(sql, [displayName, description, user.id],
        function(err, userUpdated){
            if(err)
                return res.status(400)
                    .json({code:-1,
                        message:'sql error'});

            return res.status(200)
                .json({code: 1,
                    message:'success to update profile'});
    });
};

var updateUserImage = function(req, res){
    const sql = "UPDATE user SET profile_key = ? WHERE user.id = ? ";

    uploadUserImage(req, function(err, profileImage){
        if(err) res.json(err);
        connection.query(sql, [profileImage.key, req.user.id],
            function(err, userUpdated){
                if(err) return res.status(400)
                                .json({code: -1,
                                    message: err});

                if(userUpdated)
                {
                    return res.status(200)
                        .json({code: 1,
                            profileUrl: profileImage.url});
                }else
                {
                    return res.status(400)
                        .json({code:-1,
                            message:'update error'});
                }
            });
    });
};

var getUserInfoByUserDisplayName = function(req, res){
    const sql = "SELECT displayName, provider, description, profile_key " +
        "FROM user " +
        "WHERE user.displayName = ? ";

    const displayName = req.query.displayName;

    const task = [
        function(cb){
            //console.log("dd" + req.user.id);
            if(!displayName.isNullOrUndefined) return cb(null, displayName);
            else return cb({code: -1, message: 'Not Authenticated'}, null);
        },
        function(displayName, cb){
            connection.query(sql, displayName, function(err, profile){
                if (err) return cb({code: -1, message: 'sql error'}, null);

                if(profile[0])
                    return cb(null, profile);
                else return cb('user is not existed', null);
            });
        },
        function(profile, cb){
            var profileUrl, profileKey = JSON.parse(JSON.stringify(profile))[0].profile_key;
            //console.log(profileKey);
            if(profileKey) profileUrl = retrieveByKey(profileKey);
            else profileUrl = retrieveByKey(profileDefaultKey);

            return cb(null, _.extend(profile[0], { profileUrl: profileUrl }));
        }
    ];

    async.waterfall(task,
        function(err, profile){
            if(err) return res.status(400)
                .json({code: -1,
                    message:err});

            return res.status(200)
                .json(profile);
        });
};

var getUserInfoByUserId = function(req, res){

    const sql = "SELECT displayName, provider, description, profile_key " +
        "FROM user " +
        "WHERE user.id = ? ";

    const id = req.query.id;

    const task = [
        function(cb){
            //console.log("dd" + req.user.id);
            if(!id.isNullOrUndefined) return cb(null, id);
            else return cb({code: -1, message: 'Not Authenticated'}, null);
        },
        function(id, cb){
            connection.query(sql, id, function(err, profile){
                if (err) return cb({code: -1, message: 'sql error'}, null);

                return cb(null, profile);
            });
        },
        function(profile, cb){
            var profileUrl, profileKey = JSON.parse(JSON.stringify(profile))[0].profile_key;
            //console.log(profileKey);
            if(profileKey) profileUrl = retrieveByKey(profileKey);
            else profileUrl = retrieveByKey(profileDefaultKey);

            return cb(null, _.extend(profile[0], { profileUrl: profileUrl }));
        }
    ];

    async.waterfall(task,
        function(err, profile){
            if(err) return res.status(400)
                .json({code: -1,
                    message:err});

            return res.status(200)
                .json(profile);
        });
};

var getUserInfoByReqHeader = function(req, res){

    const sql = "SELECT id, displayName, provider, description, profile_key " +
        "FROM user " +
        "WHERE user.id = ? ";

    const task = [
        function(cb){
            //console.log("dd" + req.user.id);
            if(req.user) cb(null, req.user);
            else cb({code: -1, message: 'Not Authenticated'}, null);
        },
        function(user, cb){
            //console.log(user);
            connection.query(sql, user.id, function(err, profile){
                if (err) return cb({code: -1, message: 'sql error'}, null);

                return cb(null, profile);
            });
        },
        function(profile, cb){
            var profileUrl, profileKey = JSON.parse(JSON.stringify(profile))[0].profile_key;
            //console.log(profileKey);
            if(profileKey) profileUrl = retrieveByKey(profileKey);
            else profileUrl = retrieveByKey(profileDefaultKey);

            return cb(null, _.extend(profile[0], { profileUrl: profileUrl }));
        }
    ];

    async.waterfall(task,
        function(err, profile){
            if(err) return res.status(400)
                            .json({code: -1,
                                message:err});

            return res.status(200)
                .json(profile);
    });
};

exports.nicknameCheck = nicknameCheck;
exports.getUserInfoByReqHeader = getUserInfoByReqHeader;
exports.updateUserInfo = updateUserInfo;
exports.updateUserImage = updateUserImage;
exports.getUserInfoByUserDisplayName = getUserInfoByUserDisplayName;
exports.getUserInfoByUserId = getUserInfoByUserId;