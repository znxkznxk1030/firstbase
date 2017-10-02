var express = require('express');
var router = express.Router();
var passport = require('passport');
var user = require('../passport_auth/user');

router.use(passport.initialize());
router.use(passport.session());

/* GET users listing. */
router.get('/', function(req, res, next){

});

router.get('/login-form', function(req, res, next){
        res.render('login');
});

router.get('/signup-form', function(req, res, next) {
    res.render('registration');
});

router.post('/registrate', function(req, res, next){
   // console.log(req.body);
   // user.findByUsername(req.body.username, function(err, isExist){
   //      if(isExist === undefined){
   //          user.registrateUser(req.body, function(err, result){
   //              console.log('isIn?');
   //              res.redirect('../');
   //          });
   //      }
   //      else{
   //          res.redirect('/users/signup-form');
   //      }
   // });

    console.log(req.body);

    user.registrateUser(req.body, function(err, result){
        console.log('isIn?');
        res.json({message : 'success register'});
    });

});

router.post('/login', passport.authenticate('local-login',
            {
                successRedirect : '/users/login-success',
                failureRedirect : '/users/login-failure',
                //failureFlash : true
                failWithError : true
            }),function(req, res){
        //res.json({ message : 'success to login'})
    }, function(err, req, res, next){
        //res.json({ message : 'failure to login'})
    }
        );

router.get('/login-failure', function(req, res){
    console.log('failure');
    res.json({ message : "failure to login"});
});

router.get('/login-success', function(req, res){
    console.log('success');
    res.json({ message : "success to login"});
});

router.get('/logout', function(req, res){
    req.session().destroy();
    res.clearCookie('sid');
    res.json({ message : "success to logout"});
});

module.exports = router;
