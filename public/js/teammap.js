var explanation = $('#explanation');

var setPosition = function () {
    console.log('call!');
    explanation.html('find your position...');
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(setMarker);
    } else {
        explanation.html('현재 브라우저는 Geolocation 을 지원하지 않습니다.');
    }
};

$("#set").click(function () {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(setMarker);
        explanation.html('sending....');
    } else {
        explanation.html('현재 브라우져가 Geolocation을 지원하지 않습니다.');
    }
});

$("#refresh").click(setPosition);

var mapOptions = {
    center: new naver.maps.LatLng(37.5040541, 127.0447071),
    zoom: 14
};

var map = new naver.maps.Map('map', mapOptions);
var coords;
var markers = [];
var pingMarker;

var marker = new naver.maps.Marker({
    position: new naver.maps.LatLng(37, 127),
    map: map
});

function setMarker(position) {
    console.log(position);

    coords = position.coords;

    console.log(coords);
    mapOptions.center = new naver.maps.LatLng(coords.latitude, coords.longitude);
    mapOptions.zoom = 15;
    mapOptions.typeControl = true;

    map.setOptions(mapOptions);
    explanation.html('load complete!');
}

var getPosition = function (cb) {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (position) {
            return cb(null, {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            });
        });
    } else {
        return cb('err');
    }
};

$(function () {
    var socket = io();

    var sendPosition = function () {
        explanation.html('Sending My Position....');

        getPosition(function (err, coord) {

            var position = {
                teamId: 1,
                displayName: '<%= displayName %>'
            };

            if (err) position.coord = err;
            else {
                position.coord = {
                    lat: coord.lat,
                    lng: coord.lng
                };
            }

            // console.log(coord);

            socket.emit('send position', position);
            explanation.html('send complete!');
        });
    };

    map.addListener('click', function(e){

        // console.log(e.coord.y, e.coord.x);

        socket.emit('emit ping', {
            lat: e.coord.y,
            lng: e.coord.x,
            time: Date.now()
        });
    });

    socket.on('get ping', function(data){
        // console.log(data);
        if(pingMarker){
            pingMarker.onRemove();
        }

        pingMarker = new naver.maps.Marker({
            position: new naver.maps.LatLng(data.lat, data.lng),
            map: map
        });

        map.panTo(new naver.maps.LatLng(data.lat, data.lng));

        naver.maps.Service.reverseGeocode({
            location: new naver.maps.LatLng(data.lat, data.lng),
        }, function(status, response) {
            if (status !== naver.maps.Service.Status.OK) {
                return alert('Something wrong!');
            }

            var result = response.result, // 검색 결과의 컨테이너
                items = result.items; // 검색 결과의 배열

            $('#notification-ping').html('<PING>' + items[0].address);


            // do Something
        });

    });

    //socket.emit('join to team-map', {
    //    displayName: 'User'
    //});

    $("#send").click(sendPosition);

    $("#get").click(function () {
        explanation.html('Sync all members...');
        socket.emit('get position');
    });

    socket.on('show', function (pos) {

        markers.forEach(function (marker) {
            marker.onRemove();
        });
        markers = [];

        pos.forEach(function (p) {
            markers.push(new naver.maps.Marker({
                position: new naver.maps.LatLng(p.lat, p.lng),
                map: map
            }));
        });

        explanation.html('Sync Complete!');

    });

    socket.emit('login', {
        id: 'test',
        displayName: 'test'
    });

    socket.on('load old msgs', function (docs) {
        console.log(docs);
        docs.forEach(function (doc) {
            $('#chatLogs').append("<div><h3>" + doc.displayName + " : <strong>" + doc.msg + "</strong>(" + doc.time + ")</h3></div>");
        });
        $('#chatLogs').animate({ scrollTop : $('#chatLogs')[0].scrollHeight});
    });

    socket.on('login', function (data) {
        $('#chatLogs').append('<div><h3>' + data + '님이 왔어요~!</h3></div>');
        $('#chatLogs').animate({ scrollTop : $('#chatLogs')[0].scrollHeight});
    });

    socket.on('chat', function (data) {
        console.log(data);
        $('#chatLogs').append("<div><h3>" + data.displayName + " : <strong>" + data.msg + "</strong>(" + data.time + ")</h3></div>");
        $('#chatLogs').animate({ scrollTop : $('#chatLogs')[0].scrollHeight});
    });

    $("form").submit(function (e) {
        e.preventDefault();

        var $msgForm = $('#msgForm');

        socket.emit('chat', {msg: $msgForm.val()});
        $msgForm.val("");
    });
});