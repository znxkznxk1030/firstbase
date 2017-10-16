const AWS = require('aws-sdk');
const async = require('async');
const bucketName = 'firstbase-bucket';
const path = require('path');
const fs = require('fs');
const formidable = require('formidable');
var guid = require('guid');

AWS.config.loadFromPath('s3config.json');

const s3 = new AWS.S3({ region : 'ap-northeast-2' });

var createMainBucket = function(cb){
    const bucketParams = {
        Bucket : bucketName
    };

    s3.headBucket(bucketParams, function (err, data) {
if(err){
    console.log("ErrorHeadBucket", err);
    s3.createBucket(bucketParams, function(err, data){
        if(err){
            console.log("Error", err);
            throw err;
        }else{
            cb(null, data);
        }
    });
}else{
    cb(null, data);
}
});
};

var createItemObject = function(files, cb){
    console.log(files.image.name);
    var iconKey = guid.raw();

    const params = {
        Bucket: bucketName,
        Key : iconKey,
        ACL : 'public-read',
        Body : fs.createReadStream(files.image.path)
    };

    s3.putObject(params, function (err, data){
        if(err){
            console.log("Error uploading image : ", err);
            throw err;
        }else{
            console.log("Successfully uploaded image on S3", iconKey);
            return cb(null, iconKey);
        }
    });
};

var upload = function(req, res, next){
    var form = new formidable.IncomingForm();
    console.log(guid.raw());

    form.parse(req, function(err, fields, files){
        if(err) res.json({ message : "form error"});

        createItemObject(files, function(err, result){
            if(err) return res.send(err);
            else return res.json({ message : "Successfully uploaded", iconKey:result});
        });


        // async.series([
        //     //createMainBucket,
        //     createItemObject(files)
        // ], function (err, result) {
        //     if(err) return res.send(err);
        //     else return res.json({ message : "Successfully uploaded"});
        // });
    });
};

var retrieve = function(req, res){
    const params = {
        Bucket: bucketName,
        Key : 'friends-fun.jpg'
    };

    var url = s3.getSignedUrl('getObject', params);
    console.log(url);
};

var retrieveIcon = function(req, res){
    var iconKey = req.query.iconKey;

    console.log(iconKey);

    const params = {
        Bucket: bucketName,
        Key : iconKey
    };

    var icon_url = s3.getSignedUrl('getObject', params);

    console.log(icon_url);
    res.json({message:"success", icon_url: icon_url});
};

exports.upload = upload;
exports.retrieve = retrieve;
exports.retrieveIcon = retrieveIcon;
