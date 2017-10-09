var express = require('express');
var router = express.Router();
var async = require('async');
var controller = require('../controller/files');

router.post('/upload', controller.upload);

module.exports = router;
