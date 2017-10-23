var express = require('express');
var router = express.Router();
var controller = require('../controller/footprints');
var auth = require('../passport_auth/auth');

router.get('/list',controller.getFootprintList);

router.get('/list/:user_id', controller.getFootprintListByUser);


/**
 * display functions
 */
router.get('/listbylocation/', controller.getFootprintListByLocation);
router.get('/list/:lat/:lng/:level', controller.getFootprintListByCurrentLocationAndViewLevel);

/**
 * footprint CRUD functions
 */
router.post('/create', auth.authMiddleware, controller.createFootprint);
router.get('/detail', auth.passMiddleware, controller.getFootprintByFootprintID);
router.get('/delete', auth.authMiddleware, controller.deleteFootprintByFootprintID);

/**
 * view render functions
 */
router.get('/new', auth.authMiddleware, function(req, res){
    res.render('footprint/new', {
        user : req.user
    });
});

module.exports = router;