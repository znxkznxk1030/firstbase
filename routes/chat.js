var express = require('express');
var router = express.Router();
var auth = require('../auth/auth');

router.get('/', function (req, res) {
    res.render('socket', {
        id: 'ddd',
        displayName: 'ddd'
    });
});


router.get('/team', function(req, res){
    res.render('teammap', {
        displayName: req.user.displayName
    });
});

module.exports = router;