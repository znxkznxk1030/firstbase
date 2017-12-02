var async = require("async");
var xss = require("xss");
const MAX_TITLE_LENGTH = 70,
    MAX_CONTENT_LENGTH = 1000;

const MSG_TITLE_EMPTY = '제목이 비어있습니다.',
    MSG_TITLE_OVERFLOW = '제목의 최대 길이 초과 (한글 35자, 영문/숫자 70자, 70byte)',
    MSG_CONTENT_OVERFLOW = '본문 최대 길이초과 (1000byte)',
    MSG_LATITUDE_EMPTY = 'latitude가 비어있습니다.',
    MSG_LONGITUDE_EMPTY = 'longitude가 비어있습니다.',
    MSG_LATITUDE_NAN = 'latitude가 숫자가 아닙니다.',
    MSG_LONGITUDE_NAN = 'longitude가 숫자가 아닙니다.';

var validateMarkerParams = function(req, res, next){
    // todo : vaildate parameters

    const title = xss(req.body.title),
        content = xss(req.body.content),
        lat = xss(req.body.latitude),
        lng = xss(req.body.longitude);

    console.log(lat);

    var task = [
        function (cb) {
            if(!title || title.length <= 0) return cb(MSG_TITLE_EMPTY);
            if(title.length > MAX_TITLE_LENGTH) return cb(MSG_TITLE_OVERFLOW);

            return cb(null);
        },
        function (cb) {
            if(content.length > MAX_CONTENT_LENGTH) return cb(MSG_CONTENT_OVERFLOW);

            return cb(null);
        },
        function(cb){
            if(!lat) return cb(MSG_LATITUDE_EMPTY);
            if(!lng) return cb(MSG_LONGITUDE_EMPTY);

            if(isNaN(lat)) return cb(MSG_LATITUDE_NAN);
            if(isNaN(lng)) return cb(MSG_LONGITUDE_NAN);

            return cb(null);
        }
    ];

    async.series(task, function(err){
        if(err) return res.status(200).json({
            code: -1,
            message: err
        });

        else return next();
    });
};

module.exports = {
    validateMarkerParams: validateMarkerParams
};