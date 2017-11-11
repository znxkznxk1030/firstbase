var mongoose = require('mongoose');

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

var chatSchema = mongoose.Schema({
    room: {type: String, default: 'global'},

    displayName: String,
    msg: String,

    date: String,
    time: String,
    timeStamp: {type: Date, default: Date.now}
});

var Pos = mongoose.model('Position', posSchema);
var Chat = mongoose.model('Message', chatSchema);

module.exports = {
    Pos: Pos,
    Chat: Chat
};