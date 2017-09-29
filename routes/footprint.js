var express = require('express');
var router = express.Router();
var controller = require('../controller/footprint');

router.get('/list', function(req, res, next){
    console.log('render footprint');
    controller.getFootprintList(function(err, footprintListJson){
        console.log("#debug footprint list", footprintListJson);
        res.json(footprintListJson);
    });
});

router.get('/list/:user_id', function(req, res){
    console.log('render detail');
    console.log(req.params.user_id);

    controller.getFootprintListByUser(req.params.user_id, function(err, result){
        res.json(result);
    });
});

router.get('/detail/:footprint_id', function(req, res){
    console.log(req.params.footprint_id);

    controller.getFootprintByFootprintID(req.params.footprint_id, function(err, result){
        res.json(result);
    });

});

router.get('/new', function(req, res){
    console.log('render new');
    res.render('footprint/new');
});

router.post('/create', function(req, res, next){
    console.log('render create');
    console.log(req.body);
    controller.createFootprint(req.body, function(err, result){
        if (err){
            throw err;
        }
    })
});


module.exports = router;