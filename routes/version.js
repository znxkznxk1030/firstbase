var express = require('express');
var router = express.Router();
const connection = require('../database/db');

/* GET home page. */
router.get('/', function(req, res){
    const version = req.query.version;

    connection.query("SELECT * FROM version",[], function(err, appInfo){
        if(err) return cb('해당 아이디가 없습니다.', null);

        const appVersion = JSON.parse(JSON.stringify(appInfo))[0].version;

        if(appVersion < version){
            return res.json({code: 1, isLastest : true, message:null});
        }else{
            return res.json({code: -1, isLastest: false, message:null});
        }
    });

});

module.exports = router;
