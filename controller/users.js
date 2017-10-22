const connection = require('../database/db');
const async = require('async');
const retrieveByKey = require("./files").retrieveByKey;
const profileDefaultKey = 'profiledefault.png';
const _ = require('underscore');

var nicknameCheck = function(req, res){

    const nickName = req.param.nickName;
    const sql = "SELECT * FROM user WHERE user.displayName = ?";
    connection.query(sql, [nickName], function(err, profile){
        if (err) return res.json({code: -1, message: 'sql error'});

        if(profile.displayName){
            res.json({code:-1, message : 'this name is already existed!'});
        }else{
            res.json({code:1, message : 'possible to use'});
        }
    })
};

var updateUserInfo = function(req, res){
    const sql = "UPDATE user SET displayName = ?, description = ? WHERE user.id = ? ";
    const data = req.body;

    connection.query(sql, [data.displayName, data.description, req.user.id],
        function(err, userUpdated){
            if(err) return res.json({code:-1, message:'sql error'});
            return res.json({code: 1, message:'success to update profile'});
    });
};

var updateUserImage = function(req, res){
    const sql = "UPDATE user SET profile_key = ? WHERE user.id = ? ";

    uploadUserImage(req, function(err, profileImage){
        if(err) res.json(err);
        connection.query(sql, [profileImage.key],
            function(err, userUpdated){
                if(err) return res.json({code:-1, message:'sql error'});
                return res.json({code: 1, profileUrl: profileImage.url});
            })
    });
};

var getUserInfo = function(req, res){

    const sql = "SELECT id, displayName, provider, description, profile_key AS profileKey " +
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
            var profileUrl;

            if(profile.profile_key) profileUrl = retrieveByKey(profile.profile_key);
            else profileUrl = retrieveByKey(profileDefaultKey);


            cb(null, _.extend(profile[0], {profileUrl: profileUrl}));
        }
    ];

    async.waterfall(task, function(err, profile){
        if(err) return res.json(err);
        return res.json(profile);
    });
};

exports.nicknameCheck = nicknameCheck;
exports.getUserInfo = getUserInfo;
exports.updateUserInfo = updateUserInfo;
exports.updateUserImage = updateUserImage;