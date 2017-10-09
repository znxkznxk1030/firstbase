const AWS = require('aws-sdk');
const async = require('async');
const bucketName = 'firstbase-bucket';
const path = require('path');
const fs = require('fs');
const formidable = require('formidable');

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
    const params = {
        Bucket: bucketName,
        Key : files.image.name,
        ACL : 'public-read',
        Body : fs.createReadStream(files.image.path)
    };

    s3.putObject(params, function (err, data){
        if(err){
            console.log("Error uploading image : ", err);
            throw err;
        }else{
            console.log("Successfully uploaded image on S3", data);
            cb(null, data);
        }
    });
};

var upload = function(req, res, next){
    var form = new formidable.IncomingForm();
    form.parse(req, function(err, fields, files){
        if(err) res.json({ message : "form error"});

        createItemObject(files, function(err, result){
            if(err) return res.send(err);
            else return res.json({ message : "Successfully uploaded", data:result});
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

exports.upload = upload;
exports.retrieve = retrieve;
