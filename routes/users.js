var express = require('express');
var router = express.Router();
var passport = require('passport');
var user = require('../passport/user');

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

router.post('/verify', function(req, res, next){
   console.log(req.body); 
   user.findByUsername(req.body.username, function(err, isExist){
        if(isExist === undefined){
            user.registrateUser(req.body, function(err, result){
                console.log('isIn?');
                res.redirect('../');        
            });
        }
        else{
            res.redirect('/users/signup-form');
        }
   });
});

router.post('/login', passport.authenticate('local-login',
            {
                successRedirect : '/',
                failureRedirect : '/users/login-form',
                //failureFlash : true
            })
        ); 

module.exports = router;
