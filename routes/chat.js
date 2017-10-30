var express = require('express');
var router = express.Router();
var auth = require('../passport_auth/auth');

router.get('/', auth.authMiddleware, function(req, res){
    res.render('socket', {
        id : req.user.id,
        displayName : req.user.displayName
    });
});

module.exports = router;