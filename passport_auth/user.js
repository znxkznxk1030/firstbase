var connection = require('../database/db');
var verify = require('./verify');
var passwordUtil = require('./password');
var async = require('async');


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
            if(userDisplayName.isNullOrUndefined)
                return cb('닉네임 입력 칸이 비어있습니다.', null);

            const length = userDisplayName.length;

            if(length < 5)
                return cb('닉네임의 길이가 너무 짧습니다.', null);
            if(length > 25)
                return cb('닉네임의 길이가 너무 깁니다.', null);
        },
        /*
            Check ID is valid.

            1. Check id form is not blank.
            2. Check length of id is between 8 and 20.
            3. Check id has a valid email domain.
            4. Check id is unique.
         */
        function(cb){

            if(userId.isNullOrUndefined)
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
            var hasAccptedDomain = false;

            ACCEPTED_DOMAIN.forEach(function(accptedDomain){
                if(accptedDomain === domain)
                    hasAccptedDomain = true;
            });

            if(!hasAccptedDomain)
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
        else next();
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
                if(err) throw err;

                connection.query('INSERT INTO password (id, password) VALUES(?,?)', [formData.id, password], function(err, result){
                    if(err) {
                        connection.query('DELETE FROM user WHERE id=?', [formData.id], function(err, result){
                            if(err) throw err;
                        });
                        return cb(err, false);
                    }
                    console.log(result);
                    if(result){
                        return cb(null, true);
                    }else {
                        connection.query('DELETE FROM user WHERE id=?', [formData.id], function(err, result){
                            if(err) throw err;
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

var findByUsername = function findByUsername(username, cb){
        connection.query('SELECT * FROM user WHERE user_id=?', [username], function(err, result){
                if(err){
                    throw err;
                }

                var user = JSON.parse(JSON.stringify(result))[0];
                // console.log('findByUsername : ' + JSON.parse(JSON.stringify(result))[0]);
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

var comparePasswordByid = function comparePasswordByid(id, password){
    return connection.query('SELECT * FROM password WHERE id=?', [id], function(err, result){
        if(err){
            throw err;
        }

        var ret = JSON.parse(JSON.stringify(result));
        console.log(password);
        if(typeof ret[0] !== 'undefined' && password === ret[0].password){
            // console.log('success');
                return true;
        }else{
            // console.log('fail');
                return false;
        }

    });
//    console.log('#debug\n input username: ' + id);
//    console.log('#debug\n input password: ' + password);
};

var comparePasswordByEmail = function comparePasswordByEmail(email, password){
    return connection.query('SELECT * FROM user WHERE user_email=?', [email], function(err, result){
        if(err){
            throw err;
        }
        // console.log(result);
        var ret = JSON.parse(JSON.stringify(result));
        // console.log(ret[0].user_id);

        if(password === ret[0].password){
                return ret[0];
        }else{
                return null;
        }
    });

};

module.exports = {
    findOne: findOne,
    findPassword : findPassword,
    registrateSocialUser: registrateSocialUser,
    registrateUser : registrateUser,
    findByUsername : findByUsername,
    comparePasswordByid : comparePasswordByid,
    comparePasswordByEmail : comparePasswordByEmail,
    isFormVaildMiddleware : isFormVaildMiddleware
};

