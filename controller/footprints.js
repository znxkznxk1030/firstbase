var connection = require('../database/db');
var user = require('../passport_auth/user');
var locationUtil = require('../utils/locationUtil');
var async = require('async');
const bucketName = 'firstbase-bucket';
const AWS = require('aws-sdk');

AWS.config.loadFromPath('s3config.json');

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
    var footprintId = req.query.footprintId;
    var sql = "SELECT footprint.*, count(view.view_id) AS viewCount, count(comment.comment_id) AS commentCount " +
        "FROM footprint LEFT JOIN view " +
        "ON footprint.footprint_id = view.footprint_id " +
        "LEFT JOIN comment " +
        "ON footprint.footprint_id = comment.footprint_id " +
        "WHERE footprint.footprint_id = ? " +
        "GROUP BY footprint_id ";

    var find_sql = "SELECT * FROM view WHERE id = ? AND footprint_id = ?";
    var view_insert_sql = "INSERT INTO view (id, footprint_id) VALUES (?, ?)";
    var image_load_sql = "SELECT * FROM image WHERE footprint_id = ?";

    var task = [
        function(cb){
            connection.query(sql, [footprintId], function(err, footprint){
                if(err){
                    //res.json( {message : "error to find footprint"} );
                    return cb(err, {message : "error to find footprint"});
                }
                console.log("aa" + footprint);
                if(footprint[0]) return cb(null, JSON.parse(JSON.stringify(footprint))[0]);
                else return cb(err, {message : "error to find footprint"});
                //res.json(JSON.parse(JSON.stringify(footprint)));
            });
        },
        function(cb){
            if(req.user.id){
                connection.query(find_sql, [req.user.id, footprintId], function(err, view_id){
                    if(err){
                        return cb(err, { message: "id not found"});
                    }
                    console.log(view_id);
                    if(view_id[0]){
                            return cb(null, { message: "already watched"});
                    }else{
                        connection.query(view_insert_sql, [req.user.id, footprintId], function(err, result){
                            if(err) {
                                return cb(err, { message: "not found"});
                            }
                            return cb(null, { message : "insert"});
                        });
                    }
                });
            }
        },
        function(cb){
            connection.query(image_load_sql, [footprintId], function(err, imageInfo){
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

    async.series(task, function(err, result){
            if(err) res.json({ code: 0, message : err});
            else{
                var output = Object.assign(result[0], result[2]);
                res.json(output);
                //res.json(result.slice(1,3));
            }
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
        if(err){
            throw err;
        }

        var footprintListJSON = JSON.parse(JSON.stringify(footprintList));

        console.log(footprintList);
        console.log(footprintListJSON);

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

    connection.query(sql, [startLat, startLng, endLat, endLng], function(err, footprintList){
       if(err){
           throw err;
       }

       var footprintListJSON = JSON.parse(JSON.stringify(footprintList));
       res.json(footprintListJSON);
    });
};

var createFootprint = function(req, res){
    const data = req.body;
    //console.log("#debug createFootprint\ndata : " + data);
    //console.log(req.body, req.isAuthenticated(), req.user);

    const sql = "INSERT INTO footprint (id, title, icon_key, content, latitude, longitude) "
        + " VALUES (?, ?, ?, ?, ?, ?)";
    const imageSql = "INSERT INTO image (footprint_id, image_key) VALUES (?, ?) ";

    connection.query(sql, [req.user.id ,data.title, data.icon_key, data.content, data.latitude, data.longitude],
        function(err, result){
            if(err){
                return res.json(err);
            }else{
                if(result){
                    req.body.imageKeys.forEach(function(imageKey){
                        if(imageKey !== null){
                            console.log(imageKey);
                            connection.query(imageSql, [result.insertId, imageKey], function(err, image){
                                if (err) throw err;
                            });
                        }
                    });
                    res.json({code : 1, message: 'success to create footprint'});
                }else{
                    res.json({code : 0, message: 'fail to create'});
                }
            }
        });
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
    })
};

module.exports = {
    getFootprintListByLocation : getFootprintListByLocation,
    getFootprintListByUser : getFootprintListByUser,
    getFootprintByFootprintID : getFootprintByFootprintID,
    getFootprintList: getFootprintList,
    createFootprint : createFootprint,
    deleteFootprintByFootprintID : deleteFootprintByFootprintID,
    getFootprintListByCurrentLocationAndViewLevel : getFootprintListByCurrentLocationAndViewLevel
};