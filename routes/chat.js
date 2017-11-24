var express = require('express');
var router = express.Router();
var auth = require('../auth/auth');

router.get('/', auth.passMiddleware, function (req, res) {
    var displayName = '비회원';

    if(req.user){
        displayName = req.user.displayName;
    }

    res.render('socket', {
        id: 'nope',
        displayName: displayName
    });
});


router.get('/team', auth.authMiddleware, function(req, res){
    res.render('teammap', {
        displayName: req.user.displayName
    });
});

module.exports = router;