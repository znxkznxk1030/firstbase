var mongoose = require('mongoose');

var config = require("./config");
var jwt = require("jsonwebtoken");
var request = require('request');
var async = require('async');
var _ = require('underscore');

var SECRET = config.token_secret;
var ONEDAY = 1000 * 60 * 60 * 24;
var ONEWEEK = ONEDAY * 7;

var Chat = require('./model').Chat;
var Pos = require('./model').Pos;

var startSocketIo;
startSocketIo = function (server) {
    var io = require('socket.io')(server);

    io.on('connection', function (socket) {


        //Chat.collection.drop();

        Chat.find({timeStamp: {$gt: Date.now() - ONEWEEK}}).exec(function (err, docs) {
            if (err) {
                console.log(err);
                throw err;
            }
            socket.emit('load old msgs', docs);
        });


        socket.on('emit ping', function (data) {
            console.log(data);
            io.emit('get ping', data);

            //console.log(data.detail.addrdetail.dongmyun);

            var query = encodeURI('식당');
            var clientId = config.naver_client_id;
            var clientSecret = config.naver_client_secret;
            var lat = data.lat, lng = data.lng;
            const diff = 0.001;
            var type = 'DINING';

            console.log(lat, lng);

            var url = 'http://map.naver.com/search2/interestSpot.nhn?type=' + type + '&boundary=' + (lng - diff) +
                '%3B' + (lat - diff) + '%3B' + (lng + diff) + '%3B' + (lat + diff) + '&pageSize=100';


            var options = {
                url: url
                //headers: {'X-Naver-Client-Id': clientId, 'X-Naver-Client-Secret': clientSecret}
            };

            request.get(options, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    //console.log('11');
                    //console.log(body);

                    if (JSON.parse(body).result) {
                        var sites = JSON.parse(body).result.site;
                        sites.map(function (site) {
                            var dist = Math.sqrt(Math.pow(Math.abs(site.x - lng), 2) + Math.pow(Math.abs(site.y - lat), 2));

                            return _.extend(site, {dist: dist});
                        });

                        sites.sort(function (a, b) {
                            return a.dist - b.dist;
                        });
                        console.log(sites);

                        _.extend(data, {total: sites.length, sites: sites});
                    }
                }
                io.emit('get ping', data);
            });

            url = 'http://map.naver.com/common2/loginInfo.nhn';
            options = {
                method: 'GET',
                url: url
                // headers: {//'Content-Type': 'application/x-www-form-urlencoded'
                //     //'X-Naver-Client-Id': clientId, 'X-Naver-Client-Secret': clientSecret
                // }
                // multipart: [{
                //     'Content-Type': 'application/x-www-form-urlencoded',
                //     body: JSON.stringify({id: 'PerimeterInfo_s18394397'})
                // }]
            };

            request.get(options, function (error, response, body) {
                console.log(body);
            });


            url = 'http://map.naver.com/search2/getSiteInfo.nhn';
            console.log(url);

            //var j = request.jar();
            //j.setCookie();
            options = {
                method: 'POST',
                url: url,
                jar : {
                    _naver_usersession_:'aBg5WYpy/Kd2CewfpcJSNA==',
                    ASID:'3d2b8b040000015e97eca0590000004c'
                },
                headers: {'Content-Type': 'application/x-www-form-urlencoded',
                    'X-Requested-With':'XMLHttpRequest',
                    'Referer':'http://map.naver.com/',
                    'Origin' : 'http://map.naver.com/'
                    //'Accept-Encoding': 'gzip, deflate'
                },
                multipart: [{
                    'Content-Type': 'application/x-www-form-urlencoded',
                    body: 'id=PerimeterInfo_s18394397'
                }]
            };

            request.post(options, function (error, response, body) {
                console.log(body);
            });

        });

        socket.on('join to team-map', function (data) {
            //socket.teamId = data.teamId;
            console.log('displayName : ' + data.displayName);
            socket.displayName = data.displayName;
            Pos.collection.drop();
        });

        socket.on('send position', function (data) {
            // console.log('send position : ' + data.coord.lat);
            // socket.broadcast.to(data).emit('team-map', 'test');

            var newPos = new Pos({
                displayName: socket.displayName,
                lat: data.coord.lat,
                lng: data.coord.lng
            });

            Pos.find({displayName: socket.displayName}).exec(function (err, docs) {
                console.log(docs);

                if (err) throw err;
                else {
                    if (!docs[0]) {
                        newPos.save(function (err) {
                            if (err) {
                                throw err;
                            }
                        });
                    }
                    else {
                        Pos.update({displayName: socket.displayName},
                            {
                                $set: {
                                    lat: data.coord.lat,
                                    lng: data.coord.lng,
                                    timeStamp: Date.now()
                                }
                            }, function (err) {
                                if (err) throw err;
                            });
                    }
                }
            });
        });

        socket.on('get position', function () {
            Pos.find().exec(function (err, docs) {
                if (err) {
                    console.log(err);
                    throw err;
                }

                console.log(docs);
                io.emit('show', docs);
            });
        });

        socket.on('login', function (data) {
            socket.displayName = data.displayName;
            io.emit('login', data.displayName);
        });

        socket.on('login-android', function (data) {

            const token = data.token;
            var displayName;


            if (token !== null && token !== '' && token !== 'undefined') {
                jwt.verify(token, SECRET, function (err, decoded) {
                    if (err) {
                        displayName = "비회원";
                    } else {
                        displayName = decoded.displayName;
                    }
                });
            } else {
                displayName = "비회원";
            }

            socket.displayName = displayName;

            io.emit('login', displayName);

        });

        socket.on('disconnect', function () {
            console.log(socket.displayName + '님이 나가셨습니다.');
        });

        socket.on('chat', function (data) {
            var displayName = "나그네";

            if (typeof data.displayName !== 'undefined') {
                displayName = data.displayName;
            }

            socket.displayName = displayName;

            var date = new Date(Date.now());

            var msg = {
                displayName: displayName,
                msg: data.msg,

                date: date.toLocaleDateString(),
                time: (date.getHours() + 9) + '시 ' + date.getMinutes() + '분'
            };

            var newMsg = new Chat({
                msg: data.msg,
                displayName: displayName,
                date: date.toLocaleDateString(),
                time: (date.getHours() + 9) + '시 ' + date.getMinutes() + '분'
            });

            newMsg.save(function (err) {
                if (err) {
                    throw err;
                }
                else {
                    console.log('debug#' + msg);
                    msg.isSelf = false;
                    socket.broadcast.emit('chat', msg);
                    msg.isSelf = true;
                    socket.emit('chat', msg);
                }
            });
        });
    });
};

exports.startSocketIO = startSocketIo;