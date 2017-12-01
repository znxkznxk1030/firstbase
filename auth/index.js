const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const user = require('../controller/users');
const passwordUtil = require('./password');
var config = require("../config");
const google = require('passport-google-oauth').OAuth2Strategy;
const facebook = require('passport-facebook').Strategy;
const _ = require('underscore');
var async = require("async");
const connection = require('../database/db');
var signToken = require("./auth").signToken;

passport.serializeUser(function (user, done) {
    // console.log('serialize');
    done(null, user);
});

passport.deserializeUser(function (user, done) {
    // console.log('deserialize');
    // console.log(userId);
    //user.findByUsername(userId, function(err, profile){
    done(null, user);
    //});
});

passport.use('local-login', new LocalStrategy({
        usernameField: 'id',
        passwordField: 'password',
        passReqToCallback: true
    },
    function (req, id, password, done) {
        console.log("local-login : " + req.body.deviceToken);

        var deviceToken = '';

        if (typeof req.body.deviceToken !== 'undefined')
            deviceToken = req.body.deviceToken;

        var task = [
            function (cb) {
                var sql = 'SELECT * FROM user WHERE id = ?';
                connection.query(sql, [id], function (err, result) {
                    if (err) {
                        return cb('해당 유저가 존재하지 않습니다.');
                    }

                    var user = JSON.parse(JSON.stringify(result))[0];
                    console.log(user);
                    return cb(null, user);
                });
            },
            function (profile, cb) {
                console.log('#2 : ' + profile);
                connection.query('SELECT * FROM password WHERE id=?', [id], function (err, result) {
                    if (err) return cb('비밀번호가 없습니다.');

                    var ret = JSON.parse(JSON.stringify(result));
                    console.log(ret);
                    if (typeof ret[0] !== 'undefined') {
                        return cb(null, profile, ret[0].password);
                    } else {
                        return cb('패스워드가 틀렸습니다.');
                    }
                });
            },
            function (profile, retrievedPassword, cb) {
                console.log('#3 : ', profile, retrievedPassword);
                passwordUtil.passwordCheck(password, retrievedPassword, function (err, isAuth) {
                    if (isAuth) {
                        return cb(null, profile);
                    } else {
                        return cb('패스워드가 틀렸습니다');
                    }
                });
            },
            function (profile, cb) {
                var sql = 'UPDATE user SET device_token = ? WHERE id = ?';

                connection.query(sql, [deviceToken, id], function (err, result) {
                    if (err || result.length < 1) return cb('토큰생성 실패');
                    else return cb(null, profile);
                });
            }
        ];

        async.waterfall(task, function (err, profile) {
            if (err) return done(null, false, {message: err});
            return done(null, profile);
        });


        // user.findOne(id, function (err, profile) {
        //     if (profile) {
        //         user.findPassword(id, function (err, retrievedPassword) {
        //             if (err) throw done(err, null);
        //
        //             console.log(retrievedPassword);
        //             passwordUtil.passwordCheck(password, retrievedPassword, function (err, isAuth) {
        //                 console.log(isAuth);
        //                 if (isAuth) {
        //                     // console.log('login success');
        //                     return done(null, profile);
        //                 } else {
        //                     // console.log('login fail');
        //                     return done(null, false, {message: '패스워드가 틀렸습니다.'});
        //                 }
        //             });
        //         });
        //     } else {
        //         return done(null, false, {message: '입력한 아이디가 존재하지 않습니다.'});
        //     }
        // });
    }));

passport.use(new facebook({
        clientID: config.facebook.appID,
        clientSecret: config.facebook.appSecret,
        callbackURL: config.host + config.port + config.routes.facebookAuthCallback
    },
    function (accessToken, refreshToken, profile, done) {
        console.log(profile);


        user.findOne(profile.id, function (err, one) {
            if (one) {
                done(null, profile);
            } else {

                user.registrateSocialUser(profile, function (err, result) {
                    if (err) throw err;
                    console.log("debug passport social user registration : " + result);
                    done(null, profile);
                });
            }

        });
    })
);

passport.use(new google({
        clientID: config.google.clientID,
        clientSecret: config.google.clientSecret,
        callbackURL: config.host + config.port + config.routes.googleAuthCallback
    }, function (accessToken, refreshToken, profile, done) {
        console.log(profile);
        user.findOne(profile.id, function (err, one) {
            if (one) {
                done(null, profile);
            } else {
                user.registrateSocialUser(profile, function (err, result) {
                    if (err) throw err;
                    console.log("debug passport social user registration : " + result);
                    done(null, profile);
                });
            }
        });
    })
);

var routes = function (app) {
    app.get(config.routes.facebookAuth, passport.authenticate('facebook'));
    app.get(config.routes.facebookAuthCallback, passport.authenticate('facebook',
        {
        }
    ), function(req, res){
        const token = signToken(req.user);
        res.cookie('jwt', token).json({
            code: 1,
            message: 'success to login',
            accessToken: token,
            displayName: user.displayName
        });

    });

    app.get(config.routes.googleAuth, passport.authenticate('google',
        {
            scope: ['https://www.googleapis.com/auth/userinfo.profile',
                'https://www.googleapis.com/auth/userinfo.email']
        }
    ));

    app.get(config.routes.googleAuthCallback, passport.authenticate('google',
        {
        }
    ), function(req, res){
        //console.log('google social user info : ' + req.user.id + req.user.displayName, req.user.provider);
        const token = signToken(req.user);
        res.cookie('jwt', token).json({
            code: 1,
            message: 'success to login',
            accessToken: token,
            displayName: user.displayName
        });
    });
};

exports.passport = passport;
exports.routes = routes;
