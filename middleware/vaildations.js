const MAX_TITLE_LENGTH = 70,
    MAX_CONTENT_LENGTH = 1000;

const MSG_TITLE_EMPTY = '제목이 비어있습니다.',
    MSG_TITLE_OVERFLOW = '제목의 최대 길이 초과 (한글 35자, 영문/숫자 70자, 70byte)',
    MSG_CONTENT_OVERFLOW = '본문 최대 길이초과 (1000byte)',
    MSG_LATITUDE_EMPTY = 'latitude가 비어있습니다.',
    MSG_LONGITUDE_EMPTY = 'longitude가 비어있습니다.',
    MSG_LATITUDE_NAN = 'latitude가 숫자가 아닙니다.',
    MSG_LONGITUDE_NAN = 'longitude가 숫자가 아닙니다.';



var checkTitle = function (title, cb) {
    if(!title) return cb(MSG_TITLE_EMPTY);
    if(title.length > MAX_TITLE_LENGTH) return cb(MSG_TITLE_OVERFLOW);

    return cb(null);
};

var checkContent = function (content, cb) {
    if(content.length > MAX_CONTENT_LENGTH) return cb(MSG_CONTENT_OVERFLOW);

    return cb(null);
};

var checkLocation = function(lat, lng, cb){
    if(!lat) return cb(MSG_LATITUDE_EMPTY);
    if(!lng) return cb(MSG_LONGITUDE_EMPTY);

    if(isNaN(lat)) return cb(MSG_LATITUDE_NAN);
    if(isNaN(lng)) return cb(MSG_LONGITUDE_NAN);

    return cb(null);
};

var validateMarkerParams = function(req, res, next){
    // todo : vaildate parameters

    checkTitle(req.body.title, function(err){
        if(err) res.status(200).json({
            code: -1,
            message: err
        });
    });

    checkContent(req.body.content, function(err){
        if(err) res.status(200).json({
            code: -1,
            message: err
        });
    });

    checkLocation(req.body.latitude, req.body.longitude, function(err){
        if(err) res.status(200).json({
            code: -1,
            message: err
        });
    });

    next();
};

module.exports = {
    validateMarkerParams: validateMarkerParams
};