const connection = require('../database/db');
const async = require('async');
const retrieveByKey = require("./files").retrieveByKey;
const profileDefaultKey = 'profiledefault.png';
const _ = require('underscore');
var passwordUtil = require("../auth/password");
var uploadUserImage = require("./files").uploadUserImage;

var registrateSocialUser = function registrateSocialLoginUser(data, cb){
    var sql = 'INSERT INTO user (id, displayName, provider) VALUES (?, ?, ?)';
    connection.query(sql, [data.id, data.displayName, data.provider], function(err, result){
        if(err) throw err;
        console.log('#debug registrateSocialUser result : ' + result);
        cb(null, true);
    });
};

var isFormVaildMiddleware = function(req, res, next){
    const userId = req.body.id,
        userDisplayName = req.body.displayName,
        userPassword1 = req.body.password1,
        userPassword2 = req.body.password2;

    console.log(userId + userPassword1 + userPassword2);

    const sqlIsExisted =
        "SELECT * FROM user WHERE id = ?";

    const task = [
        /*
            Check DisplayName's validation.
            1. length (5 < && < 25)
         */
        function(cb){
            if(userDisplayName === null || userDisplayName === '' || userDisplayName === 'undefined')
                return cb('닉네임 입력 칸이 비어있습니다.', null);

            const length = userDisplayName.length;

            if(length < 2)
                return cb('닉네임의 길이가 너무 짧습니다.', null);
            if(length > 25)
                return cb('닉네임의 길이가 너무 깁니다.', null);

            const sqlDisplayCheck = "SELECT * FROM user WHERE displayName = ? ";

            connection.query(sqlDisplayCheck, [userDisplayName], function(err, result){
                if(err) return cb(err, null);

                if(result[0]){
                    return cb('이미 존재하는 닉네임입니다', null);
                }else{
                    return cb(null);
                }
            });
        },
        /*
            Check ID is valid.

            1. Check id form is not blank.
            2. Check length of id is between 8 and 20.
            3. Check id has a valid email domain.
            4. Check id is unique.
         */
        function(cb){

            if(userId === null || userId === 'undefined' || userId === '')
                return cb('ID 입력 칸이 비어있습니다', null);

            const length = userId.length;
            const userIdSplitByDomain = userId.split('@');
            const ACCEPTED_DOMAIN = [
                'naver.com',
                'gmail.com',
                'daum.net'
            ];

            if(length < 8)
                return cb('ID의 길이가 너무 짧습니다.', null);
            if(length > 25)
                return cb('ID의 길이가 너무 깁니다.', null);

            console.log(userIdSplitByDomain);

            if(userIdSplitByDomain.length !== 2)
                return cb('ID의 형식은 e-mail 형식이여야 합니다.', null);

            const domain = userIdSplitByDomain[1];
            var hasAcceptedDomain = false;

            ACCEPTED_DOMAIN.forEach(function(acceptedDomain){
                if(acceptedDomain === domain)
                    hasAcceptedDomain = true;
            });

            if(hasAcceptedDomain === false)
                return cb('사용가능한 도메인을 사용해주세요.(gmail, naver, daum)', null);

            connection.query(sqlIsExisted, [userId],
                function(err, user)
                {
                    if(err)
                        return cb(err, null);
                    console.log(user);
                    if(user[0])
                        return cb('존재하는 아이디 입니다.', null);

                    else return cb(null);
                });
        },
        /*
            Password Safety Term.
            1. Check two password is same
            2. Check password' length is between 8 and 20
            3. Check password has more than 3 digits, special char, char
         */
        function(cb){
            if(userPassword1 !== userPassword2)
                return cb('두 패스워드 값이 일치하지 않습니다.', null);

            const length = userPassword1.length;
            console.log(length);

            if(length < 8)
                return cb('패스워드의 길이가 너무 짧습니다.', null);

            if(length > 20)
                return cb('패스워드의 길이가 너무 깁니다.', null);

            var numOfDigit = 0,
                numOfSpecial = 0,
                numOfChar = 0,
                unVaildChar = false;

            for(var i = 0; i < userPassword1.length; i++)
            {
                var code = userPassword1.charCodeAt(i);

                console.log(code);

                if(33 <= code && code <= 47)
                    numOfSpecial++;
                else if(58 <= code && code <= 64)
                    numOfSpecial++;
                else if(91 <= code && code <= 96)
                    numOfSpecial++;
                else if(48 <= code && code <= 57)
                    numOfDigit++;
                else if(65 <= code && code <= 122)
                    numOfChar++;
                else unVaildChar = true;
            }

            console.log("special : " + numOfSpecial);
            console.log("char : " + numOfChar);
            console.log("digit : " + numOfDigit);

            if(unVaildChar)
                return cb('입력된 패스워드 값에 인식되지 않는 값이 있습니다.', null);

            if(numOfDigit < 3)
                return cb('패스워드는 3개 이상의 숫자를 포함하여야 합니다.', null);

            if(numOfSpecial < 0)
                return cb('패스워드는 0개 이상의 특수문자를 포함하여야 합니다.', null);

            if(numOfChar < 3)
                return cb('패스워드는 3개 이상의 문자를 포함하여야 합니다.', null);


            return cb(null);


        }
    ];

    async.series(task, function(err, result){
        if(err)
            return res.status(401)
                .json({code:-2,
                    message:err});
        else return next();
    });
};

var registrateUser = function registrateUser(formData, cb){
    // todo: refactoring
    // callback hell -> async heaven
    findOne(formData.id, function(err, user){
        passwordUtil.passwordCreate(formData.password1, function(err, password){
            if(err) throw err;

            var sql = 'INSERT INTO user (id, displayName, provider) VALUES (?, ?, ?)';
            connection.query(sql, [formData.id, formData.displayName, 'Local'], function(err, result){
                if(err) return cb(err, false);

                connection.query('INSERT INTO password (id, password) VALUES(?,?)', [formData.id, password], function(err, result){
                    if(err) {
                        connection.query('DELETE FROM user WHERE id=?', [formData.id], function(err, result){
                            if(err) return cb(err, false);
                        });
                        return cb(err, false);
                    }
                    console.log(result);
                    if(result){
                        return cb(null, true);
                    }else {
                        connection.query('DELETE FROM user WHERE id=?', [formData.id], function(err, result){
                            if(err) return cb(err, false);
                        });
                    }
                });
            });
        });
    });
};

var findOne = function findOne(id, cb){
    var sql = 'SELECT * FROM user WHERE id = ?';
    connection.query(sql, [id], function(err, result){
        if(err){
            throw err;
        }

        var user = JSON.parse(JSON.stringify(result))[0];
        console.log(user);
        cb(null, user);
    });
};

var findPassword = function findPassword(id, cb){
    connection.query('SELECT * FROM password WHERE id=?', [id], function(err, result) {
        if(err) throw err;

        var ret = JSON.parse(JSON.stringify(result));
        console.log(ret);
        if(typeof ret[0] !== 'undefined'){
            cb(null, ret[0].password);
        }else{
            cb({error:"not found"}, false);
        }
    });
};

var nicknameCheck = function(req, res){

    const nickName = req.param.nickName;
    const sql = "SELECT * FROM user WHERE user.displayName = ?";

    //todo: validate nickName
    if(!nickName)
    {
        return res.status(200)
            .json({code: -1,
                isPossible: -1,
                message: "nickName should be not null"});
    }


    connection.query(sql, [nickName],
        function(err, profile){
            if (err) return res.status(400)
                .json({code: -1,
                    message: err});

            if(profile.displayName){
                return res.status(200)
                    .json({code: 1,
                        isPossible: -1,
                        message : 'this name is already existed!'});
            }else{
                return res.status(200)
                    .json({code:1,
                        isPossible: 1,
                        message : 'possible to use'});
            }
    })
};

var updateUserInfo = function(req, res){
    const sql = "UPDATE user SET displayName = ?, description = ? WHERE user.id = ? ";
    const body = req.body;

    const user = req.user;

    const displayName = body.displayName;
    var description = body.description;

    // todo: vaildate parameters
    if(!displayName)
    {
        return res.status(400)
            .json({code: -1,
            message: "display name should be not null"});
    }

    if(!description)
    {
        description = "Say Something About Me";
    }

    connection.query(sql, [displayName, description, user.id],
        function(err, userUpdated){
            if(err)
                return res.status(400)
                    .json({code:-1,
                        message:'sql error'});

            return res.status(200)
                .json({code: 1,
                    message:'success to update profile'});
    });
};

var updateUserImage = function(req, res){
    const sql = "UPDATE user SET profile_key = ? WHERE user.id = ? ";

    uploadUserImage(req, function(err, profileImage){
        if(err) res.json(err);
        connection.query(sql, [profileImage.key, req.user.id],
            function(err, userUpdated){
                if(err) return res.status(400)
                                .json({code: -1,
                                    message: err});

                if(userUpdated)
                {
                    return res.status(200)
                        .json({code: 1,
                            profileUrl: profileImage.url});
                }else
                {
                    return res.status(400)
                        .json({code:-1,
                            message:'update error'});
                }
            });
    });
};

var getUserInfoByUserDisplayName = function(req, res){
    const sql = "SELECT displayName, provider, description, profile_key " +
        "FROM user " +
        "WHERE user.displayName = ? ";

    const displayName = req.query.displayName;

    const task = [
        function(cb){
            //console.log("dd" + req.user.id);
            if(!displayName.isNullOrUndefined) return cb(null, displayName);
            else return cb({code: -1, message: 'Not Authenticated'}, null);
        },
        function(displayName, cb){
            connection.query(sql, displayName, function(err, profile){
                if (err) return cb({code: -1, message: 'sql error'}, null);

                if(profile[0])
                    return cb(null, profile);
                else return cb('user is not existed', null);
            });
        },
        function(profile, cb){
            var profileUrl, profileKey = JSON.parse(JSON.stringify(profile))[0].profile_key;
            //console.log(profileKey);
            if(profileKey) profileUrl = retrieveByKey(profileKey);
            else profileUrl = retrieveByKey(profileDefaultKey);

            return cb(null, _.extend(profile[0], { profileUrl: profileUrl }));
        }
    ];

    async.waterfall(task,
        function(err, profile){
            if(err) return res.status(400)
                .json({code: -1,
                    message:err});

            return res.status(200)
                .json(profile);
        });
};

var getUserInfoByUserId = function(req, res){

    const sql = "SELECT displayName, provider, description, profile_key " +
        "FROM user " +
        "WHERE user.id = ? ";

    const id = req.query.id;

    const task = [
        function(cb){
            //console.log("dd" + req.user.id);
            if(!id.isNullOrUndefined) return cb(null, id);
            else return cb({code: -1, message: 'Not Authenticated'}, null);
        },
        function(id, cb){
            connection.query(sql, id, function(err, profile){
                if (err) return cb({code: -1, message: 'sql error'}, null);

                return cb(null, profile);
            });
        },
        function(profile, cb){
            var profileUrl, profileKey = JSON.parse(JSON.stringify(profile))[0].profile_key;
            //console.log(profileKey);
            if(profileKey) profileUrl = retrieveByKey(profileKey);
            else profileUrl = retrieveByKey(profileDefaultKey);

            return cb(null, _.extend(profile[0], { profileUrl: profileUrl }));
        }
    ];

    async.waterfall(task,
        function(err, profile){
            if(err) return res.status(400)
                .json({code: -1,
                    message:err});

            return res.status(200)
                .json(profile);
        });
};

var getUserInfoByReqHeader = function(req, res){

    const sql = "SELECT id, displayName, provider, description, profile_key " +
        "FROM user " +
        "WHERE user.id = ? ";

    const task = [
        function(cb){
            //console.log("dd" + req.user.id);
            if(req.user) cb(null, req.user);
            else cb({code: -1, message: 'Not Authenticated'}, null);
        },
        function(user, cb){
            //console.log(user);
            connection.query(sql, user.id, function(err, profile){
                if (err) return cb({code: -1, message: 'sql error'}, null);

                return cb(null, profile);
            });
        },
        function(profile, cb){
            var profileUrl, profileKey = JSON.parse(JSON.stringify(profile))[0].profile_key;
            //console.log(profileKey);
            if(profileKey) profileUrl = retrieveByKey(profileKey);
            else profileUrl = retrieveByKey(profileDefaultKey);

            return cb(null, _.extend(profile[0], { profileUrl: profileUrl }));
        }
    ];

    async.waterfall(task,
        function(err, profile){
            if(err) return res.status(400)
                            .json({code: -1,
                                message:err});

            return res.status(200)
                .json(profile);
    });
};

module.exports = {
    nicknameCheck: nicknameCheck,
    getUserInfoByReqHeader:getUserInfoByReqHeader,
    updateUserInfo: updateUserInfo,
    updateUserImage: updateUserImage,
    getUserInfoByUserDisplayName: getUserInfoByUserDisplayName,
    getUserInfoByUserId: getUserInfoByUserId,
    findOne: findOne,
    findPassword : findPassword,
    registrateSocialUser: registrateSocialUser,
    registrateUser : registrateUser,
    isFormVaildMiddleware : isFormVaildMiddleware
};