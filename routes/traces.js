var express = require('express');
var router = express.Router();
var controller = require('../controller/footprints');
var auth = require('../passport_auth/auth');

/**
 * subFootprint CRUD functions
 */
router.get('/', controller.getSubFootprintByFootprintID);
router.post('/create', auth.authMiddleware, controller.createSubFootprint);

module.exports = router;