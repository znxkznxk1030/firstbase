var express = require('express');
var router = express.Router();
var viewControl = require('../controller/views');

/* GET home page. */
router.get('/', viewControl.getViewCountByFootprintId);
router.get('/testView', viewControl.testMakeViewCount);

module.exports = router;
