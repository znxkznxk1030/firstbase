const AWS = require('aws-sdk');
const async = require('async');
const bucketName = 'firstbase-bucket';
const path = require('path');
const fs = require('fs');
const formidable = require('formidable');
var guid = require('guid');
const iconKeys = require('./iconKey.json');

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

var upload = function(req, res){
    var form = new formidable.IncomingForm();
    console.log(guid.raw());

    form.parse(req, function(err, fields, files){
        if(err) res.json({ message : "form error"});

        createItemObject(files, function(err, result){
            if(err) return res.send(err);
            else return res.json({ message : "Successfully uploaded", imageKey:result});
        });
    });
};

var retrieve = function(req, res){
    const params = {
        Bucket: bucketName,
        Key : 'mushroom_super.png'
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

    var iconUrl = s3.getSignedUrl('getObject', params);

    console.log(iconUrl);
    res.json({code:1, message:"success", iconUrl: iconUrl});
};

var retrieveIconAllFromDirectory = function(req, res){
    var iconUrls = [];
    console.log("#debug retrieve All : " + iconKeys.iconKeys);
    iconKeys.iconKeys.forEach(function(iconKey){
        var params = {
            Bucket: bucketName,
            Key: iconKey
        };

        console.log("#debug retrieveAll : " + iconKey);
        var iconUrl = s3.getSignedUrl('getObject', params);
        iconUrls.push({key: iconKey, value: iconUrl});
    });

    res.json({code:1, message:"success to load all icon", length:iconUrls.length, iconUrls: iconUrls});

};


exports.upload = upload;
exports.retrieve = retrieve;
exports.retrieveIcon = retrieveIcon;
exports.retrieveIconAllFromDirectory = retrieveIconAllFromDirectory;
