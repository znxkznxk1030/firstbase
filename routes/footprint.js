var express = require('express');
var router = express.Router();
var controller = require('../controller/footprint');
var auth = require('../passport_auth/auth');

router.get('/list',controller.getFootprintList);

router.get('/list/:user_id', controller.getFootprintListByUser);

router.get('/listbylocation/', controller.getFootprintListByLocation);
router.get('/list/:lat/:lng/:level', controller.getFootprintListByCurrentLocationAndViewLevel);

router.get('/detail', auth.passMiddleware, controller.getFootprintByFootprintID);
router.get('/delete/:footprint_id', controller.deleteFootprintByFootprintID);


router.get('/new', auth.authMiddleware, function(req, res){
        res.render('footprint/new', {
            user : req.user
        });
});
router.post('/create', auth.authMiddleware, controller.createFootprint);

module.exports = router;