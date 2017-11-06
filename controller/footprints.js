const connection = require('../database/db');
const user = require('./users');
const locationUtil = require('../utils/locationUtil');
const async = require('async');
const bucketName = 'firstbase-bucket';
const AWS = require('aws-sdk');
const profileDefaultKey = 'profiledefault.png';

const _=require('underscore');
var util = require("../utils/util");
var getImageUrl = require("./files").getImageUrl;
var retrieveByKey = require("./files").retrieveByKey;

AWS.config.loadFromPath('s3config.json');

/**
 *  standard time : seoul ( ap-northeast-2 )
 * @type {S3}
 */
const s3 = new AWS.S3({ region : 'ap-northeast-2' });


var getAuthor = function(footprintId, cb){

    const sqlGetAuthor = "SELECT footprint.id FROM footprint WHERE footprint_id = ?";

    connection.query(sqlGetAuthor, [footprintId], function(err, author){
        if (err) return cb(err, null);

        const objectAuthor = JSON.parse(JSON.stringify(author))[0];

        if(objectAuthor) return cb(null, objectAuthor);
        else return cb('없는 게시글입니다.', null);
    });
};

var getFootprintListByDisplayName = function(req, res){
    const id = req.author.id;

    const sqlRetrieveFootprint =
        "SELECT footprint.*, count(view.view_id) AS countView, count(comment.comment_id) AS countComments " +
        "FROM footprint LEFT JOIN view " +
        "ON footprint.footprint_id = view.footprint_id " +
        "LEFT JOIN comment " +
        "ON footprint.footprint_id = comment.footprint_id " +
        "WHERE footprint.id = ? " +
        "GROUP BY footprint_id ";

    const sqlFindUser = "SELECT profile_key " +
        "FROM user " +
        "WHERE user.id = ? ";

    const sqlCountLike =
        "SELECT count(*) AS countLike " +
        "FROM eval WHERE footprint_id = ? AND state = 1";

    const sqlCountDislike =
        "SELECT count(*) AS countDisLike " +
        "FROM eval WHERE footprint_id = ? AND state = 2";

    connection.query(sqlRetrieveFootprint,[id],
        function(err, footprintList){
            if(err)
                return res.status(400).json(util.message(-1, '게시물 리스트 불러오기 오류'));

            var footprintListJSON = JSON.parse(JSON.stringify(footprintList));

            async.map(footprintListJSON, function(footprint, cb){

                var task = [
                    function(callback){
                        connection.query(sqlFindUser, footprint.id, function(err, profile){
                            if (err) return callback(err);

                            profile = JSON.parse(JSON.stringify(profile))[0];

                            footprint.displayName = profile.displayName;

                            var profileUrl, profileKey = profile.profile_key;
                            if(profileKey) profileUrl = getImageUrl(profileKey);
                            else profileUrl = getImageUrl(profileDefaultKey);

                            return callback(null, { profileUrl: profileUrl });
                        });
                    },
                    function(tails, callback){
                        connection.query(sqlCountLike, [footprint.footprint_id],
                            function(err, countLike){
                                if(err) return callback(err);

                                const ret = JSON.parse(JSON.stringify(countLike))[0];

                                return callback(null, _.extend(tails, ret));
                            });
                    },
                    function(tails, callback){
                        connection.query(sqlCountDislike, [footprint.footprint_id],
                            function(err, Dislike){
                                if(err) return callback(err);

                                const ret = JSON.parse(JSON.stringify(Dislike))[0];

                                return callback(null, _.extend(tails, ret));
                            });
                    }

                ];

                async.waterfall(task, function(err, tails){
                    if (err) return cb(err);
                    return cb(null, _.extend(footprint, tails));
                });
            }, function(err, result){
                if (err) return res.status(400).json(util.message(-1, '게시물 리스트 불러오기 오류'));

                else res.status(200).json(result);
            });
        });
};

var getFootprintList = function(req, res){

    const data = req.query;

    //todo: between
    //todo: mysql 반경검색

    const sqlRetrieveFootprint =
        "SELECT footprint.*, count(comment.comment_id) AS countComments " +
        "FROM footprint LEFT JOIN view " +
        "ON footprint.footprint_id = view.footprint_id " +
        "LEFT JOIN comment " +
        "ON footprint.footprint_id = comment.footprint_id " +
        "GROUP BY footprint_id ";

    const sqlFindUser = "SELECT profile_key " +
        "FROM user " +
        "WHERE user.id = ? ";

    const sqlCountLike =
        "SELECT count(*) AS countLike " +
        "FROM eval WHERE footprint_id = ? AND state = 1";

    const sqlCountDislike =
        "SELECT count(*) AS countDisLike " +
        "FROM eval WHERE footprint_id = ? AND state = 2";

    connection.query(sqlRetrieveFootprint,[],
        function(err, footprintList){
            if(err)
                return res.status(400).json(util.message(-1, '게시물 리스트 불러오기 오류'));

            var footprintListJSON = JSON.parse(JSON.stringify(footprintList));

            async.map(footprintListJSON, function(footprint, cb){

                var task = [
                    function(callback){
                        connection.query(sqlFindUser, footprint.id, function(err, profile){
                            if (err) return callback(err);

                            profile = JSON.parse(JSON.stringify(profile))[0];

                            footprint.displayName = profile.displayName;

                            var profileUrl, profileKey = profile.profile_key;
                            if(profileKey) profileUrl = getImageUrl(profileKey);
                            else profileUrl = getImageUrl(profileDefaultKey);

                            return callback(null, { profileUrl: profileUrl });
                        });
                    },
                    function(tails, callback){
                        connection.query(sqlCountLike, [footprint.footprint_id],
                            function(err, countLike){
                                if(err) return callback(err);

                                const ret = JSON.parse(JSON.stringify(countLike))[0];

                                return callback(null, _.extend(tails, ret));
                            });
                    },
                    function(tails, callback){
                        connection.query(sqlCountDislike, [footprint.footprint_id],
                            function(err, Dislike){
                                if(err) return callback(err);

                                const ret = JSON.parse(JSON.stringify(Dislike))[0];

                                return callback(null, _.extend(tails, ret));
                            });
                    }

                ];

                async.waterfall(task, function(err, tails){
                    if (err) return cb(err);
                    return cb(null, _.extend(footprint, tails));
                });
            }, function(err, result){
                if (err) return res.status(400).json(util.message(-1, '게시물 리스트 불러오기 오류'));

                else res.status(200).json(result);
            });
        });
};

var getFootprintListByCurrentLocationAndViewLevel = function(req, res){
    var data = req.query;
    var sql = "SELECT footprint.*, count(view.view_id) AS countView, count(comment.comment_id) AS countComments " +
        "FROM footprint LEFT JOIN view " +
        "ON footprint.footprint_id = view.footprint_id " +
        "LEFT JOIN comment " +
        "ON footprint.footprint_id = comment.footprint_id " +
        "WHERE footprint.latitude <= ? AND footprint.longitude >= ? AND footprint.latitude >= ? AND footprint.longitude <= ? " +
        "GROUP BY footprint_id ";

    console.log("data : ", data);
    locationUtil.getDistanceByViewLevel(data.level, function(err, distance){
        locationUtil.distanceToLatitude(distance, function(err, diffLat){
           locationUtil.distanceToLongitude(distance, function(err, diffLng){
              console.log('diffLat : ' + diffLat);
              console.log('diffLng : ' + diffLng);
              var startLat = parseFloat(data.lat) + diffLat, startLng = parseFloat(data.lng) - diffLng;
              var endLat = parseFloat(data.lat) - diffLat, endLng = parseFloat(data.lng) + diffLng;
              console.log(startLat, startLng);
              console.log(endLat, endLng);
              connection.query(sql, [data.lat, startLng, endLat, endLng], function(err, footprintList){
                   if(err){
                       throw err;
                   }

                   var footprintListJSON = JSON.parse(JSON.stringify(footprintList));
                   //console.log(footprintList);
                   //console.log(footprintListJSON);
                   cb(null, footprintListJSON);
               });
           });
        });
    });
};

/**
 *
 * @param req
 * @param res
 */
var getFootprintListByLocation = function(req, res){

    const data = req.query;
    //console.log("data ",data);
    //console.log(data.startlat, data.startlng, data.endlat, data.endlng);
    const startLat = data.startlat,
        startLng = data.startlng,
        endLat = data.endlat,
        endLng = data.endlng;
    //todo: between
    //todo: mysql 반경검색

    const sqlRetrieveFootprint =
        "SELECT footprint.*, count(comment.comment_id) AS countComments " +
        "FROM footprint LEFT JOIN view " +
        "ON footprint.footprint_id = view.footprint_id " +
        "LEFT JOIN comment " +
        "ON footprint.footprint_id = comment.footprint_id " +
        "WHERE footprint.latitude <= ? AND footprint.longitude >= ? AND footprint.latitude >= ? AND footprint.longitude <= ? " +
        "GROUP BY footprint_id ";

    const sqlFindUser = "SELECT profile_key, displayName " +
        "FROM user " +
        "WHERE user.id = ? ";

    const sqlCountLike =
        "SELECT count(*) AS countLike " +
        "FROM eval WHERE footprint_id = ? AND state = 1";

    const sqlCountDislike =
        "SELECT count(*) AS countDisLike " +
        "FROM eval WHERE footprint_id = ? AND state = 2";

    connection.query(sqlRetrieveFootprint,[startLat, startLng, endLat, endLng],
        function(err, footprintList){
            if(err)
                return res.status(400).json(util.message(-1, '게시물 리스트 불러오기 오류'));

            var footprintListJSON = JSON.parse(JSON.stringify(footprintList));

            async.map(footprintListJSON, function(footprint, cb){

                var task = [
                    function(callback){
                        connection.query(sqlFindUser, footprint.id, function(err, profile){
                            if (err) return callback(err);

                            profile = JSON.parse(JSON.stringify(profile))[0];

                            footprint.displayName = profile.displayName;

                            var profileUrl, profileKey = profile.profile_key;
                            if(profileKey) profileUrl = getImageUrl(profileKey);
                            else profileUrl = getImageUrl(profileDefaultKey);

                            return callback(null, { profileUrl: profileUrl });
                        });
                    },
                    function(tails, callback){
                        connection.query(sqlCountLike, [footprint.footprint_id],
                            function(err, countLike){
                                if(err) return callback(err);

                                const ret = JSON.parse(JSON.stringify(countLike))[0];

                                return callback(null, _.extend(tails, ret));
                            });
                    },
                    function(tails, callback){
                        connection.query(sqlCountDislike, [footprint.footprint_id],
                            function(err, Dislike){
                                if(err) return callback(err);

                                const ret = JSON.parse(JSON.stringify(Dislike))[0];

                                return callback(null, _.extend(tails, ret));
                            });
                    }

                ];

                async.waterfall(task, function(err, tails){
                    if (err) return cb(err);
                    return cb(null, _.extend(footprint, tails));
                });

            }, function(err, result){
                if (err) return res.status(400).json(util.message(-1, '게시물 리스트 불러오기 오류'));

                else res.status(200).json(result);
            });
        });
};


/**
 *
 * @param req
 * @param res
 * @returns {*|{type, alias, describe}}
 */
var createFootprint = function(req, res){

    const userProfileByToken = req.user;
    console.log(userProfileByToken);
    const userId = userProfileByToken.id,
        userDisplayName = userProfileByToken.displayName;

    const body = req.body;

    const title = body.title,
        iconKey = body.icon_key,
        content =  body.content,
        latitude = body.latitude,
        longitude = body.longitude;

    var type = body.type;


    // todo : vaildate parameters

    if(!title)
    {
        return res.status(400)
            .json({ code : -1,
                message: '제목이 비어있습니다.'});
    }

    if(title.length > 100)
    {
        return res.status(400)
            .json({ code : -1,
                message: '제목의 길이가 너무 깁니다.'});
    }

    if(content.length > 1000)
    {
        return res.status(400)
            .json({ code: -1,
                message: '내용의 길이가 너무 깁니다.'})
    }

    if(!latitude || !longitude)
    {
        return res.status(400)
            .json({ code : -1,
                message: '위치 데이터가 비어있습니다.'});
    }

    if(!type)
    {
        type = 'default';
    }


    const sqlCreateFootprint =
        "INSERT INTO footprint (id, displayName, title, icon_key, content, latitude, longitude, type) "
        + " VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
    const sqlInsertImage =
        "INSERT INTO image (footprint_id, image_key) " +
        "VALUES (?, ?) ";
    const sqlCreateSubFootprint =
        "INSERT INTO sub_footprint ( footprint_id, icon_key, latitude, longitude ) " +
        "VALUES (?, ?, ?, ?)";


    var createImages = function(footprintId, imageKeys, cb){

        if(!footprintId)
        {
            return cb('foreign key err', null);
        }

        console.log(imageKeys);

        imageKeys.forEach(
            function(imageKey){
                if(imageKey !== null)
                {
                    //console.log(imageKey);
                    connection.query(sqlInsertImage, [footprintId, imageKey],
                        function(err, image){
                            if (err)
                                return cb(err, null);

                            if(!image)
                            {
                                return cb('image link error', null);
                            }

                        });
                }
            });

        return cb(null, true);
    };

    var createSubMarkers = function(footprintId, subMarkers, cb){
        console.log(subMarkers);

        if(!footprintId)
        {
            return cb('foreign key err', null);
        }

        subMarkers.forEach(
            function(subMarker) {
                if(subMarker !== null)
                {
                    const subLatitude = subMarker.latitude,
                        subLongitude = subMarker.longitude;
                    var subIconKey = subMarker.iconKey;
                    console.log(subMarker);

                    // todo: vaildate sub markers parameters

                    if(!subIconKey)
                    {
                        subIconKey = iconKey;
                    }

                    if(!subLongitude || !subLatitude)
                    {
                        return cb('sub marker location data err', null);
                    }

                    connection.query(sqlCreateSubFootprint, [footprintId, subIconKey, subLatitude, subLongitude],
                        function(err, result){
                            if(err)
                                return cb(err, null);

                            if(!result)
                                return cb('fail to create subMarkers', null);
                        });
                }
            });

        return cb(null, true);
    };


    connection.query(sqlCreateFootprint, [userId, userDisplayName, title, iconKey, content, latitude, longitude, type],
        function(err, result){
            if(err)
                return res.status(400)
                    .json({ code: -2,
                        message: 'sql fail'});
            if(result)
            {
                const imageKeys = body.imageKeys,
                    subMarkers = body.subMarkers;

                var task = [
                    function(cb){
                        console.log(imageKeys);
                        if(!imageKeys)
                        {
                            return cb(null, false);
                        }

                        createImages(result.insertId, imageKeys,
                            function(err, images){
                                if(err)
                                    return cb(err, null);

                                if(images)
                                    return cb(null, true);
                            });
                    },

                    function(cb){
                        if(!subMarkers)
                        {
                            return cb(null, false);
                        }
                        createSubMarkers(result.insertId, subMarkers,
                            function(err, markers){
                                if(err)
                                    return cb(err, null);
                                if(markers)
                                    return cb(null, true);
                            });
                    }
                ];

                async.series(task,
                    function(err, result){
                        if(err)
                        {
                            return res.status(400)
                                .json({code: -1,
                                message: '게시글을 생성하는데 오류가 생겼습니다.'});
                        }

                        if(result)
                        {
                            return res.status(201)
                                .json({ code: 1,
                                    message: 'success to create footprint mark'});
                        }

                    });
            }else
            {
                return res.status(400)
                    .json({ code : -1,
                        message: 'fail to create'});
            }
        });
};

var deleteFootprintByFootprintID = function(req, res){

    const userId = req.user.id,
        footprintId = req.body.footprintId;

    console.log(userId);
    console.log(footprintId);

    // if(footprintId === null || typeof footprintId === 'undefined' || footprintId === ''){
    if(!footprintId){
        return res.status(400).json({code: -1, message: "footprint 가 없습니다."});
    }

    const sqlDeleteFootprint =
        "DELETE FROM footprint WHERE footprint_id = ?";

    var task = [
        function(cb){

            getAuthor(footprintId, function(err, author){
                if(err) return cb(err, null);

                console.log(author.id);

                if(author.id !== userId)
                {
                    return cb('작성자만 게시물을 삭제 할 수 있습니다.', null);
                }else
                {
                    return cb(null);
                }
            });

        },
        function(cb){

            connection.query(sqlDeleteFootprint, [footprintId],
                function(err, result){
                    if(err) return cb(err, null);

                    return cb(null, result);
            });
        }
    ];


    async.series(task, function(err, result){
        if(err) return res.status(400).json({code: -1, message: '게시글 삭제 오류'});
        else{
            return res.status(200).json({code: 1, message: '게시글 삭제 성공'});
        }

    });
};

var getFootprintByFootprintID = function(req, res){
    const user = req.user;
    const footprintId = req.query.footprintId;

    // todo: query data validation test
    if(!footprintId)
    {
        res.status(400)
            .json({code: -1,
                message: 'footprintId that you sent is not allowed'})
    }

    const sqlRetrieveFootprintByFootprintId =
        "SELECT footprint.*, view_count AS countView, count(comment.comment_id) AS countComments " +
        "FROM footprint " +
        "LEFT JOIN comment " +
        "ON footprint.footprint_id = comment.footprint_id " +
        "WHERE footprint.footprint_id = ? " +
        "GROUP BY footprint_id ";

    const sqlWatch =  "UPDATE footprint SET view_count = view_count + 1 WHERE footprint_id = ? ";

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

    const task = [
        /**
         *  Get selected footprint data set
         *
         * @param cb
         */
        function(cb){
            connection.query(sqlRetrieveFootprintByFootprintId, [footprintId],
                function(err, footprint){
                    if(err)
                        return cb(err);
                    else{
                        var objectFootprint = JSON.parse(JSON.stringify(footprint))[0];

                        if(objectFootprint)
                        {
                            const iconUrl = getImageUrl(iconKey);

                            return cb(null, _.extend(objectFootprint, {iconUrl: iconUrl}));
                        }
                        else
                            return cb({message : "error to find footprint"}, null);
                    }
                });
        },
        /**
         *  Check user watch
         *  todo: refresh every day
         *
         * @param cb
         * @returns {*}
         */
        function(footprint, cb){
                connection.query(sqlWatch, [footprintId],
                    function(err){
                        if(err)
                            return cb(err);
                        return cb(null, footprint);
                });
        },
        /**
         *  Get images by footprint Id
         *
         * @public
         */
        function(footprint, cb){
            connection.query(sqlImageLoad, [footprintId],
                function(err, imageInfo){
                    if(err) return cb(err);

                    console.log(imageInfo);
                    imageInfo = JSON.parse(JSON.stringify(imageInfo));

                    var imageUrls = [];

                    imageInfo.forEach(function(image){
                        // var params = {
                        //     Bucket: bucketName,
                        //     Key: image.image_key
                        // };
                        //
                        // console.log("#debug retrieveAll : " + image.image_key);
                        var imageUrl = getImageUrl(image.image_key);
                        imageUrls.push(imageUrl);
                    });

                    return cb(null, _.extend(footprint, {imageUrls: imageUrls}));
                });
        },
        function(footprint, cb){
            connection.query(sqlRetrieveComments, [footprintId],
                function(err, comments){
                    if(err) return cb(err);

                    var ret = JSON.parse(JSON.stringify(comments));


                    console.log(ret);

                    ret = ret.map(function(comment){

                        var profileKey = comment.profile_key;

                        if(profileKey === null)
                        {
                            profileKey = 'profiledefault.png';
                        }

                        // const params = {
                        //     Bucket: bucketName,
                        //     Key: profileKey
                        // };

                        const profileUrl = getImageUrl(profileKey);

                        console.log(_.extend(comment, {profileUrl : profileUrl}));

                        return _.extend(comment, {profileUrl : profileUrl});
                    });

                    console.log(ret);
                    return cb(null, _.extend(footprint, {comments: ret}));
                });
        },
        function(footprint, cb){
            connection.query(sqlCountLike, [footprintId],
                function(err, countLike){
                    if(err) return cb(err);

                    return cb(null, _.extend(footprint, JSON.parse(JSON.stringify(countLike))[0]));
                });
        },
        function(footprint, cb){
            connection.query(sqlCountDislike, [footprintId],
                function(err, Dislike){
                    if(err) return cb(err);

                    return cb(null, _.extend(footprint, JSON.parse(JSON.stringify(Dislike))[0]));
                });
        },
        function(footprint, cb){
            connection.query(sqlGetProfileImage, [footprint.id],
                function(err, profile){
                    if(err) return cb(err);


                    footprint.displayName = JSON.parse(JSON.stringify(profile))[0].displayName;


                    var profileKey = JSON.parse(JSON.stringify(profile))[0].profile_key;

                    if(profileKey === null)
                    {
                        profileKey = 'profiledefault.png';
                    }

                    // const params = {
                    //     Bucket: bucketName,
                    //     Key: profileKey
                    // };

                    const profileUrl = getImageUrl(profileKey);

                    delete footprint.id;
                    console.log(profileUrl);
                    return cb(null, _.extend(footprint, {profileUrl : profileUrl}));
                });
        }
    ];

    async.waterfall(task,
        function(err, result){
            if(err)
                return res.status(400)
                    .json({ code: -1,
                        message : '게시글 불러오기 오류'});
            else{
                return res.status(200)
                    .json(_.extend(result, {code:1}));
            }
        });
};


/**
 *  todo: move to trace.js
 *
 * @param req
 * @param res
 * @returns {*|{type, alias, describe}}
 */
var createSubFootprint = function(req, res){
    const body = req.body;

    const iconKey = body.iconKey,
        footprintId = body.footprintId,
        latitude = body.latitude,
        longitude = body.longitude;

    // todo: create subFootprint
    // parameter test

    if(!title)
    {
        return res.status(400)
            .json({ code : -1,
                message: 'title should be not null'});
    }

    if(!latitude || !longitude)
    {
        return res.status(400)
            .json({ code : -1,
                message: 'location data should be not null'});
    }

    const sqlCreateSubFootprint =
        "INSERT INTO sub_footprint ( footprint_id, icon_key, latitude, longitude ) " +
        "VALUES (?, ?, ?, ?)";

    connection.query(sqlCreateSubFootprint, [footprintId, iconKey, latitude, longitude],
        function(err, result){
            if(err)
                return res.status(400)
                    .json({ code: -2,
                        message: 'sql fail'});


            if(result)
            {
                return res.status(201)
                    .json({ code : 1,
                        message: 'success to create sub footprint mark'});
            }else
            {
                return res.status(400)
                    .json({ code : -1,
                        message: 'fail to create'});
            }

        }
    );

};

var getSubFootprintByFootprintID = function(req, res){
    const footprintId = req.query.footprintId;

    // todo: query data validation test
    if(!footprintId)
    {
        return res.status(400)
            .json({code: -1,
                message: 'footprintId that you sent is not allowed'})
    }

    const sqlRetrieveFootprintByFootprintId =
        "SELECT * " +
        "FROM footprint " +
        "WHERE footprint_id = ?";

    const sqlRetrieveSubFootprintByFootprintId =
        "SELECT sub_footprint.icon_key AS iconKey, sub_footprint.latitude, sub_footprint.longitude " +
        "FROM sub_footprint " +
        "WHERE footprint_id = ? ";

    const task = [
        function(cb){
            connection.query(sqlRetrieveFootprintByFootprintId, [footprintId],
                function(err, footprint){
                    if(err)
                        return cb(err, null);

                    if(footprint)
                        return cb(null, JSON.parse(JSON.stringify(footprint))[0]);
                    else return cb('sql error', null);
                })
        },
        function(cb){
            connection.query(sqlRetrieveSubFootprintByFootprintId, [footprintId],
                function(err, subFootprints){
                    if(err)
                        return cb(err, null);

                    if(subFootprints)
                        return cb(null, subFootprints);
                    else return cb('sql error', null);
                });
        }
    ];

    async.series(task,
        function(err, result){
            if(err)
                return res.status(400)
                        .json({code: -1,
                                message: '서브마커 불러오기 오류'});

            if(result)
            {
                // var objectResponseJson = {};
                // objectResponseJson.push({code: 1})
                //     .push(result[0])
                //     .push(result[1]);
                if(!result[0])
                {
                    return res.status(400)
                        .json({code: -1,
                                message: 'parameter error'});
                }

                result[0]['code'] = 1;
                result[0]['subMarkers'] = result[1];
                console.log(result[0]);

                return res.status(200)
                    .json(result[0]);
            }
            else
                return res.status(400)
                    .json({code: -1,
                            message: 'sql output error'});
        });

};


module.exports = {
    getFootprintListByLocation : getFootprintListByLocation,
    getFootprintListByDisplayName : getFootprintListByDisplayName,
    getFootprintByFootprintID : getFootprintByFootprintID,
    getFootprintList: getFootprintList,
    createFootprint : createFootprint,
    deleteFootprintByFootprintID : deleteFootprintByFootprintID,
    getFootprintListByCurrentLocationAndViewLevel : getFootprintListByCurrentLocationAndViewLevel,
    createSubFootprint : createSubFootprint,
    getSubFootprintByFootprintID: getSubFootprintByFootprintID
};