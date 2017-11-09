var mongoose = require('mongoose');

var config = require("./config");
var jwt = require("jsonwebtoken");

var SECRET = config.token_secret;
var ONEDAY = 1000 * 60 * 60 * 24;
var ONEWEEK = ONEDAY * 7;

mongoose.connect('mongodb://127.0.0.1:27017', {
    useMongoClient: true
}, function (err) {
    if (err) {
        console.log(err);
    } else {
        console.log('mongodb connect');
    }
});

var posSchema = mongoose.Schema({
    room: {type: String, default: 'global'},

    displayName: String,
    lat: Number,
    lng: Number,

    timeStamp: {type: Date, default: Date.now}
});

var Pos = mongoose.model('Position', posSchema);

var startSocketIo = function (server) {
    var io = require('socket.io')(server);

    io.on('connection', function (socket) {
        socket.on('join to team-map', function (data) {
            //socket.teamId = data.teamId;
            console.log('displayName : ' + data.displayName);
            socket.displayName = data.displayName;
            //Pos.collection.drop();
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
    });
};

exports.startSocketIO = startSocketIo;