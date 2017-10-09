const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const user = require('./user');
const passwordUtil = require('./password');
var config = require("../config");
const google = require('passport-google-oauth').OAuth2Strategy;
const facebook = require('passport-facebook').Strategy;

passport.serializeUser(function(user, done){
    // console.log('serialize');
    done(null, user);
});

passport.deserializeUser(function(user, done){
    // console.log('deserialize');
    // console.log(userId);
    //user.findByUsername(userId, function(err, profile){
        done(null, user);
    //});
});

passport.use('local-login', new LocalStrategy({
    usernameField : 'id',
    passwordField : 'password',
    session : true,
    passReqToCallback : true
},function(req, id, password, done) {
    // console.log("local-login : " + req.body);
    user.findOne(id, function(err, profile){
        if(profile){
            user.findPassword(id, function(err, retrievedPassword){
                if(err) throw done(err, null);

                console.log(retrievedPassword);
                passwordUtil.passwordCheck (password, retrievedPassword, function(err, isAuth){
                     console.log(isAuth);
                    if(isAuth){
                        // console.log('login success');
                        return done(null, profile);
                    }else{
                        // console.log('login fail');
                        return done(null, false, { message: 'Wrong Password'});
                    }
                });
            });
        }else{
            return done(null, false, { message: 'Wrong Username' });
        }
    });
}));

passport.use(new facebook({
    clientID: config.facebook.appID,
    clientSecret: config.facebook.appSecret,
    callbackURL: config.host + config.port + config.routes.facebookAuthCallback
}, function(accessToken, refreshToken, profile, done){
        console.log(profile);
        user.findOne(profile.id, function(err, one){
            if(one){
                done(null, profile);
            }else {

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
    }, function(accessToken, refreshToken, profile, done){
        console.log(profile);
       user.findOne(profile.id, function(err, one){
            if(one){
                done(null, profile);
          }else{
                user.registrateSocialUser(profile, function(err, result){
                    if(err) throw err;
                    console.log("debug passport social user registration : " + result);
                    done(null, profile);
                });
            }
       });
    })
);

var routes = function(app){
    app.get(config.routes.facebookAuth, passport.authenticate('facebook'));
    app.get(config.routes.facebookAuthCallback, passport.authenticate('facebook',
        {
            successRedirect: '/users/login-success',
            failureRedirect: '/users/login-failure',
            failureFlash: true
        }
    ));

    app.get(config.routes.googleAuth, passport.authenticate('google',
        {
            scope: ['https://www.googleapis.com/auth/userinfo.profile',
            'https://www.googleapis.com/auth/userinfo.email']
        }
    ));
    app.get(config.routes.googleAuthCallback, passport.authenticate('google',
        {
            successRedirect: '/users/login-success',
            failureRedirect: '/users/login-failure',
            failureFlash: true
        }
    ));
};

exports.passport = passport;
exports.routes = routes;
