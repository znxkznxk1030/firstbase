var connection = require('../database/db');
var verify = require('./verify');
var passwordUtil = require('./password');


var registrateSocialUser = function registrateSocialLoginUser(data, cb){
    var sql = 'INSERT INTO user (id, displayName, provider) VALUES (?, ?, ?)';
    connection.query(sql, [data.id, data.displayName, data.provider], function(err, result){
       if(err) throw err;
        console.log('#debug registrateSocialUser result : ' + result);
       cb(null, true);
    });
};

var registrateUser = function registrateUser(data, cb){
    // todo: refactoring
    // callback hell -> async heaven
    findOne(data.id, function(err, user){
        if(user){
             console.log('user is exist');
            cb({message : 'error already exist'}, user);
        }else{
            passwordUtil.passwordCreate(data.password1, function(err, password){
                if(err) throw err;

                var sql = 'INSERT INTO user (id, displayName, provider) VALUES (?, ?, ?)';
                connection.query(sql, [data.id, data.displayName, 'Local'], function(err, result){
                    if(err) throw err;

                    connection.query('INSERT INTO password (id, password) VALUES(?,?)', [data.id, password], function(err, result){
                        if(err) {
                            connection.query('DELETE FROM user WHERE id=?', [data.id], function(err, result){
                                if(err) throw err;
                            });
                            return cb(err, false);
                        }
                        console.log(result);
                        if(result){
                            return cb(null, true);
                        }else {
                            connection.query('DELETE FROM user WHERE id=?', [data.id], function(err, result){
                                if(err) throw err;
                            });
                        }
                    });
                });
            });
        }

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
    comparePasswordByEmail : comparePasswordByEmail
};
