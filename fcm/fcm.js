var FCM = require('fcm-node');
var serverKey = require('../config').firebase.serverKey;
var fcm = new FCM(serverKey);
var _ = require('underscore');

const connection = require('../database/db');
var async = require("async");
var getImageUrl = require("../controller/files").getImageUrl;

const profileDefaultKey = 'profiledefault.png';

var sendCreateFootprintFcmToFollowers = function (userId, displayName, footprint) {

    const sqlGetFollowerList =
        "SELECT user.* " +
        "FROM user INNER JOIN follow " +
        "ON user.id = follow.follower_id " +
        "WHERE follow.target_id = ? ";

    connection.query(sqlGetFollowerList, userId, function (err, followerList) {
        if (err || followerList.length < 1) return false;
        else {
            followerList = JSON.parse(JSON.stringify(followerList));

            followerList.forEach(function (follower) {
                sendFcm(follower.device_token, 'footprint', displayName, footprint);
            });
        }
    });
};

var sendFollowFcm = function (followerDisplayName, targetDisplayName){
    const sqlGetTargetDeviceToken =
        "SELECT user.device_token FROM user WHERE displayName = ?";

    connection.query(sqlGetTargetDeviceToken, targetDisplayName, function(err, targetDeviceToken){
        if (err || targetDeviceToken.length < 1) return false;
        else{
            targetDeviceToken = JSON.parse(JSON.stringify(targetDeviceToken))[0];

            if(typeof targetDeviceToken.device_token !== 'undefined'){
                sendFcm(targetDeviceToken.device_token, 'follow', followerDisplayName, {});
            }
        }
    });
};

var sendFcm = function (token, type, displayName, content) {

    const sqlFindUser = "SELECT profile_key " +
        "FROM user " +
        "WHERE displayName = ? ";

    connection.query(sqlFindUser, displayName, function (err, author) {
        if (err || author.length < 1) return false;
        else {
            author = JSON.parse(JSON.stringify(author))[0];

            var profileUrl, profileKey = author.profile_key;
            if (profileKey) profileUrl = getImageUrl(author);
            else profileUrl = getImageUrl(profileDefaultKey);

            var message = { //this may vary according to the message type (single recipient, multicast, topic, et cetera)
                to: token,
                collapse_key: 'firstbase_default_key',

                notification: {
                    title: 'Title of your push notification',
                    body: 'Body of your push notification'
                },

                data: {  //you can send only notification or only data(or include both)
                    displayName: displayName,
                    profileUrl: profileUrl,
                    type: type
                }
            };

            _.extend(message.data, content);

            fcm.send(message, function (err, response) {
                if (err) {
                    console.log("Something has gone wrong!");
                } else {
                    console.log("Successfully sent with response: ", response);
                }
            });
            return true;
        }
    });
};

module.exports = {
    sendCreateFootprintFcmToFollowers: sendCreateFootprintFcmToFollowers,
    sendFcm : sendFcm,
    sendFollowFcm: sendFollowFcm
};