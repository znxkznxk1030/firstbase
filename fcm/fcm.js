var FCM = require('fcm-node');
var serverKey = require('../config').firebase.serverKey;
var fcm = new FCM(serverKey);

const connection = require('../database/db');
var async = require("async");
var getImageUrl = require("../controller/files").getImageUrl;

const profileDefaultKey = 'profiledefault.png';

var sendCreateFootprintFcmToFollowers = function(userId, displayName, title){
    const sqlFindUser = "SELECT profile_key " +
        "FROM user " +
        "WHERE user.id = ? ";

    const sqlGetFollowerList =
        "SELECT user.* " +
        "FROM user INNER JOIN follow " +
        "ON user.id = follow.follower_id " +
        "WHERE follow.target_id = ? ";

    var task = [
        function(cb){
            connection.query(sqlFindUser, userId, function(err, author){
                if(err || author.length < 1) return cb(true);
                else{
                    author = JSON.parse(JSON.stringify(author))[0];

                    var profileUrl, profileKey = author.profile_key;
                    if (profileKey) profileUrl = getImageUrl(author);
                    else profileUrl = getImageUrl(profileDefaultKey);

                    return cb(null, profileUrl);
                }
            });
        },
        function(profileUrl, cb){
            connection.query(sqlGetFollowerList, userId, function(err, followerList){
                if(err || followerList.length < 1) return cb(true);
                else{
                    followerList = JSON.parse(JSON.stringify(followerList));

                    followerList.forEach(function(follower){
                        sendFcm(follower.device_token, displayName, profileUrl, title);
                    });
                }
            });
            cb(null);
        }
    ];

    async.waterfall(task, function(err, result){
        if(err) {
            return true;
        }else{
            return false;
        }
    });
};

var sendFcm = function(token, displayName, profileUrl, title){
    var message = { //this may vary according to the message type (single recipient, multicast, topic, et cetera)
        to: token,
        collapse_key: 'firstbase_default_key',

        notification: {
            title: 'Title of your push notification',
            body: 'Body of your push notification'
        },

        data: {  //you can send only notification or only data(or include both)
            displayName : displayName,
            profileUrl: profileUrl,
            title: title
        }
    };

    fcm.send(message, function (err, response) {
        if (err) {
            console.log("Something has gone wrong!");
        } else {
            console.log("Successfully sent with response: ", response);
        }
    });
};

module.exports = {
    sendCreateFootprintFcmToFollowers : sendCreateFootprintFcmToFollowers
};