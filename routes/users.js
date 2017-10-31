var express = require('express');
var router = express.Router();
var passport = require('passport');
var user = require('../passport_auth/user');
var auth = require("../passport_auth/auth");
var controller = require("../controller/users");

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

router.post('/registrate', user.isFormVaildMiddleware,function(req, res, next){
    console.log(req.body);

    if(req.body.password1 === req.body.password2){
        user.registrateUser(req.body, function(err, result){
           if(err) return res.status(401).json({code : -1, message: err});
            else return res.status(401).json({code: -1, message : 'success register'});
        });
    }else{
        return res.status(401).json({code:-1, message: 'Two password fields are not matched!'})
    }

});

router.post('/login', function(req, res, next){
    passport.authenticate('local-login', function(err, user, info){
    var error = err || info;

    if(error)
        return res.status(401)
            .json(error);
    if(!user) return res.status(404)
        .json({code:-2,
            message: 'user not found...'});

    console.log(user);

    var token = auth.signToken(user);
    res.cookie('jwt', token).json({code: 1, message: 'success to login', accessToken: token});

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
    res.clearCookie('jwt')
    res.json({ message : "success to logout"});
});

router.get('/nickname-check', controller.nicknameCheck);

router.get('/profile', auth.authMiddleware, controller.getUserInfoByReqHeader);
router.post('/update', auth.authMiddleware, controller.updateUserInfo);
router.post('/updateImage', auth.authMiddleware, controller.updateUserImage);

router.get('/detail', controller.getUserInfoByUserDisplayName);
router.get('/more', controller.getUserInfoByUserId);

module.exports = router;
