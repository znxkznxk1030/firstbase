const connection = require('./db');
const _ = require('underscore');
var async = require("async");
var getImageUrl = require("../controller/files").getImageUrl;
const profileDefaultKey = 'profiledefault.png';

const SQL_FIND_USER_BY_DISPLAYNAME =
    "SELECT * " +
    "FROM user " +
    "WHERE displayName = ? "

    , SQL_GET_FOLLOWER_COUNT =
    "SELECT count(*) AS countFollower FROM follow WHERE follow.target_id = ? "

    , SQL_GET_FOLLOWING_COUNT =
    "SELECT count(*) AS countFollowing FROM follow WHERE follow.follower_id = ? "

    , SQL_IS_FOLLOW =
    "SELECT * FROM follow WHERE follower_id = ? AND target_id = ?";

const MSG_USER_NOT_EXIST = '유저가 존재하지 않습니다'
    , MSG_FIND_USER_ERROR = '유저찾기 실패';

var User = function(params){

    const user = params.user,
        displayName = params.displayName;

    var findUser = function(cb){
        connection.query(SQL_FIND_USER_BY_DISPLAYNAME, displayName, function (err, profile) {
            if (err) return cb(MSG_FIND_USER_ERROR, null);

            if (profile[0]){
                profile = JSON.parse(JSON.stringify(profile))[0];
                return cb(null, profile);
            }
            else return cb(MSG_USER_NOT_EXIST, null);
        });
    };

    var attachProfileUrl = function (profile, cb) {
        var profileUrl, profileKey = profile.profile_key;
        //console.log(profileKey);
        if (profileKey) profileUrl = getImageUrl(profileKey);
        else profileUrl = getImageUrl(profileDefaultKey);

        return cb(null, _.extend(profile, {profileUrl: profileUrl}));
    };

    var sqlGetFollowerCount = function (profile, cb) {
        connection.query(SQL_GET_FOLLOWER_COUNT, [profile.id], function (err, countFollower) {
            if (err) return cb(err, null);
            return cb(null, _.extend(profile, JSON.parse(JSON.stringify(countFollower[0]))));
        });
    };

    var sqlGetFollowingCount = function (profile, cb) {
        connection.query(SQL_GET_FOLLOWING_COUNT, [profile.id], function (err, countFollowing) {
            if (err) return cb(err, null);
            return cb(null, _.extend(profile, JSON.parse(JSON.stringify(countFollowing[0]))));
        });
    };

    var sqlIsFollow = function (profile, cb) {
        if(typeof user !== 'undefined'){
            connection.query(SQL_IS_FOLLOW, [user.id, profile.id], function (err, Follow) {
                if (err) return cb(err, null);

                var isFollow = false;
                if (JSON.parse(JSON.stringify(Follow))[0]) {
                    isFollow = true;
                }

                return cb(null, _.extend(profile, {isFollow: isFollow}));
            });
        }
        else{
            return cb(null, profile);
        }
    };


    var tasksForGetUserInfoByUserDisplayName = [
        findUser,
        attachProfileUrl,
        sqlGetFollowerCount,
        sqlGetFollowingCount,
        sqlIsFollow
    ];

    var getUserInfoByUserDisplayName = function(callback){

        if (displayName.isNullOrUndefined) return callback('Not Authenticated');

        async.waterfall(tasksForGetUserInfoByUserDisplayName,
            function (err, profile) {
                if (err) {
                    return callback(MSG_FIND_USER_ERROR);
                }
                else {
                    return callback(null, profile);
                }
            });
    };

    return {
        getUserInfoByUserDisplayName: getUserInfoByUserDisplayName
    }
};

module.exports = {
    User: User
};