var express = require('express');
var router = express.Router();
var async = require('async');
var controller = require('../controller/files');

router.post('/upload', controller.upload);

router.get('/retrieveIcon', controller.retrieveIcon);
router.get('/retrieveIconAll', controller.retrieveIconAllFromDirectory);

module.exports = router;

