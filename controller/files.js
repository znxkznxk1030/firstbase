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

var getImageUrl = function(key){
    return "https://firstbase-bucket.s3.amazonaws.com/" + key;
};

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
    var imageKey = 'firstbase-image-' + guid.raw();

    const params = {
        Bucket: bucketName,
        Key : imageKey,
        ACL : 'public-read',
        Body : fs.createReadStream(files.image.path)
    };

    s3.putObject(params, function (err, data){
        if(err){
            console.log("Error uploading image : ", err);
            return cb(err, null);
        }else{
            console.log("Successfully uploaded image on S3", imageKey);
            return cb(null, imageKey);
        }
    });
};

var upload = function(req, res){
    var form = new formidable.IncomingForm();
    console.log(guid.raw());

    form.parse(req, function(err, fields, files){
        if(err)
            res.status(400)
                .json({ code: -1,
                    message : "form error"});

        createItemObject(files, function(err, key){
            if(err)
                return res.status(400)
                    .json({code: -1,
                    message:err});
            else
                return res.status(200)
                    .json({ code: 1,
                        message : "Successfully uploaded",
                        imageKey: key});
        });
    });
};

var uploadUserImage = function(req, cb){
    var form = new formidable.IncomingForm();

    form.parse(req,
        function(err, fields, files){
            if(err)
                return cb({ code: -1, message : "form error"}, null);

            createItemObject(files,
                function(err, key){
                    if(err)
                        return cb({code : -1, message: 'sql error'}, null);
                    else
                    {
                        const params = {
                            Bucket: bucketName,
                            Key : key
                        };

                        return cb(null, {key : key, url : s3.getSignedUrl('getObject', params)});
                    }
                });
    });
};

//Not Api Function
var retrieveByKey = function(key){
    const params = {
        Bucket: bucketName,
        Key : key
    };

    return s3.getSignedUrl('getObject', params);
};

var retrieveByKeyCategory = function(key, category){
    const params = {
        Bucket: bucketName,
        Key: category + '/' + key
    };

    return s3.getSignedUrl('getObject', params);
};

var retrieveIcon = function(req, res){
    var iconKey = req.query.iconKey;

    const params = {
        Bucket: bucketName,
        Key : iconKey
    };

    var iconUrl = s3.getSignedUrl('getObject', params);

    //console.log(iconUrl);
    res.status(200)
        .json({code:1,
            message:"success",
             iconUrl: iconUrl});
};

var retrieveIconAllFromDirectory = function(req, res){
    var iconUrls = [];
    //console.log("#debug retrieve All : " + iconKeys.iconKeys);

    iconKeys.iconKeys.forEach(function(iconKey){
        // var params = {
        //     Bucket: bucketName,
        //     Key: iconKey
        // };
        //
        // //console.log("#debug retrieveAll : " + iconKey);
        //
        // var iconUrl = s3.getSignedUrl('getObject', params);
        //
        var iconUrl = "https://firstbase-bucket.s3.amazonaws.com/" + iconKey;

        iconUrls.push({key: iconKey,
                value: iconUrl});
    });

    res.status(200)
        .json({code:1,
            message:"success to load all icon",
            length:iconUrls.length,
            iconUrls: iconUrls});

};

exports.upload = upload;
exports.retrieveByKey = retrieveByKey;
exports.retrieveIcon = retrieveIcon;
exports.retrieveIconAllFromDirectory = retrieveIconAllFromDirectory;
exports.retrieveByKeyCategory = retrieveByKeyCategory;
exports.uploadUserImage = uploadUserImage;
exports.getImageUrl = getImageUrl;
