const connection = require('./db');
var getImageUrl = require("../controller/files").getImageUrl;
const _ = require('underscore');
var async = require("async");

const profileDefaultKey = 'profiledefault.png';

const SQL_RETRIEVE_FOOTPRINT_BY_FOOTPRINT_ID =
    "SELECT footprint.*, view_count AS countView, count(comment.comment_id) AS countComments " +
    "FROM footprint " +
    "LEFT JOIN comment " +
    "ON footprint.footprint_id = comment.footprint_id " +
    "WHERE footprint.footprint_id = ? " +
    "GROUP BY footprint_id "

    , SQL_WATCH = "UPDATE footprint SET view_count = view_count + 1 WHERE footprint_id = ? "
    , SQL_IMAGE_LOAD = "SELECT * FROM image WHERE footprint_id = ?"
    , SQL_COUNT_LIKE =
    "SELECT count(*) AS countLike " +
    "FROM eval WHERE footprint_id = ? AND state = 1"
    , SQL_COUNT_DISLIKE =
    "SELECT count(*) AS countDisLike " +
    "FROM eval WHERE footprint_id = ? AND state = 2"
    , SQL_GET_COMMENTS =
    "SELECT comment.is_ban AS isBan, comment.comment_id AS commentId, comment.content ,comment.modified_date AS date, user.displayName, user.profile_key " +
    "FROM comment LEFT JOIN user " +
    "ON comment.id = user.id " +
    "WHERE comment.footprint_id = ? "
    , SQL_GET_PROFILE_IMAGE =
    "SELECT profile_key, displayName FROM user WHERE id = ?"
    , SQL_GET_LINKED_FOOTPRINT =
    "SELECT linked_footprint_id AS linkedFootprintId, rank FROM link WHERE link_footprint_id = ? ORDER BY rank"
    , SQL_GET_LINKED_FOOTPRINTS =
    "SELECT footprint.*" +
    "FROM footprint " +
    "LEFT JOIN link " +
    "ON footprint.footprint_id = link.linked_footprint_id " +
    "WHERE link.link_footprint_id = ? " +
    "GROUP BY footprint_id " +
    "ORDER BY link.rank"
    , SQL_FIND_AUTHOR = "SELECT * " +
    "FROM user " +
    "WHERE user.id = ? ";

var Footprint = function(params){

    const footprintId = params.footprintId
        , user = params.user;

    var retrieveFootprintByFootprintId = function(cb){
        connection.query(SQL_RETRIEVE_FOOTPRINT_BY_FOOTPRINT_ID, [footprintId],
            function (err, footprint) {
                if (err)
                    return cb(err);
                else {
                    var objectFootprint = JSON.parse(JSON.stringify(footprint))[0];

                    if (objectFootprint) {

                        var iconKey = objectFootprint.icon_key;

                        if (iconKey === null) {
                            iconKey = 'profiledefault.png';
                        }

                        const iconUrl = getImageUrl(iconKey);

                        return cb(null, _.extend(objectFootprint, {iconUrl: iconUrl}));
                    }
                    else
                        return cb({message: "error to find footprint"}, null);
                }
            });
    };



    var watch = function (footprint, cb) {
        connection.query(SQL_WATCH, [footprintId],
            function (err) {
                if (err)
                    return cb(err);
                return cb(null, footprint);
            });
    };
    var getLinkedFootprint = function (footprint, cb){
        if(footprint.type === 'link'){
            connection.query(SQL_GET_LINKED_FOOTPRINTS, [footprintId], function(err, linkedFootprintList){
                if(err){
                    return cb(true);
                }else{
                    linkedFootprintList = JSON.parse(JSON.stringify(linkedFootprintList));

                    async.map(linkedFootprintList, function(linkedFootprint, callback){
                        imageLoad(linkedFootprint, function(err, result){
                            if(err) callback(err);
                            callback(null, result);
                        });
                    }, function(err, linkedFoorprintListWithImages){
                        if(err) return cb(true);
                        else{
                            return cb(null, _.extend(footprint, {linkedFootprintList : linkedFoorprintListWithImages}));
                        }
                    });
                }
            });
        }else{
            return cb(null, footprint);
        }
    };
    var imageLoad = function (footprint, cb) {
        connection.query(SQL_IMAGE_LOAD, [footprint.footprint_id],
            function (err, imageInfo) {
                if (err) return cb(err);

                console.log(imageInfo);
                imageInfo = JSON.parse(JSON.stringify(imageInfo));

                var imageUrls = [];

                imageInfo.forEach(function (image) {
                    var imageUrl = getImageUrl(image.image_key);
                    imageUrls.push(imageUrl);
                });

                return cb(null, _.extend(footprint, {imageUrls: imageUrls}));
            });
    };
    var retrieveComments = function (footprint, cb) {
        connection.query(SQL_GET_COMMENTS, [footprintId],
            function (err, comments) {
                if (err) return cb(err);

                var ret = JSON.parse(JSON.stringify(comments));


                console.log(ret);

                ret = ret.map(function (comment) {

                    var profileKey = comment.profile_key;

                    if (profileKey === null) {
                        profileKey = 'profiledefault.png';
                    }

                    const profileUrl = getImageUrl(profileKey);

                    console.log(_.extend(comment, {profileUrl: profileUrl}));

                    return _.extend(comment, {profileUrl: profileUrl});
                });

                console.log(ret);
                return cb(null, _.extend(footprint, {comments: ret}));
            });
    };
    var countLike = function (footprint, cb) {
        connection.query(SQL_COUNT_LIKE, [footprintId],
            function (err, countLike) {
                if (err) return cb(err);

                return cb(null, _.extend(footprint, JSON.parse(JSON.stringify(countLike))[0]));
            });
    };
    var countDislike = function (footprint, cb) {
        connection.query(SQL_COUNT_DISLIKE, [footprintId],
            function (err, Dislike) {
                if (err) return cb(err);

                return cb(null, _.extend(footprint, JSON.parse(JSON.stringify(Dislike))[0]));
            });
    };
    var getProfileImage = function (footprint, cb) {
        connection.query(SQL_GET_PROFILE_IMAGE, [footprint.id],
            function (err, profile) {
                if (err) return cb(err);

                var profileKey;

                try{
                    footprint.displayName = JSON.parse(JSON.stringify(profile))[0].displayName;
                    profileKey = JSON.parse(JSON.stringify(profile))[0].profile_key;
                }catch(e){
                    profileKey = null;
                }


                if (profileKey === null) {
                    profileKey = 'profiledefault.png';
                }

                const profileUrl = getImageUrl(profileKey);

                delete footprint.id;
                console.log(profileUrl);
                return cb(null, _.extend(footprint, {profileUrl: profileUrl}));
            });
    };

    var findAuthor = function(cb){
        console.log('foorpintId : ' + footprintId);
        connection.query(SQL_FIND_AUTHOR, user.id, function (err, profile) {
            if (err) return cb(err);

            profile = JSON.parse(JSON.stringify(profile))[0];
            console.log(profile);
            var profileUrl, profileKey = profile.profile_key;
            if (profileKey) profileUrl = getImageUrl(profileKey);
            else profileUrl = getImageUrl(profileDefaultKey);

            return cb(null, {displayName : profile.displayName, profileUrl: profileUrl});
        });
    };

    var tasksForGetFootprint = [
        retrieveFootprintByFootprintId,
        watch,
        getLinkedFootprint,
        imageLoad,
        retrieveComments,
        countLike,
        countDislike,
        getProfileImage
    ];

    var tasksForGetFootprintByUserDisplayName = [
        findAuthor,
        countLike,
        countDislike
    ];

    return {
        tasksForGetFootprint : tasksForGetFootprint,
        tasksForGetFootprintByUserDisplayName: tasksForGetFootprintByUserDisplayName
    }
};

module.exports = {
    Footprint : Footprint
};