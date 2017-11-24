const connection = require('./db');
var getImageUrl = require("../controller/files").getImageUrl;
const _ = require('underscore');

const sqlRetrieveFootprintByFootprintId =
    "SELECT footprint.*, view_count AS countView, count(comment.comment_id) AS countComments " +
    "FROM footprint " +
    "LEFT JOIN comment " +
    "ON footprint.footprint_id = comment.footprint_id " +
    "WHERE footprint.footprint_id = ? " +
    "GROUP BY footprint_id ";

const sqlWatch = "UPDATE footprint SET view_count = view_count + 1 WHERE footprint_id = ? ";

const sqlImageLoad = "SELECT * FROM image WHERE footprint_id = ?";
const sqlCountLike =
    "SELECT count(*) AS countLike " +
    "FROM eval WHERE footprint_id = ? AND state = 1";
const sqlCountDislike =
    "SELECT count(*) AS countDisLike " +
    "FROM eval WHERE footprint_id = ? AND state = 2";

const sqlRetrieveComments =
    "SELECT comment.is_ban AS isBan, comment.comment_id AS commentId, comment.content ,comment.modified_date AS date, user.displayName, user.profile_key " +
    "FROM comment LEFT JOIN user " +
    "ON comment.id = user.id " +
    "WHERE comment.footprint_id = ? ";

const sqlGetProfileImage =
    "SELECT profile_key, displayName FROM user WHERE id = ?";

const sqlGetLinkedFootprint =
    "SELECT linked_footprint_id AS linkedFootprintId, rank FROM link WHERE link_footprint_id = ? ORDER BY rank";

var Footprint = function(params){

    const footprintId = params.footprintId
        , user = params.user;

    var retrieveFootprintByFootprintId = function(cb){
        connection.query(sqlRetrieveFootprintByFootprintId, [footprintId],
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
        connection.query(sqlWatch, [footprintId],
            function (err) {
                if (err)
                    return cb(err);
                return cb(null, footprint);
            });
    };
    var getLinkedFootprint = function (footprint, cb){
        if(footprint.type === 'link'){
            connection.query(sqlGetLinkedFootprint, [footprintId], function(err, linkedFootprintList){
                if(err){
                    return cb(true);
                }else{
                    linkedFootprintList = JSON.parse(JSON.stringify(linkedFootprintList));
                    console.log(linkedFootprintList);
                    return cb(null, _.extend(footprint, {linkedFootprintList : linkedFootprintList}));
                }
            });
        }else{
            return cb(null, footprint);
        }
    };
    var imageLoad = function (footprint, cb) {
        connection.query(sqlImageLoad, [footprintId],
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
        connection.query(sqlRetrieveComments, [footprintId],
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
        connection.query(sqlCountLike, [footprintId],
            function (err, countLike) {
                if (err) return cb(err);

                return cb(null, _.extend(footprint, JSON.parse(JSON.stringify(countLike))[0]));
            });
    };
    var countDislike = function (footprint, cb) {
        connection.query(sqlCountDislike, [footprintId],
            function (err, Dislike) {
                if (err) return cb(err);

                return cb(null, _.extend(footprint, JSON.parse(JSON.stringify(Dislike))[0]));
            });
    };
    var getProfileImage = function (footprint, cb) {
        connection.query(sqlGetProfileImage, [footprint.id],
            function (err, profile) {
                if (err) return cb(err);


                footprint.displayName = JSON.parse(JSON.stringify(profile))[0].displayName;


                var profileKey = JSON.parse(JSON.stringify(profile))[0].profile_key;

                if (profileKey === null) {
                    profileKey = 'profiledefault.png';
                }

                const profileUrl = getImageUrl(profileKey);

                delete footprint.id;
                console.log(profileUrl);
                return cb(null, _.extend(footprint, {profileUrl: profileUrl}));
            });
    };

    var tasksGetFootprint = [
        retrieveFootprintByFootprintId,
        watch,
        getLinkedFootprint,
        imageLoad,
        retrieveComments,
        countLike,
        countDislike,
        getProfileImage
    ];

    return {
        tasksGetFootprint : tasksGetFootprint
    }
};

module.exports = {
    Footprint : Footprint
};