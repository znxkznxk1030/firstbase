var express = require('express');
var router = express.Router();
var controller = require('../controller/footprints');
var auth = require('../auth/auth');
var validateMarkerParams = require('../middleware/footprint.validation').validateMarkerParams;

router.post('/create', auth.authMiddleware, validateMarkerParams, controller.createLinkMarker);
router.get('/detail', controller.getLinkMarker);

module.exports = router;