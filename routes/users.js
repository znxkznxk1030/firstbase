var express = require('express');
var router = express.Router();
var passport = require('passport');
var auth = require("../auth/auth");
var controller = require("../controller/users");
var async = require("async");
var Footprint = require("../database/footprints").Footprint;
var User = require("../database/user").User;
var _ = require('underscore');

router.use(passport.initialize());
router.use(passport.session());

router.get('/', auth.authenticate);


router.get('/login-form', function (req, res, next) {
    res.render('login');
});

router.get('/signup-form', function (req, res, next) {
    res.render('registration');
});

router.post('/registrate', controller.isFormVaild, controller.registrateUser);

router.post('/login', function (req, res, next) {
    passport.authenticate('local-login', function (err, user, info) {
        var error = err || info;

        if (error)
            return res.status(401)
                .json(error);
        if (!user) return res.status(404)
            .json({
                code: -2,
                message: 'user not found...'
            });

        console.log(user);

        var token = auth.signToken(user);
        res.cookie('jwt', token).json({
            code: 1,
            message: 'success to login',
            accessToken: token,
            displayName: user.displayName
        });

    })(req, res, next);
});

router.get('/login-failure', function (req, res) {
    console.log('failure');
    res.json({message: "failure to login"});
});

router.get('/login-success', function (req, res) {
    console.log('success');
    res.json({message: "success to login"});
});

router.get('/logout', function (req, res) {
    req.logout();
    res.clearCookie('jwt')
    res.json({message: "success to logout"});
});

router.get('/nickname-check', controller.nicknameCheck);

router.get('/profile', auth.authMiddleware, controller.getUserInfoByReqHeader);
router.post('/update', auth.authMiddleware,controller.isUpdateFormVaild, controller.updateUserInfo);
router.post('/updateImage', auth.authMiddleware, controller.updateUserImage);

router.get('/detail', auth.authMiddleware, controller.getUserInfoByUserDisplayName);
router.get('/more', auth.authMiddleware, controller.getUserInfoByUserId);

router.get('/web/detail',auth.authMiddleware, function (req, res){
    const user = req.user,
        displayName = req.query.displayName;

    var task = [
        function(cb){
            User({
                user: user,
                displayName: displayName
            }).getUserInfoByUserDisplayName(function (err, result) {
                if(err) return cb(true);
                else{
                    return cb(null, result);
                }
            });
        },
        function(profile, cb){
            Footprint({
                user: profile
            }).getFootprintListByDisplayName(function (err, result) {
                if (err) return cb(true);
                else {
                    return cb(null, _.extend(profile, { history : result }));
                }
            });
        }
    ];

    async.waterfall(task, function(err, result){
        if (err) return res.render('error.ejs');
        else {
            return res.render('user/profile.ejs', {
                displayName : result.displayName,
                profileUrl : result.profileUrl,
                isFollow : result.isFollow,
                description : result.description,
                countFollower : result.countFollower,
                countFollowing : result.countFollowing,
                history: result.history,
                profileUrl: result.profileUrl
            });
        }
    })
});

module.exports = router;
