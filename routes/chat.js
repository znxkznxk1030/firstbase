var express = require('express');
var router = express.Router();
var auth = require('../auth/auth');

router.get('/', function(req, res){
    res.render('socket', {
        id : 'ddd',
        displayName : 'ddd'
    });
});

module.exports = router;