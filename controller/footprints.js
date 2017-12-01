const connection = require('../database/db');
const user = require('./users');
const locationUtil = require('../utils/locationUtil');
const async = require('async');
const bucketName = 'firstbase-bucket';
const AWS = require('aws-sdk');


const Footprint = require('../database/footprints').Footprint;

const _ = require('underscore');
var util = require("../utils/util");
var xss = require("xss");
var sendCreateFootprintFcmToFollowers = require("../fcm/fcm").sendCreateFootprintFcmToFollowers;
var sendFcm = require("../fcm/fcm").sendFcm;
var getImageUrl = require("./files").getImageUrl;
var retrieveByKey = require("./files").retrieveByKey;
const profileDefaultKey = 'profiledefault.png';

AWS.config.loadFromPath('s3config.json');

/**
 *  standard time : seoul ( ap-northeast-2 )
 * @type {S3}
 */
const s3 = new AWS.S3({region: 'ap-northeast-2'});

var getAuthor = function (footprintId, cb) {

    const sqlGetAuthor = "SELECT footprint.id FROM footprint WHERE footprint_id = ?";

    connection.query(sqlGetAuthor, [footprintId], function (err, author) {
        if (err) return cb(err, null);

        const objectAuthor = JSON.parse(JSON.stringify(author))[0];

        if (objectAuthor) return cb(null, objectAuthor);
        else return cb('없는 게시글입니다.', null);
    });
};

var getFootprintListByDisplayName = function (req, res) {
    const id = req.author.id;
    const displayName = req.query.displayName;

    //console.log(displayName);

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

    connection.query(sqlRetrieveFootprint, [id],
        function (err, footprintList) {
            if (err)
                return res.status(400).json(util.message(-1, '게시물 리스트 불러오기 오류'));

            var footprintListJSON = JSON.parse(JSON.stringify(footprintList));

            async.map(footprintListJSON, function (footprint, cb) {

                var task = [
                    function (callback) {
                        connection.query(sqlFindUser, footprint.id, function (err, profile) {
                            if (err) return callback(err);

                            profile = JSON.parse(JSON.stringify(profile))[0];

                            delete footprint.id;
                            footprint.displayName = displayName;

                            //console.log(profile);

                            var profileUrl, profileKey = profile.profile_key;
                            if (profileKey) profileUrl = getImageUrl(profileKey);
                            else profileUrl = getImageUrl(profileDefaultKey);

                            return callback(null, {profileUrl: profileUrl});
                        });
                    },
                    function (tails, callback) {
                        connection.query(sqlCountLike, [footprint.footprint_id],
                            function (err, countLike) {
                                if (err) return callback(err);

                                const ret = JSON.parse(JSON.stringify(countLike))[0];

                                return callback(null, _.extend(tails, ret));
                            });
                    },
                    function (tails, callback) {
                        connection.query(sqlCountDislike, [footprint.footprint_id],
                            function (err, Dislike) {
                                if (err) return callback(err);

                                const ret = JSON.parse(JSON.stringify(Dislike))[0];

                                return callback(null, _.extend(tails, ret));
                            });
                    }

                ];

                async.waterfall(task, function (err, tails) {
                    if (err) return cb(err);
                    return cb(null, _.extend(footprint, tails));
                });
            }, function (err, result) {
                if (err) return res.status(400).json(util.message(-1, '게시물 리스트 불러오기 오류'));
                else {
                    res.status(200).json(result);
                }
            });
        });
};
var getFootprintList = function (req, res) {

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

    const sqlFindUser = "SELECT displayName, profile_key " +
        "FROM user " +
        "WHERE user.id = ? ";

    const sqlCountLike =
        "SELECT count(*) AS countLike " +
        "FROM eval WHERE footprint_id = ? AND state = 1";

    const sqlCountDislike =
        "SELECT count(*) AS countDisLike " +
        "FROM eval WHERE footprint_id = ? AND state = 2";

    connection.query(sqlRetrieveFootprint, [],
        function (err, footprintList) {
            if (err)
                return res.status(400).json(util.message(-1, '게시물 리스트 불러오기 오류'));

            var footprintListJSON = JSON.parse(JSON.stringify(footprintList));

            async.map(footprintListJSON, function (footprint, cb) {

                var task = [
                    function (callback) {
                        var displayName;
                        var profileUrl, profileKey;

                        if(footprint.id){
                            connection.query(sqlFindUser, footprint.id, function (err, profile) {
                                if (err) return callback(err);

                                profile = JSON.parse(JSON.stringify(profile))[0];

                                displayName = profile.displayName;

                                profileKey = profile.profile_key;
                                if (profileKey) profileUrl = getImageUrl(profileKey);
                                else profileUrl = getImageUrl(profileDefaultKey);

                                return callback(null, {displayName: displayName, profileUrl: profileUrl});
                            });
                        }else{
                            profileUrl = getImageUrl(profileDefaultKey);
                            return callback(null, {profileUrl:profileUrl});
                        }
                    },
                    function (tails, callback) {
                        connection.query(sqlCountLike, [footprint.footprint_id],
                            function (err, countLike) {
                                if (err) return callback(err);

                                const ret = JSON.parse(JSON.stringify(countLike))[0];

                                return callback(null, _.extend(tails, ret));
                            });
                    },
                    function (tails, callback) {
                        connection.query(sqlCountDislike, [footprint.footprint_id],
                            function (err, Dislike) {
                                if (err) return callback(err);

                                const ret = JSON.parse(JSON.stringify(Dislike))[0];

                                return callback(null, _.extend(tails, ret));
                            });
                    }

                ];

                async.waterfall(task, function (err, tails) {
                    if (err) return cb(err);
                    return cb(null, _.extend(footprint, tails));
                });
            }, function (err, result) {
                if (err) return res.status(400).json(util.message(-1, '게시물 리스트 불러오기 오류'));

                else res.status(200).json(result);
            });
        });
};
var getFootprintListByCurrentLocationAndViewLevel = function (req, res) {
    var data = req.query;
    var sql = "SELECT footprint.*, count(view.view_id) AS countView, count(comment.comment_id) AS countComments " +
        "FROM footprint LEFT JOIN view " +
        "ON footprint.footprint_id = view.footprint_id " +
        "LEFT JOIN comment " +
        "ON footprint.footprint_id = comment.footprint_id " +
        "WHERE footprint.latitude <= ? AND footprint.longitude >= ? AND footprint.latitude >= ? AND footprint.longitude <= ? " +
        "GROUP BY footprint_id ";

    console.log("data : ", data);
    locationUtil.getDistanceByViewLevel(data.level, function (err, distance) {
        locationUtil.distanceToLatitude(distance, function (err, diffLat) {
            locationUtil.distanceToLongitude(distance, function (err, diffLng) {
                console.log('diffLat : ' + diffLat);
                console.log('diffLng : ' + diffLng);
                var startLat = parseFloat(data.lat) + diffLat, startLng = parseFloat(data.lng) - diffLng;
                var endLat = parseFloat(data.lat) - diffLat, endLng = parseFloat(data.lng) + diffLng;
                console.log(startLat, startLng);
                console.log(endLat, endLng);
                connection.query(sql, [data.lat, startLng, endLat, endLng], function (err, footprintList) {
                    if (err) {
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
var getFootprintListByLocation = function (req, res) {

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
        "GROUP BY footprint_id " +
        "ORDER BY footprint.created_date " +
        "LIMIT 100 ";

    const sqlFindUser = "SELECT profile_key, displayName " +
        "FROM user " +
        "WHERE user.id = ? ";

    const sqlCountLike =
        "SELECT count(*) AS countLike " +
        "FROM eval WHERE footprint_id = ? AND state = 1";

    const sqlCountDislike =
        "SELECT count(*) AS countDisLike " +
        "FROM eval WHERE footprint_id = ? AND state = 2";

    connection.query(sqlRetrieveFootprint, [startLat, startLng, endLat, endLng],
        function (err, footprintList) {
            if (err)
                return res.status(400).json(util.message(-1, '게시물 리스트 불러오기 오류'));

            var footprintListJSON = JSON.parse(JSON.stringify(footprintList));

            async.map(footprintListJSON, function (footprint, cb) {

                var task = [
                    function (callback) {

                        var displayName;
                        var profileUrl, profileKey;

                        if(footprint.id){
                            connection.query(sqlFindUser, footprint.id, function (err, profile) {
                                if (err) return callback(err);

                                profile = JSON.parse(JSON.stringify(profile))[0];

                                displayName = profile.displayName;

                                profileKey = profile.profile_key;
                                if (profileKey) profileUrl = getImageUrl(profileKey);
                                else profileUrl = getImageUrl(profileDefaultKey);

                                return callback(null, {displayName: displayName, profileUrl: profileUrl});
                            });
                        }else{
                            profileUrl = getImageUrl(profileDefaultKey);
                            return callback(null, {profileUrl:profileUrl});
                        }
                    },
                    function (tails, callback) {
                        connection.query(sqlCountLike, [footprint.footprint_id],
                            function (err, countLike) {
                                if (err) return callback(err);

                                const ret = JSON.parse(JSON.stringify(countLike))[0];

                                return callback(null, _.extend(tails, ret));
                            });
                    },
                    function (tails, callback) {
                        connection.query(sqlCountDislike, [footprint.footprint_id],
                            function (err, Dislike) {
                                if (err) return callback(err);

                                const ret = JSON.parse(JSON.stringify(Dislike))[0];

                                return callback(null, _.extend(tails, ret));
                            });
                    }

                ];

                async.waterfall(task, function (err, tails) {
                    if (err) return cb(err);
                    return cb(null, _.extend(footprint, tails));
                });

            }, function (err, result) {
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
var createFootprint = function (req, res) {

    const user = req.user;
    const body = req.body;

    var userId = null, displayName = null, footprintPassword = null;

    const title = body.title,
        iconKey = body.icon_key,
        content = body.content,
        imageKeys = body.imageKeys,
        footprintIdList = body.footprintIdList,
        latitude = body.latitude,
        longitude = body.longitude;

    if (user) {
        userId = user.id;
        displayName = user.displayName;
    }
    else {
        displayName = xss(body.displayName);
        footprintPassword = xss(body.footprintPassword);

    }

    var type = body.type;

    const sqlCreateFootprintWithAuth =
        "INSERT INTO footprint (id, title, icon_key, content, latitude, longitude, type) "
        + " VALUES (?, ?, ?, ?, ?, ?, ?)";
    const sqlCreateFootprintWithoutAuth =
        "INSERT INTO footprint (title, displayName, password, content, latitude, longitude, type)";
    const sqlInsertImage =
        "INSERT INTO image (footprint_id, image_key) " +
        "VALUES (?, ?) ";
    const sqlCreateLink =
        "INSERT INTO link (link_footprint_id, linked_footprint_id, rank) " +
        "VALUES (?, ?, ?)";

    var task = [
        function (cb) {
            // if (user) {
                connection.query(sqlCreateFootprintWithAuth, [userId, title, iconKey, content, latitude, longitude, type],
                    function (err, result) {
                        if (err || !result) {
                            return cb(true);
                        }
                        else return cb(null, result.insertId);
                    });
            // } else {
            //     connection.query(sqlCreateFootprintWithoutAuth, [title, displayName, footprintPassword, iconKey, content, latitude, longitude, type],
            //         function (err, result) {
            //             if (err || !result) {
            //                 return cb(true);
            //             }
            //             else return cb(null, result.insertId);
            //         });
            // }
        },
        function (footprintId, cb) {
            const length = imageKeys.length;

            async.times(length, function (i, next) {
                var imageKey = imageKeys[i];

                connection.query(sqlInsertImage, [footprintId, imageKey], function (err, result) {
                    if (err) {
                        console.log(err);
                        next(true);
                    }
                    else return next();
                });
            }, function (err) {
                if (err) {
                    console.log(err);
                    cb(true);
                }
                cb(null, footprintId);
            });
        },
        function (footprintId, cb) {
            if (type === 'link') {
                const length = footprintIdList.length;

                async.times(length, function (i, next) {
                    var linkedFootprintId = footprintIdList[i];

                    connection.query(sqlCreateLink, [footprintId, linkedFootprintId, i], function (err, result) {
                        if (err) {
                            console.log(err);
                            return next(true);
                        }
                        else return next();
                    });
                }, function (err) {
                    if (err) {
                        console.log(err);
                        cb(true);
                    }
                    cb(null, footprintId);
                });
            } else {
                cb(null, footprintId);
            }
        }
    ];

    async.waterfall(task, function (err, footprintId) {
        if (err) {
            return res.status(400).json({code: -1, message: '게시물 작성 오류'});
        }
        else {
            sendCreateFootprintFcmToFollowers(userId, displayName, {
                footprintId: footprintId,
                title: title
            });

            return res.status(200).json({code: 1, message: '게시물 작성 성공'});
        }
    });

};
var deleteFootprintByFootprintID = function (req, res) {

    const userId = req.user.id,
        footprintId = req.body.footprintId;

    console.log(userId);
    console.log(footprintId);

    // if(footprintId === null || typeof footprintId === 'undefined' || footprintId === ''){
    if (!footprintId) {
        return res.status(400).json({code: -1, message: "footprint 가 없습니다."});
    }

    const sqlDeleteFootprint =
        "DELETE FROM footprint WHERE footprint_id = ?";

    var task = [
        function (cb) {

            getAuthor(footprintId, function (err, author) {
                if (err) return cb(err, null);

                console.log(author.id);

                if (author.id !== userId) {
                    return cb('작성자만 게시물을 삭제 할 수 있습니다.', null);
                } else {
                    return cb(null);
                }
            });

        },
        function (cb) {

            connection.query(sqlDeleteFootprint, [footprintId],
                function (err, result) {
                    if (err) return cb(err, null);

                    return cb(null, result);
                });
        }
    ];


    async.series(task, function (err, result) {
        if (err) return res.status(400).json({code: -1, message: '게시글 삭제 오류'});
        else {
            return res.status(200).json({code: 1, message: '게시글 삭제 성공'});
        }

    });
};
var getFootprintByFootprintID = function (req, res) {
    const user = req.user;
    const footprintId = req.query.footprintId;

    // todo: query data validation test
    if (!footprintId) {
        res.status(400)
            .json({
                code: -1,
                message: 'footprintId that you sent is not allowed'
            })
    }

    var tasksForGetFootprint = Footprint({
        footprintId: footprintId,
        user: user
    }).tasksForGetFootprint;

    async.waterfall(tasksForGetFootprint,
        function (err, result) {
            if (err) {
                console.log(err);
                return res.status(400)
                    .json({
                        code: -1,
                        message: '게시글 불러오기 오류'
                    });
            }
            else {
                return res.status(200)
                    .json(_.extend(result, {code: 1}));
            }
        });
};

/**
 *
 * @param req
 * @param res
 */
var createLinkMarker = function (req, res) {
    const id = req.user.id
        , title = req.body.title
        , iconKey = req.body.iconKey
        , imageKeys = req.body.imageKeys
        , footprintIdList = req.body.footprintIdList
        , content = req.body.content
        , latitude = req.body.latitude
        , longitude = req.body.longitude;

    console.log(req.body);

    const sqlCreateLinkMarker =
        "INSERT INTO link_marker (id, title, icon_key, content, latitude, longitude) "
        + " VALUES (?, ?, ?, ?, ?, ?)";
    const sqlCreateLinkImage =
        "INSERT INTO link_image (image_key, link_marker_id) " +
        "VALUES (?, ?)";
    const sqlCreateLink =
        "INSERT INTO link (link_marker_id, footprint_id) " +
        "VALUES (?, ?)";

    var task = [
        function (cb) {
            connection.query(sqlCreateLinkMarker, [id, title, iconKey, content, latitude, longitude], function (err, result) {
                if (err || !result) {
                    console.log(err);
                    return cb(true);
                }
                else return cb(null, result.insertId);
            });
        },
        function (linkMarkerId, cb) {
            const length = imageKeys.length;

            async.times(length, function (i, next) {
                var imageKey = imageKeys[i];

                connection.query(sqlCreateLinkImage, [imageKey, linkMarkerId], function (err, result) {
                    if (err) {
                        console.log(err);
                        next(true);
                    }
                    else return next();
                });
            }, function (err) {
                if (err) {
                    console.log(err);
                    cb(true);
                }
                cb(null, linkMarkerId);
            });
        },
        function (linkMarkerId, cb) {
            const length = footprintIdList.length;

            async.times(length, function (i, next) {
                var footprintId = footprintIdList[i];

                connection.query(sqlCreateLink, [linkMarkerId, footprintId], function (err, result) {
                    if (err) {
                        console.log(err);
                        return next(true);
                    }
                    else return next();
                });
            }, function (err) {
                if (err) {
                    console.log(err);
                    cb(true);
                }
                cb();
            });
        }
    ];

    async.waterfall(task, function (err, result) {
        if (err) {
            return res.status(400).json({code: -1, message: 'link marker 생성 실패'});
        }
        else return res.status(200)
            .json({
                code: 1,
                message: 'link marker 생성 성공'
            });
    });
};

/**
 *
 * @param req
 * @param res
 */
var getLinkMarker = function (req, res) {

    const linkFootprintId = req.query.linkFootprintId;

    const sqlRetrieveFootprint =
        "SELECT footprint.*, count(comment.comment_id) AS countComments " +
        "FROM footprint " +
        "LEFT JOIN view " +
        "ON footprint.footprint_id = view.footprint_id " +
        "LEFT JOIN comment " +
        "ON footprint.footprint_id = comment.footprint_id " +
        "LEFT JOIN (SELECT linked_footprint_id AS footprint_id, rank FROM link WHERE link_footprint_id = ? ) AS link " +
        "ON link.footprint_id = footprint.footprint_id " +
        "WHERE footprint.footprint_id IN (" +
        "SELECT linked_footprint_id FROM link WHERE link_footprint_id = ? " +
        ") " +
        "GROUP BY footprint_id " +
        "ORDER BY link.rank ";

    const sqlFindUser = "SELECT profile_key, displayName " +
        "FROM user " +
        "WHERE user.id = ? ";

    const sqlCountLike =
        "SELECT count(*) AS countLike " +
        "FROM eval WHERE footprint_id = ? AND state = 1";

    const sqlCountDislike =
        "SELECT count(*) AS countDisLike " +
        "FROM eval WHERE footprint_id = ? AND state = 2";

    connection.query(sqlRetrieveFootprint, [linkFootprintId, linkFootprintId],
        function (err, footprintList) {
            if (err)
                return res.status(400).json(util.message(-1, '게시물 리스트 불러오기 오류'));

            var footprintListJSON = JSON.parse(JSON.stringify(footprintList));

            async.map(footprintListJSON, function (footprint, cb) {
                var task = [
                    function (callback) {
                        connection.query(sqlFindUser, footprint.id, function (err, profile) {
                            if (err) return callback(err);

                            profile = JSON.parse(JSON.stringify(profile))[0];

                            footprint.displayName = profile.displayName;

                            var profileUrl, profileKey = profile.profile_key;
                            if (profileKey) profileUrl = getImageUrl(profileKey);
                            else profileUrl = getImageUrl(profileDefaultKey);

                            return callback(null, {profileUrl: profileUrl});
                        });
                    },
                    function (tails, callback) {
                        connection.query(sqlCountLike, [footprint.footprint_id],
                            function (err, countLike) {
                                if (err) return callback(err);

                                const ret = JSON.parse(JSON.stringify(countLike))[0];

                                return callback(null, _.extend(tails, ret));
                            });
                    },
                    function (tails, callback) {
                        connection.query(sqlCountDislike, [footprint.footprint_id],
                            function (err, Dislike) {
                                if (err) return callback(err);

                                const ret = JSON.parse(JSON.stringify(Dislike))[0];

                                return callback(null, _.extend(tails, ret));
                            });
                    }

                ];

                async.waterfall(task, function (err, tails) {
                    if (err) return cb(err);
                    return cb(null, _.extend(footprint, tails));
                });

            }, function (err, result) {
                if (err) return res.status(400).json(util.message(-1, '게시물 리스트 불러오기 오류'));

                else res.status(200).json(result);
            });
        });
};


// /**
//  *  todo: move to trace.js
//  *
//  * @param req
//  * @param res
//  * @returns {*|{type, alias, describe}}
//  */
// var createSubFootprint = function (req, res) {
//     const body = req.body;
//
//     const iconKey = body.iconKey,
//         footprintId = body.footprintId,
//         latitude = body.latitude,
//         longitude = body.longitude;
//
//     // todo: create subFootprint
//     // parameter test
//
//     if (!title) {
//         return res.status(400)
//             .json({
//                 code: -1,
//                 message: 'title should be not null'
//             });
//     }
//
//     if (!latitude || !longitude) {
//         return res.status(400)
//             .json({
//                 code: -1,
//                 message: 'location data should be not null'
//             });
//     }
//
//     const sqlCreateSubFootprint =
//         "INSERT INTO sub_footprint ( footprint_id, icon_key, latitude, longitude ) " +
//         "VALUES (?, ?, ?, ?)";
//
//     connection.query(sqlCreateSubFootprint, [footprintId, iconKey, latitude, longitude],
//         function (err, result) {
//             if (err)
//                 return res.status(400)
//                     .json({
//                         code: -2,
//                         message: 'sql fail'
//                     });
//
//
//             if (result) {
//                 return res.status(201)
//                     .json({
//                         code: 1,
//                         message: 'success to create sub footprint mark'
//                     });
//             } else {
//                 return res.status(400)
//                     .json({
//                         code: -1,
//                         message: 'fail to create'
//                     });
//             }
//
//         }
//     );
//
// };
// var getSubFootprintByFootprintID = function (req, res) {
//     const footprintId = req.query.footprintId;
//
//     // todo: query data validation test
//     if (!footprintId) {
//         return res.status(400)
//             .json({
//                 code: -1,
//                 message: 'footprintId that you sent is not allowed'
//             })
//     }
//
//     const sqlRetrieveFootprintByFootprintId =
//         "SELECT * " +
//         "FROM footprint " +
//         "WHERE footprint_id = ?";
//
//     const sqlRetrieveSubFootprintByFootprintId =
//         "SELECT sub_footprint.icon_key AS iconKey, sub_footprint.latitude, sub_footprint.longitude " +
//         "FROM sub_footprint " +
//         "WHERE footprint_id = ? ";
//
//     const task = [
//         function (cb) {
//             connection.query(sqlRetrieveFootprintByFootprintId, [footprintId],
//                 function (err, footprint) {
//                     if (err)
//                         return cb(err, null);
//
//                     if (footprint)
//                         return cb(null, JSON.parse(JSON.stringify(footprint))[0]);
//                     else return cb('sql error', null);
//                 })
//         },
//         function (cb) {
//             connection.query(sqlRetrieveSubFootprintByFootprintId, [footprintId],
//                 function (err, subFootprints) {
//                     if (err)
//                         return cb(err, null);
//
//                     if (subFootprints)
//                         return cb(null, subFootprints);
//                     else return cb('sql error', null);
//                 });
//         }
//     ];
//
//     async.series(task,
//         function (err, result) {
//             if (err)
//                 return res.status(400)
//                     .json({
//                         code: -1,
//                         message: '서브마커 불러오기 오류'
//                     });
//
//             if (result) {
//                 // var objectResponseJson = {};
//                 // objectResponseJson.push({code: 1})
//                 //     .push(result[0])
//                 //     .push(result[1]);
//                 if (!result[0]) {
//                     return res.status(400)
//                         .json({
//                             code: -1,
//                             message: 'parameter error'
//                         });
//                 }
//
//                 result[0]['code'] = 1;
//                 result[0]['subMarkers'] = result[1];
//                 console.log(result[0]);
//
//                 return res.status(200)
//                     .json(result[0]);
//             }
//             else
//                 return res.status(400)
//                     .json({
//                         code: -1,
//                         message: 'sql output error'
//                     });
//         });
//
// };

module.exports = {
    getFootprintList: getFootprintList,
    getFootprintListByLocation: getFootprintListByLocation,
    getFootprintListByDisplayName: getFootprintListByDisplayName,

    createFootprint: createFootprint,
    getFootprintByFootprintID: getFootprintByFootprintID,
    deleteFootprintByFootprintID: deleteFootprintByFootprintID,

    getFootprintListByCurrentLocationAndViewLevel: getFootprintListByCurrentLocationAndViewLevel,

    // createSubFootprint: createSubFootprint,
    // getSubFootprintByFootprintID: getSubFootprintByFootprintID,

    createLinkMarker: createLinkMarker,
    getLinkMarker: getLinkMarker
};