var express = require('express');
var router = express.Router();
var controller = require('../controller/footprints');
var auth = require('../auth/auth');

router.post('/create', auth.authMiddleware, controller.createLinkMarker);
router.get('/detail', controller.getLinkMarker);
router.delete('/delete', auth.authMiddleware, controller.deleteLinkMarker);
router.post('/update', auth.authMiddleware, controller.updateLinkMarker);

module.exports = router;