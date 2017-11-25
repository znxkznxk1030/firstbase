var config = require("./config");
var jwt = require("jsonwebtoken");

var xss = require('xss');

var SECRET = config.token_secret;
var ONEDAY = 1000 * 60 * 60 * 24;
var ONEWEEK = ONEDAY * 7;

var Chat = require('./model').Chat;

var startSocketIo = function (server) {
    var io = require('socket.io')(server);

    /**
     * chat (socket.io)
     */
    io.on('connection', function (socket) {

        Chat.find({timeStamp: {$gt: Date.now() - ONEWEEK}}).exec(function (err, docs) {
            if (err) {
                console.log(err);
                throw err;
            }
            socket.emit('load old msgs', docs);
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

            const token = data.token;
            var displayName = "비회원";

            if (typeof data.displayName !== 'undefined') {
                displayName = data.displayName;
            }

            if (token !== null && token !== '' && token !== 'undefined') {
                jwt.verify(token, SECRET, function (err, decoded) {
                    if (!err) {
                        displayName = decoded.displayName;
                    }
                });
            }

            socket.displayName = displayName;

            var date = new Date(Date.now());
            const msgSafe = xss(data.msg);

            var msg = {
                displayName: displayName,
                msg: msgSafe,
                timeStamp: Date.now(),
                date: date.toLocaleDateString(),
                time: ((date.getHours() + 9)%24) + '시 ' + date.getMinutes() + '분'
            };

            var newMsg = new Chat({
                msg: msgSafe,
                displayName: displayName,
                timeStamp: Date.now(),
                date: date.toLocaleDateString(),
                time: ((date.getHours() + 9)%24) + '시 ' + date.getMinutes() + '분'
            });

            newMsg.save(function (err) {
                if (err) {
                    throw err;
                }
                else {
                    console.log('debug#' + msgSafe);
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