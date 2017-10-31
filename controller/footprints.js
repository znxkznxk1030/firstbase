const connection = require('../database/db');
const user = require('./users');
const locationUtil = require('../utils/locationUtil');
const async = require('async');
const bucketName = 'firstbase-bucket';
const AWS = require('aws-sdk');
const _=require('underscore');

AWS.config.loadFromPath('s3config.json');

/**
 *  standard time : seoul ( ap-northeast-2 )
 * @type {S3}
 */
const s3 = new AWS.S3({ region : 'ap-northeast-2' });

var getFootprintListByUserDisplayName = function(req, res){
    const userDisplayName = req.params.userDisplayName;

    const sqlRetrieveFootprint =
        "SELECT footprint.*, count(view.view_id) AS countView, count(comment.comment_id) AS countComments " +
        "FROM footprint LEFT JOIN view " +
        "ON footprint.footprint_id = view.footprint_id " +
        "LEFT JOIN comment " +
        "ON footprint.footprint_id = comment.footprint_id " +
        "WHERE footprint.id = ? " +
        "GROUP BY footprint_id ";

    connection.query(sqlRetrieveFootprint, [userDisplayName], function(err, footprintList){
        if (err)
            return res.status(400)
                        .json({code: -1,
                            message:err});

        return res.status(200)
            .json(footprintList);
    });
};

var getFootprintListByUserId = function(req, res){
    const userId = req.query.userId;

    const sqlRetrieveFootprint =
        "SELECT footprint.*, count(view.view_id) AS countView, count(comment.comment_id) AS countComments " +
        "FROM footprint LEFT JOIN view " +
        "ON footprint.footprint_id = view.footprint_id " +
        "LEFT JOIN comment " +
        "ON footprint.footprint_id = comment.footprint_id " +
        "WHERE footprint.id = ? " +
        "GROUP BY footprint_id ";

    connection.query(sqlRetrieveFootprint, [userId], function(err, footprintList){
        if (err)
            return res.status(400)
                .json({code: -1,
                    message: err});

        return res.status(200)
            .json(footprintList);
    });
};

var getFootprintList = function(req, res){

    var sql = "SELECT footprint.*, count(view.view_id) AS countView, count(comment.comment_id) AS countComments " +
        "FROM footprint " +
        "LEFT JOIN view " +
        "ON footprint.footprint_id = view.footprint_id " +
        "LEFT JOIN comment " +
        "ON footprint.footprint_id = comment.footprint_id " +
        "GROUP BY footprint_id ";

    connection.query(sql, [], function(err, footprintList){
        if(err) res.json({code: -1, message: err});

        var footprintListJSON = JSON.parse(JSON.stringify(footprintList));

        res.json(footprintListJSON);
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

    const sqlRetrieveFootprint =
        "SELECT footprint.*, count(view.view_id) AS countView, count(comment.comment_id) AS countComments " +
        "FROM footprint LEFT JOIN view " +
        "ON footprint.footprint_id = view.footprint_id " +
        "LEFT JOIN comment " +
        "ON footprint.footprint_id = comment.footprint_id " +
        "WHERE footprint.latitude <= ? AND footprint.longitude >= ? AND footprint.latitude >= ? AND footprint.longitude <= ? " +
        "GROUP BY footprint_id ";

    connection.query(sqlRetrieveFootprint, [startLat, startLng, endLat, endLng],
        function(err, footprintList){
            if(err)
                return res.status(400)
                    .json({code: -1,
                    message: err});

            var footprintListJSON = JSON.parse(JSON.stringify(footprintList));

            return res.status(200)
                .json(footprintListJSON);
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
                                message: err});
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

    // todo: split sql query
    const sqlRetrieveFootprintByFootprintId =
        "SELECT footprint.*, count(view.view_id) AS countView, count(comment.comment_id) AS countComments " +
        "FROM footprint LEFT JOIN view " +
        "ON footprint.footprint_id = view.footprint_id " +
        "LEFT JOIN comment " +
        "ON footprint.footprint_id = comment.footprint_id " +
        "WHERE footprint.footprint_id = ? " +
        "GROUP BY footprint_id ";

    const sqlIsWatched = "SELECT * FROM view WHERE id = ? AND footprint_id = ?";
    const sqlWatch = "INSERT INTO view (id, footprint_id) VALUES (?, ?)";
    const sqlImageLoad = "SELECT * FROM image WHERE footprint_id = ?";
    const sqlCountLike =
        "SELECT count(*) AS countLike " +
        "FROM eval WHERE footprint_id = ? AND state = 1";
    const sqlCountDislike =
        "SELECT count(*) AS countDisLike " +
        "FROM eval WHERE footprint_id = ? AND state = 2";

    const sqlRetrieveComments =
        "SELECT comment.content ,comment.modified_date AS date, user.displayName " +
        "FROM comment LEFT JOIN user " +
        "ON comment.id = user.id " +
        "WHERE comment.footprint_id = ? ";

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
                        return cb(err, {message : "error to find footprint"});

                    if(footprint[0])
                    {
                        var returnData = JSON.parse(JSON.stringify(footprint))[0];
                        return cb(null, returnData);

                    }
                    else
                        return cb(err, {message : "error to find footprint"});
                });
        },
        /**
         *  Check user watch
         *  todo: refresh every day
         *
         * @param cb
         * @returns {*}
         */
        function(cb){
            if(user){
                connection.query(sqlIsWatched, [user.id, footprintId],
                    function(err, view_id){
                        if(err)
                            return cb(err, { message: "id not found"});

                        if(view_id[0])
                        {
                            return cb(null, { message: "already watched"});
                        }else
                        {
                            connection.query(sqlWatch, [user.id, footprintId],
                                function(err, result){
                                    if(err)
                                        return cb(err, { message: "not found"});

                                    return cb(null, { message : "insert"});
                                });
                        }
                    });
            }else
            {
                return cb(null, { message : "not logged in"});
            }
        },
        /**
         *  Get images by footprint Id
         *
         * @public
         */
        function(cb){
            connection.query(sqlImageLoad, [footprintId],
                function(err, imageInfo){
                    if(err) return cb(err, { message: 'error'});

                    console.log(imageInfo);
                    imageInfo = JSON.parse(JSON.stringify(imageInfo));

                    var imageUrls = [];

                    imageInfo.forEach(function(image){
                        var params = {
                            Bucket: bucketName,
                            Key: image.image_key
                        };

                        console.log("#debug retrieveAll : " + image.image_key);
                        var imageUrl = s3.getSignedUrl('getObject', params);
                        imageUrls.push(imageUrl);
                    });

                    return cb(null, {imageUrls: imageUrls});
                });
        },
        function(cb){
            connection.query(sqlRetrieveComments, [footprintId],
                function(err, comments){
                    if(err) return cb(err, { message: 'error'});

                    const ret = JSON.parse(JSON.stringify(comments));

                    return cb(null, {comments: ret});
                });
        },
        function(cb){
            connection.query(sqlCountLike, [footprintId],
                function(err, countLike){
                    if(err) return cb(err, { message: err});

                    const ret = JSON.parse(JSON.stringify(countLike))[0];

                    return cb(null, ret);
                });
        },
        function(cb){
            connection.query(sqlCountDislike, [footprintId],
                function(err, Dislike){
                    if(err) return cb(err, { message: err});

                    const ret = JSON.parse(JSON.stringify(Dislike))[0];

                    return cb(null, ret);
                });
        }
    ];

    async.series(task,
        function(err, result){
            if(err)
                return res.status(400)
                    .json({ code: -1,
                        message : err});

            var output = Object.assign({code: 1}, result[0], result[2], result[3], result[4], result[5]);
            return res.status(200)
                    .json(output);
        });
};

var deleteFootprintByFootprintID = function(req, res){

    const footprintId = req.query.footprintId;


    // todo: query data validation test
    if(!footprintId)
    {
        res.status(400)
            .json({code: -1,
                message: 'footprintId that you sent is not allowed'})
    }

    const sqlDeleteFootprint = "DELETE FROM footprint WHERE footprint_id = ?";


    // todo: delete all referenced tables first


    connection.query(sqlDeleteFootprint, [footprintId],
        function(err, result){
            if (err)
                return res.status(400)
                    .json({code: -1,
                        message: err});

            if (result)
            {
                res.status(200)
                    .json({code: 1,
                        message: "success to delete"});
            } else
            {
                res.status(400)
                    .json({code: -1,
                        message: "fail to delete"});
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
                                message: err});

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
    getFootprintListByUserId : getFootprintListByUserId,
    getFootprintByFootprintID : getFootprintByFootprintID,
    getFootprintList: getFootprintList,
    createFootprint : createFootprint,
    deleteFootprintByFootprintID : deleteFootprintByFootprintID,
    getFootprintListByCurrentLocationAndViewLevel : getFootprintListByCurrentLocationAndViewLevel,
    createSubFootprint : createSubFootprint,
    getSubFootprintByFootprintID: getSubFootprintByFootprintID,
    getFootprintListByUserDisplayName : getFootprintListByUserDisplayName
};