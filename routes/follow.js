var express = require('express');
var router = express.Router();
var auth = require('../auth/auth');
var controller = require('../controller/follow');

router.post('/', auth.authMiddleware, controller.follow);
router.get('/followers', controller.getFollowerList);
router.get('/followings', controller.getFollowingList);


module.exports = router;