const connection = require('../database/db');
const user = require('../passport_auth/user');
const locationUtil = require('../utils/locationUtil');
const async = require('async');
const bucketName = 'firstbase-bucket';
const AWS = require('aws-sdk');

AWS.config.loadFromPath('s3config.json');

/**
 *  standard time : seoul ( ap-northeast-2 )
 * @type {S3}
 */
const s3 = new AWS.S3({ region : 'ap-northeast-2' });

var getFootprintListByUser = function(req, res){
    console.log(req.params.id);
    user.findByUsername(req.params.id, function(err, user){
        if(err){
            throw err;
        }

        if (user) {
            console.log(user);
            var sql = "SELECT * FROM footprint WHERE user_id = ?";
            connection.query(sql, [userId], function(err, footprintList){
                if (err){
                    throw err;
                }
                //todo 튜닝
                //todo sql 분리
                var footprintListJson = JSON.parse(JSON.stringify(footprintList));

                console.log(footprintList);
                console.log(footprintListJson);

                res.json(footprintListJson);
            });
        }else{
            res.json({message : "user not found"});
        }

    });
};

var getFootprintByFootprintID = function(req, res){
    const user = req.user;
    const footprintId = req.query.footprintId;

    // todo: query test
    if(!footprintId)
    {
        res.status(400)
            .json({code: -1,
                message: 'footprintId that you sent is not allowed'})
    }

    // todo: split sql query
    const sql = "SELECT footprint.*, count(view.view_id) AS viewCount, count(comment.comment_id) AS commentCount " +
        "FROM footprint LEFT JOIN view " +
        "ON footprint.footprint_id = view.footprint_id " +
        "LEFT JOIN comment " +
        "ON footprint.footprint_id = comment.footprint_id " +
        "WHERE footprint.footprint_id = ? " +
        "GROUP BY footprint_id ";

    const find_sql = "SELECT * FROM view WHERE id = ? AND footprint_id = ?";
    const view_insert_sql = "INSERT INTO view (id, footprint_id) VALUES (?, ?)";
    const image_load_sql = "SELECT * FROM image WHERE footprint_id = ?";

    const task = [
        /**
         *  Get selected footprint data set
         *
         * @param cb
         */
        function(cb){
            connection.query(sql, [footprintId],
                function(err, footprint){
                if(err)
                    return cb(err, {message : "error to find footprint"});

                if(footprint[0])
                    return cb(null, JSON.parse(JSON.stringify(footprint))[0]);
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
            if(req.user.id){
                connection.query(find_sql, [req.user.id, footprintId],
                    function(err, view_id){
                        if(err)
                            return cb(err, { message: "id not found"});

                        if(view_id[0])
                        {
                            return cb(null, { message: "already watched"});
                        }else
                        {
                            connection.query(view_insert_sql, [req.user.id, footprintId],
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
            connection.query(image_load_sql, [footprintId],
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
            })
        }
    ];

    async.series(task,
        function(err, result){
            if(err)
                return res.status(400)
                    .json({ code: -1,
                        message : err});

            const output = Object.assign({code: 1}, result[0], result[2]);

            res.status(200)
                .json(output);
    });
};

var getFootprintList = function(req, res){
    var sql = "SELECT footprint.*, count(view.view_id) AS viewCount, count( comment.comment_id ) AS commentCount " +
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
    var sql = "SELECT footprint.*, count(view.view_id) AS viewCount, count( comment.comment_id ) AS commentCount " +
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
    var data = req.query;
    console.log("data ",data);
    console.log(data.startlat, data.startlng, data.endlat, data.endlng);
    var startLat = data.startlat, startLng = data.startlng, endLat = data.endlat, endLng = data.endlng;
    var sql = "SELECT footprint.*, count(view.view_id) AS viewCount, count( comment.comment_id ) AS commentCount " +
        "FROM footprint LEFT JOIN view " +
        "ON footprint.footprint_id = view.footprint_id " +
        "LEFT JOIN comment " +
        "ON footprint.footprint_id = comment.footprint_id " +
        "WHERE footprint.latitude <= ? AND footprint.longitude >= ? AND footprint.latitude >= ? AND footprint.longitude <= ? " +
        "GROUP BY footprint_id ";

    connection.query(sql, [startLat, startLng, endLat, endLng],
        function(err, footprintList){
            if(err)
                return res.status(400)
                    .json({code: -1,
                    message: err});

            var footprintListJSON = JSON.parse(JSON.stringify(footprintList));

            return res.json(footprintListJSON);
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
    const userId = userProfileByToken.id;

    const body = req.body;

    const title = body.title,
        iconKey = body.icon_key,
        content =  body.content,
        latitude = body.latitude,
        longitude = body.longitude,
        imageKeys = body.imageKeys;

    // todo : createFootprint
    // parameter test

    if(title === null)
    {
        return res.status(400)
            .json({ code : -1,
                message: 'title should be not null'});
    }

    if(latitude === null || longitude === null)
    {
        return res.status(400)
            .json({ code : -1,
                message: 'location data should be not null'});
    }


    const sqlCreateFootprint = "INSERT INTO footprint (id, title, icon_key, content, latitude, longitude) "
        + " VALUES (?, ?, ?, ?, ?, ?)";
    const sqlInsertImage = "INSERT INTO image (footprint_id, image_key) VALUES (?, ?) ";


    connection.query(sqlCreateFootprint, [userId, title, iconKey, content, latitude, longitude],
        function(err, result){
            if(err)
                return res.status(400)
                    .json({ code: -2,
                        message: 'sql fail'});
            if(result)
            {
                if(!imageKeys)
                    return res.status(201)
                        .json({ code : 1,
                            message: 'success to create footprint mark'});

                imageKeys.forEach(
                    function(imageKey){
                        if(imageKey !== null)
                        {
                            //console.log(imageKey);
                            connection.query(sqlInsertImage, [result.insertId, imageKey],
                                function(err, image){
                                    if (err) throw err;
                                });
                        }
                });

                return res.status(201)
                    .json({ code : 1,
                        message: 'success to create footprint mark'});
            }else
            {
                return res.status(400)
                    .json({ code : -1,
                        message: 'fail to create'});
            }
        });
};

/**
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

    if(title === null)
    {
        return res.status(400)
            .json({ code : -1,
                message: 'title should be not null'});
    }

    if(latitude === null || longitude === null)
    {
        return res.status(400)
            .json({ code : -1,
                message: 'location data should be not null'});
    }

    const sqlCreateSubFootprint = "INSERT INTO sub_footprint ( footprint_id, icon_key, latitude, longitude ) " +
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

var deleteFootprintByFootprintID = function(req, res){

    var footprint_id = req.params.footprint_id;
    var sql = "DELETE FROM footprint WHERE footprint_id = ?";

    connection.query(sql, [footprint_id], function(err, result){
        if (err){
            throw err;
        }else {
            if (result) {
                res.json({message: "success to delete"});
            } else {
                res.json({message: "fail to delete"});
            }
        }
    });
};

module.exports = {
    getFootprintListByLocation : getFootprintListByLocation,
    getFootprintListByUser : getFootprintListByUser,
    getFootprintByFootprintID : getFootprintByFootprintID,
    getFootprintList: getFootprintList,
    createFootprint : createFootprint,
    deleteFootprintByFootprintID : deleteFootprintByFootprintID,
    getFootprintListByCurrentLocationAndViewLevel : getFootprintListByCurrentLocationAndViewLevel,
    createSubFootprint : createSubFootprint
};