var connection = require('../database/db');
var verify = require('./verify');
var passwordUtil = require('./password');


var registrateUser = function registrateUser(data, cb){
    findByUsername(data.username, function(err, user){
        if(user){
            console.log('user is exist');
            cb({message : 'error already exist'}, user);
        }else{
            console.log('registrate');
            passwordUtil.passwordCreate(data.password1, function(err, password){
                if(err) throw err;

                var sql = 'INSERT INTO user (user_id, user_email, password) VALUES (?, ?, ?)';
                connection.query(sql, [data.username, data.email, password], function(err, result){
                    if(err) throw err;
                    console.log('#debug registeUser result : ' + result);
                });
            });
            cb(null, true);
        }

    });
         // passwordUtil.passwordCreate(data.password1, function(err, password){
         //     if(err) throw err;
         //
         //     var sql = 'INSERT INTO user (user_id, user_email, password) VALUES (?, ?, ?)';
         //     connection.query(sql, [data.username, data.email, password], function(err, result){
         //             if(err) throw err;
         //             console.log('#debug registeUser result : ' + result);
         //     });
         // });
         // cb(null, true);
};

var findByUsername = function findByUsername(username, cb){
        connection.query('SELECT * FROM user WHERE user_id=?', [username], function(err, result){
                if(err){
                    throw err;
                }

                var user = JSON.parse(JSON.stringify(result))[0];
                console.log('findByUsername : ' + JSON.parse(JSON.stringify(result))[0]);
                cb(null, user);

        });
};

var comparePasswordByUsername = function comparePasswordByUsername(username, password){
    return connection.query('SELECT * FROM user WHERE user_id=?', [username], function(err, result){
        if(err){
            throw err;
        }

        var ret = JSON.parse(JSON.stringify(result));
        //console.log(ret[0].password);
        //console.log(password);

        if(typeof ret[0] !== 'undefined'  && password === ret[0].password){
            console.log('success');
                return ret[0];
        }else{
            console.log('fail');
                return null;
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
        console.log(result);
        var ret = JSON.parse(JSON.stringify(result));
        console.log(ret[0].user_id);

        if(password === ret[0].password){
                return ret[0];
        }else{
                return null;
        }
    });

};

module.exports = {
    registrateUser : registrateUser,
    findByUsername : findByUsername,
    comparePasswordByUsername : comparePasswordByUsername,
    comparePasswordByEmail : comparePasswordByEmail
};
