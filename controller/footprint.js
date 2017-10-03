var connection = require('../database/db');
var user = require('../passport_auth/user');
var locationUtil = require('../utils/locationUtil');
var async = require('async');

var getFootprintListByUser = function(userId, cb){

    console.log(userId);
    user.findByUsername(userId, function(err, user){
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

                var footprintListJson = JSON.parse(JSON.stringify(footprintList));

                console.log(footprintList);
                console.log(footprintListJson);

                cb(null, footprintListJson);
            });
        }else{

        }

    });
};

var getFootprintByFootprintID = function(footprintId, cb){
    var sql = "SELECT * FROM footprint WHERE footprint_id = ?";
    connection.query(sql, [footprintId], function(err, footprint){
        if(err){
            throw err;
        }

        var footprint = JSON.parse(JSON.stringify(footprint));

        cb(null, footprint);
    });
};

var getFootprintList = function(cb){
    var sql = "SELECT * FROM footprint";
    connection.query(sql, [], function(err, footprintList){
        if(err){
            throw err;
        }

        var footprintListJSON = JSON.parse(JSON.stringify(footprintList));

        console.log(footprintList);
        console.log(footprintListJSON);

        cb(null, footprintListJSON);
    });
};

var getFootprintListByCurrentLocationAndViewLevel = function(data, cb){
    var sql = "SELECT * FROM footprint WHERE latitude <= ? AND longitude >= ? AND latitude >= ? AND longitude <= ?";
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

var getFootprintListByLocation = function(data, cb){
    console.log("data ",data);
    console.log(data.startlat, data.startlng, data.endlat, data.endlng);
    var startLat = data.startlat, startLng = data.startlng, endLat = data.endlat, endLng = data.endlng;
    var sql = "SELECT * FROM footprint WHERE latitude <= ? AND longitude >= ? AND latitude >= ? AND longitude <= ?";

    connection.query(sql, [startLat, startLng, endLat, endLng], function(err, footprintList){
       if(err){
           throw err;
       }

       var footprintListJSON = JSON.parse(JSON.stringify(footprintList));
       console.log(footprintList);
       console.log(footprintListJSON);
       cb(null, footprintListJSON);
    });

};

var createFootprint = function(data, cb){
    console.log(data);

    var sql = "INSERT INTO footprint (user_id, title, icon_url, content, latitude, longitude)"
        + " VALUES (?, ?, ?, ?, ?, ?)";

    connection.query(sql, [data.user_id, data.title, data.icon_url, data.content, data.latitude, data.longitude],
        function(err, result){
            if(err){
                throw err;
            }

            cb(null, true);
        });
    //
    // user.findByUsername(data.user_id, function(err, user) {
    //     if (err) {
    //         throw err;
    //     }
    //
    //     if(user){
    //         var sql = "INSERT INTO footprint (user_id, title, icon_url, content, latitude, longitude)"
    //             + " VALUES (?, ?, ?, ?, ?, ?)";
    //
    //         connection.query(sql, [data.user_id, data.title, data.icon_url, data.content, data.latitude, data.longitude],
    //             function(err, result){
    //                 if(err){
    //                     throw err;
    //                 }
    //
    //                 cb(null, true);
    //             });
    //         cb(false, false);
    //     }else{
    //
    //     }
    //
    // });
};

var deleteFootprintByFootprintID = function(footprint_id, cb){
    var sql = "DELETE FROM footprint WHERE footprint_id = ?";

    connection.query(sql, [footprint_id], function(err, result){
        if (err){
            throw err;
        }

        cb(null, true);
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