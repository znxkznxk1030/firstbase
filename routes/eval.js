var express = require('express');
var router = express.Router();
var auth = require('../auth/auth');
var controller = require('../controller/eval');

router.post('/', auth.authMiddleware, controller.evalFootprint);

module.exports = router;