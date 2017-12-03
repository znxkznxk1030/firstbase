var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('intro', { title: 'FirstBase' });
});

router.get('/index', function(req, res, next) {
    res.render('index');
});

router.get('/post', function(req, res){
    res.render('post');
});

router.get('/post/ajax', function(req, res){
    res.render('detail');
});

router.get('/test', function(req, res){
  res.render('teststepview');
});

router.get('/404', function(req, res){
    res.render('error');
});





module.exports = router;
