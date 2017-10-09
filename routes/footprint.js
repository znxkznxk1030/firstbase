var express = require('express');
var router = express.Router();
var controller = require('../controller/footprint');

router.get('/list', function(req, res, next){
    // console.log('render footprint');
    controller.getFootprintList(function(err, footprintListJson){
        // console.log("#debug footprint list", footprintListJson);
        res.json(footprintListJson);
    });
});

router.get('/list/:user_id', function(req, res){
    // console.log('render detail');
    // console.log(req.params.user_id);

    controller.getFootprintListByUser(req.params.user_id, function(err, result){
        res.json(result);
    });
});

router.get('/listbylocation/', function(req, res, next){
    // console.log("listbylocation");
    // console.log(req.query.startlng);
    controller.getFootprintListByLocation(req.query, function(err, result){
        if (err) {
            throw err;
        }

        res.json(result);
    })

});

router.get('/list/:lat/:lng/:level', function(req, res, next){
   // console.log("list");
   // console.log(req.params);
   controller.getFootprintListByCurrentLocationAndViewLevel(req.query, function(err, result){
      if(err){
          throw err;
      }
      res.json(result);
   });
});

router.get('/detail/:footprint_id', function(req, res){
    // console.log(req.params.footprint_id);

    controller.getFootprintByFootprintID(req.params.footprint_id, function(err, result){
        res.json(result);
    });

});

router.get('/new', function(req, res){
    console.log(req.body);
    console.log(req.isAuthenticated(), req.user);
    if(req.isAuthenticated() === true) {
        res.render('footprint/new', {
            user : req.user
        });
    }
    else res.json({message: 'not authenticated!'});
});

router.post('/create', function(req, res, next){
    // console.log('render create');
    console.log(req.body, req.isAuthenticated(), req.user);
    if(req.isAuthenticated() !== true){
        res.json({message: 'fail to create'});
    }else {
        controller.createFootprint(req.body, function (err, result) {
            if (err) {
                throw err;
            }
            console.log(result);
            if(result)
                res.json({message: 'success create footprint'});
            else res.json({message:'fail to create'});
        });
    }
});

router.get('/delete/:footprint_id', function(req, res, next){
    // console.log(req.params.footprint_id);
    controller.deleteFootprintByFootprintID(req.params.footprint_id, function(err, result){
        if (err){
            throw err;
        }
    });
});

module.exports = router;