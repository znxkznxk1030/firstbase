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

var validateMarkerParams = function (req, res, next) {

    console.log(req.body);

    const title = xss(req.body.title),
        content = xss(req.body.content),
        lat = xss(req.body.latitude),
        lng = xss(req.body.longitude);

    console.log("데이터가 어디로 사라졌을까1 : " + lat, lng);

    var task = [
        function (cb) {
            console.log("데이터가 어디로 사라졌을까2 : " + lat, lng);
            if (!title || title.length <= 0) return cb(MSG_TITLE_EMPTY);
            if (title.length > MAX_TITLE_LENGTH) return cb(MSG_TITLE_OVERFLOW);

            return cb(null);
        },
        function (cb) {
            console.log("데이터가 어디로 사라졌을까3 : " + lat, lng);
            if (content.length > MAX_CONTENT_LENGTH) return cb(MSG_CONTENT_OVERFLOW);

            return cb(null);
        },
        function (cb) {
            console.log("데이터가 어디로 사라졌을까4 : " + lat, lng);

            if (!lat) return cb(MSG_LATITUDE_EMPTY);
            if (!lng) return cb(MSG_LONGITUDE_EMPTY);

            if (isNaN(lat)) return cb(MSG_LATITUDE_NAN);
            if (isNaN(lng)) return cb(MSG_LONGITUDE_NAN);

            return cb(null);
        }
    ];

    async.series(task, function (err) {
        if (err) return res.status(400).json({
            code: -1,
            message: err
        });

        else return next();
    });
};

module.exports = {
    validateMarkerParams: validateMarkerParams
};