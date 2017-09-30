const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const user = require('./user');
const passwordUtil = require('./password');

passport.serializeUser(function(user, done){
    console.log('serialize');
    done(null, user.user_id);
});

passport.deserializeUser(function(userId, done){
    console.log('deserialize');
    console.log(userId);
    user.findByUsername(userId, function(err, profile){
        done(null, userId);
    });
});

passport.use('local-login', new LocalStrategy({
    usernameField : 'username',
    passwordField : 'password',
    session : true,
    passReqToCallback : true
},function(req, username, password, done) {
    console.log(req.body);
    user.findByUsername(username, function(err, profile){
        if(profile){
       passwordUtil.passwordCheck (password, profile.password, function(err, isAuth){
           console.log(isAuth);
                if(isAuth){
                    console.log('login success');
                        done(null, profile);
                }else{
                    console.log('login fail');
                        done(null, false, { message: 'Wrong Password'});
                }
            });
        }else{
                done(null, false, { message: 'Wrong Username' });
        }

    });
}));

module.exports = passport;
