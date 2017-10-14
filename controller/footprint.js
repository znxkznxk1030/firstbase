var connection = require('../database/db');
var user = require('../passport_auth/user');
var locationUtil = require('../utils/locationUtil');
var async = require('async');

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
    var footprintId = req.params.footprint_id;
    var sql = "SELECT footprint.*, count(view.view_id) AS viewCount " +
        "FROM footprint INNER JOIN view " +
        "ON footprint.footprint_id = view.footprint_id " +
        "WHERE footprint.footprint_id = ? " +
        "GROUP BY footprint_id ";

    var find_sql = "SELECT * FROM view WHERE id = ? AND footprint_id = ?";
    var view_insert_sql = "INSERT INTO view (id, footprint_id) VALUES (?, ?)";

    var task = [
        function(cb){
            connection.query(sql, [footprintId], function(err, footprint){
                if(err){
                    //res.json( {message : "error to find footprint"} );
                    return cb(err, {message : "error to find footprint"});
                }
                console.log(footprint);
                if(footprint[0]) return cb(null, footprint);
                else return cb(err, {message : "error to find footprint"});
                //res.json(JSON.parse(JSON.stringify(footprint)));
            });
        },
        function(cb){
            if(req.user){

                connection.query(find_sql, [req.user.id, footprintId], function(err, view_id){
                    if(err){
                        return cb(err, { message: "id not found"});
                    }
                    //console.log(view_id[0]);
                    if(view_id[0]){
                            return cb(null, { message: "already view"});
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
        }
    ];

    async.series(task, function(err, result){
            if(err) res.json({ message : err});
            else{
                console.log(result);
                res.json(JSON.parse(JSON.stringify(result[0])));
                //res.json(result.slice(1,3));
            }
    });
    //
    // connection.query(sql, [footprintId], function(err, footprint){
    //     if(err){
    //         res.json( {message : "error to find footprint"} );
    //     }
    //
    //     res.json(JSON.parse(JSON.stringify(footprint)));
    // });
};

var getFootprintList = function(req, res){
    var sql = "SELECT footprint.*, count(view.view_id) AS viewCount " +
        "FROM footprint " +
        "INNER JOIN view " +
        "ON footprint.footprint_id = view.footprint_id " +
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
    var sql = "SELECT * " +
        "FROM footprint WHERE latitude <= ? AND longitude >= ? AND latitude >= ? AND longitude <= ?";

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
    var sql = "SELECT * FROM footprint WHERE latitude <= ? AND longitude >= ? AND latitude >= ? AND longitude <= ?";

    connection.query(sql, [startLat, startLng, endLat, endLng], function(err, footprintList){
       if(err){
           throw err;
       }

       var footprintListJSON = JSON.parse(JSON.stringify(footprintList));
       res.json(footprintListJSON);
    });

};

var createFootprint = function(req, res){
    var data = req.body;
    //console.log("#debug createFootprint\ndata : " + data);
    //console.log(req.body, req.isAuthenticated(), req.user);

    var sql = "INSERT INTO footprint (id, title, icon_url, content, latitude, longitude)"
        + " VALUES (?, ?, ?, ?, ?, ?)";

    connection.query(sql, [req.user.id ,data.title, data.icon_url, data.content, data.latitude, data.longitude],
        function(err, result){
            if(err){
                throw err;
            }else{
                if(result){
                    res.json({message: 'success to create footprint'});
                }else{
                    res.json({message: 'fail to create'});
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