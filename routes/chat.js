var express = require('express');
var router = express.Router();
var auth = require('../auth/auth');

router.get('/', auth.passMiddleware, function (req, res) {
    res.render('socket', {
        id: 'nope',
        displayName: req.user.displayName
    });
});


router.get('/team', auth.authMiddleware, function(req, res){
    res.render('teammap', {
        displayName: req.user.displayName
    });
});

module.exports = router;