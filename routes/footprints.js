var express = require('express');
var router = express.Router();
var controller = require('../controller/footprints');
var auth = require('../auth/auth');
var validateMarkerParams = require('../middleware/footprint.validation').validateMarkerParams;

router.get('/list', controller.getFootprintList);

router.get('/history', auth.findOneMiddleware, controller.getFootprintListByDisplayName);


/**
 * display functions
 */
router.get('/listbylocation/', controller.getFootprintListByLocation);
router.get('/list/:lat/:lng/:level', controller.getFootprintListByCurrentLocationAndViewLevel);

/**
 * footprint CRUD functions
 */
router.post('/create', auth.passMiddleware, validateMarkerParams, controller.createFootprint);
router.get('/detail', auth.passMiddleware, controller.getFootprintByFootprintID);
router.post('/delete', auth.authMiddleware, controller.deleteFootprintByFootprintID);

/**
 * view render functions
 */
router.get('/new', auth.authMiddleware, function (req, res) {
    res.render('footprint/new', {
        user: req.user
    });
});

router.get('/modal_detail', function(req, res){
    res.render('testdetailview');
});

module.exports = router;