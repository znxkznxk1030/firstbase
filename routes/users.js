var express = require('express');
var router = express.Router();
var passport = require('passport');
var auth = require("../auth/auth");
var controller = require("../controller/users");

router.use(passport.initialize());
router.use(passport.session());

/* GET users listing. */
router.get('/', auth.authenticate);



router.get('/login-form', function(req, res, next){
        res.render('login');
});

router.get('/signup-form', function(req, res, next) {
    res.render('registration');
});



router.post('/registrate', controller.isFormVaild,function(req, res, next){
    console.log(req.body);

    if(req.body.password1 === req.body.password2){
        controller.registrateUser(req.body, function(err, result){
           if(err) return res.status(401).json({code : -1, message: err});
            else return res.status(200).json({code: 1, message : 'success register'});
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
        .json({code: -2,
            message: 'user not found...'});

    console.log(user);

    var token = auth.signToken(user);
    res.cookie('jwt', token).json({code: 1, message: 'success to login', accessToken: token, displayName: user.displayName});

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
router.post('/update', auth.authMiddleware, controller.isFormVaild, controller.updateUserInfo);
router.post('/updateImage', auth.authMiddleware, controller.updateUserImage);

router.get('/detail', auth.authMiddleware, controller.getUserInfoByUserDisplayName);
router.get('/more', auth.authMiddleware, controller.getUserInfoByUserId);

module.exports = router;
