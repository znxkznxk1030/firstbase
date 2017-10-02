var distanceToLatitude = function(distance, cb){
    console.log(distance/111);
    cb(null, parseFloat(distance/111*10));
};

var distanceToLongitude = function(distance, cb){
    console.log(distance/880*100);
    cb(null, parseFloat(distance/880*100));
};

var getDistanceByViewLevel = function(level, cb){
    console.log(level);

    var distance = 0.0125;

    for(var i = 1; i < level; i++){
        distance *= 2;
    }

    console.log(distance);
    cb(null, parseFloat(distance));
};

module.exports = {
    distanceToLatitude: distanceToLatitude,
    distanceToLongitude: distanceToLongitude,
    getDistanceByViewLevel: getDistanceByViewLevel
};