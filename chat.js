var mongoose = require('mongoose');

var config = require("./config");
var jwt = require("jsonwebtoken");
var SECRET = config.token_secret;

var AWS = require('aws-sdk');

AWS.config.update({});

mongoose.connect('mongodb://localhost:27017', {
    useMongoClient: true
});

var chatSchema = mongoose.Schema({
    room: {type: String, default: "global"},

    displayName: String,
    msg: String,

    date: String,
    time: String,
    timeStamp: {type: Date, default: Date.now}
});

var Chat = mongoose.model('Message', chatSchema);

var startSocketIo = function(server){
    var io = require('socket.io')(server);

    /**
     * chat (socket.io)
     */
    io.on('connection', function(socket){

        Chat.find().limit(30).exec(function(err, docs){
            if(err) throw err;
            console.log(docs);
            socket.emit('load old msgs', docs);
        });

        socket.on('login', function(data){
            socket.displayName = data.displayName;
            io.emit('login', data.displayName);
        });

        socket.on('login-android', function(data){

            const token = data.token;
            var displayName;

            console.log(token);

            if(token !== null && token !== '' && token !== 'undefined')
            {
                jwt.verify(token, SECRET, function(err, decoded){
                    if(err)
                    {
                        displayName = "비회원";
                    }else
                    {
                        displayName = decoded.displayName;
                    }
                });
            }else
            {
                displayName = "비회원";
            }

            socket.displayName = displayName;

            io.emit('login', displayName);

        });

        socket.on('disconnect', function(){
            console.log(socket.displayName + '님이 나가셨습니다.');
        });

        socket.on('chat', function(data){

            console.log(data);

            const token = data.token;
            var displayName;

            if(token !== null && token !== '' && token !== 'undefined')
            {
                jwt.verify(token, SECRET, function(err, decoded){
                    if(err)
                    {
                        displayName = "비회원";
                    }else
                    {
                        displayName = decoded.displayName;
                    }

                });
            }else
            {
                displayName = "비회원";
            }

            socket.displayName = displayName;

            var date = new Date(Date.now());

            var msg = {
                from:{
                    displayName : displayName
                },
                msg : data.msg,

                date : date.toLocaleDateString(),
                time : (date.getHours() + 9) + '시 ' + date.getMinutes() + '분'
            };

            var newMsg = new Chat({
                msg : data.msg,
                displayName: displayName,
                date : date.toLocaleDateString(),
                time: (date.getHours() + 9) + '시 ' + date.getMinutes() + '분'
            });

            newMsg.save(function(err){
                console.log(err);
                if(err) throw err;

                msg.isSelf = false;
                socket.broadcast.emit('chat', msg);
                msg.isSelf = true;
                socket.emit('chat', msg);
            });
        });
    });
};

exports.startSocketIO = startSocketIo;