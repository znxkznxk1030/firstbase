var express = require('express');
var router = express.Router();
var passport = require('passport');
var user = require('../passport_auth/user');
var auth = require("../passport_auth/auth");
var nicknameCheck = require("../controller/users").nicknameCheck;

router.use(passport.initialize());
router.use(passport.session());

/* GET users listing. */
router.get('/', auth.testAuthenticated);

router.get('/login-form', function(req, res, next){
        res.render('login');
});

router.get('/signup-form', function(req, res, next) {
    res.render('registration');
});

router.post('/registrate', function(req, res, next){
    console.log(req.body);
    //todo password poilcy
    if(!req.body.password1 && req.body.password1 === req.body.password2){
        user.registrateUser(req.body, function(err, result){
           if(err) res.json(err);
            else res.json({message : 'success register'});
        });
    }else{
        res.json({message: 'Two password fields are not matched!'})
    }

});

router.post('/login', function(req, res, next){
    passport.authenticate('local-login', function(err, user, info){
    var error = err || info;
    if(error) return res.json(401, error);
    if(!user) return res.json(404, {message: 'user not found...'});
    console.log(user);

    var token = auth.signToken(user);
    res.cookie('jwt', token).json({message: 'success to login', accessToken: token});

    })(req, res, next);
});

router.get('/login-failure', function(req, res){
    console.log('failure');
    res.json({ message : "failure to login"});
});

router.get('/login-success', function(req, res){
    console.log('success');
    res.json({ message : "success to login"});
});

router.get('/logout', function(req, res){
    req.logout();
    res.clearCookie('sid');
    res.json({ message : "success to logout"});
});

router.get('/nickname-check', nicknameCheck);

module.exports = router;
