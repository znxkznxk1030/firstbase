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
        userPassword1 = req.body.password1,
        userPassword2 = req.body.password2;

    console.log(userId + userPassword1 + userPassword2);

    const sqlIsExisted =
        "SELECT * FROM user WHERE id = ?";

    const task = [
        /*
            Check ID is valid.

            1. Check id form is not blank.
            2. Check length of id is between 8 and 20.
            3. Check id has a valid email domain.
            4. Check id is unique.
         */
        function(cb){

            if(userId.isNullOrUndefined)
                return cb('id form should be not blank', null);

            const length = userId.length;
            const userIdSplitByDomain = userId.split('@');
            const ACCEPTED_DOMAIN = [
                'naver.com',
                'gmail.com',
                'daum.net'
            ];

            if(length < 8)
                return cb('The length of ID is too short', null);
            if(length > 25)
                return cb('The length of ID is too long', null);

            console.log(userIdSplitByDomain);

            if(userIdSplitByDomain.length !== 2)
                return cb('Id should be email form', null);

            const domain = userIdSplitByDomain[1];
            var hasAccptedDomain = false;

            ACCEPTED_DOMAIN.forEach(function(accptedDomain){
                if(accptedDomain === domain)
                    hasAccptedDomain = true;
            });

            if(!hasAccptedDomain)
                return cb('please use accepted domain', null);

            connection.query(sqlIsExisted, [userId],
                function(err, user)
                {
                    if(err)
                        return cb(err, null);
                    console.log(user);
                    if(user[0])
                        return cb('already existed', null);

                    else return cb(null);
                });
        },
        /*
            Password Safety Term.
            1. Check two password is same
            2. Check password' length is between 8 and 20

         */
        function(cb){
            if(userPassword1 !== userPassword2)
                return cb('two passwords are not same', null);

            const length = userPassword1.length;
                console.log(length);

            if(length < 8)
                return cb('The length of password is too short', null);

            if(length > 20)
                return cb('The length of password is too long', null);

            var numOfDigit = 0,
                numOfSpecial = 0,
                numOfChar = 0,
                unVaildChar = false;

            for(var i = 0; i < userPassword1.length; i++)
            {
                var code = userPassword1.charCodeAt(i);

                if(33 <= code && code <= 47)
                    numOfSpecial++;
                else if(48 <= code && code <= 57)
                    numOfDigit++;
                else if(65 <= code && code <= 122)
                    numOfChar++;
                else unVaildChar = true;
            }

            console.log(numOfSpecial);
            console.log(numOfChar);
            console.log(numOfDigit);

            if(unVaildChar)
                return cb('only can use char from our term below', null);

            if(numOfDigit < 3)
                return cb('The number of digit should be more than 3', null);

            if(numOfSpecial < 3)
                return cb('The number of special char should be more than 3', null);

            if(numOfChar < 3)
                return cb('The number of char should be more than 3', null);


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

