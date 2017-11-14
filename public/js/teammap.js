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

console.log(displayName, profileUrl);

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
var siteMarkers = [];
var pingMarker;

const pingImgUrl = 'http://d2w40mi5mo8vk7.cloudfront.net/thinking-man.png';
const foodImgUrl = 'http://d2w40mi5mo8vk7.cloudfront.net/foodpin.png';

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
                displayName: displayName
            };

            if (err) position.coord = err;
            else {
                position.coord = {
                    lat: coord.lat,
                    lng: coord.lng
                };
            }

            socket.emit('send position', position);
            explanation.html('send complete!');
        });
    };

    map.addListener('click', function (e) {

        // console.log(e.coord.y, e.coord.x);

        //console.log(tm128);

        naver.maps.Service.reverseGeocode({
            location: new naver.maps.LatLng(e.coord.y, e.coord.x),
        }, function (status, response) {
            if (status !== naver.maps.Service.Status.OK) {
                return alert('Something wrong!');
            }

            var result = response.result, // 검색 결과의 컨테이너
                items = result.items; // 검색 결과의 배열

            var tm128 = naver.maps.TransCoord.fromLatLngToTM128(e.coord);

            socket.emit('emit ping', {
                lat: e.coord.y,
                lng: e.coord.x,
                tm128: tm128,
                detail: items[0],
                time: Date.now()
            });

        });
    });

    socket.on('get ping', function (data) {
        //console.log(data);
        if (pingMarker) {
            pingMarker.onRemove();
        }

        pingMarker = new naver.maps.Marker({
            position: new naver.maps.LatLng(data.lat, data.lng),
            icon: {
                url: pingImgUrl,
                size: new naver.maps.Size(60, 60),
                scaledSize: new naver.maps.Size(60, 60),
                origin: new naver.maps.Point(0, 0),
                anchor: new naver.maps.Point(30, 30)
            },
            map: map
        });

        siteMarkers.forEach(function (marker) {
            marker.onRemove();
        });

        var sites = data.sites;

        //console.log(data);

        //JSON.parse(sites);

        makePage(data);

        for (var i = 0; i < data.total; i++) {
            siteMarkers.push(new naver.maps.Marker({
                position: new naver.maps.LatLng(sites[i].y, sites[i].x),
                icon: {
                    url: foodImgUrl,
                    size: new naver.maps.Size(30, 30),
                    scaledSize: new naver.maps.Size(30, 30),
                    origin: new naver.maps.Point(0, 0),
                    anchor: new naver.maps.Point(15, 15)
                },
                map: map
            }));
        }

        map.panTo(new naver.maps.LatLng(data.lat, data.lng));
        $('#notification-ping').html(data.detail.address);

    });

    socket.emit('join to team-map', {
        displayName: displayName
    });

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

    getProfile(function (data) {
        displayName = data.displayName;
        profileUrl = data.profileUrl;
        console.log(displayName, profileUrl);

        socket.emit('login', {
            displayName: displayName
        });
    });

    socket.on('load old msgs', function (docs) {
        console.log(docs);
        docs.forEach(function (doc) {
            $('#chatLogs').append("<div><h3>" + doc.displayName + " : <strong>" + doc.msg + "</strong></h3>" + doc.date + "</div>");
        });
        $('#chatLogs').animate({scrollTop: $('#chatLogs')[0].scrollHeight});
    });

    socket.on('login', function (data) {
        $('#chatLogs').append('<div><h3>' + data + '님이 왔어요~!</h3></div>');
        $('#chatLogs').animate({scrollTop: $('#chatLogs')[0].scrollHeight});
    });

    socket.on('chat', function (data) {
        console.log(data);
        $('#chatLogs').append("<div><h3>" + data.displayName + " : <strong>" + data.msg + "</strong></h3>" + data.date + "</div>");
        $('#chatLogs').animate({scrollTop: $('#chatLogs')[0].scrollHeight});
    });

    $("form").submit(function (e) {
        e.preventDefault();

        var $msgForm = $('#msgForm');

        console.log($msgForm);

        var $msgForm = $('#msgForm');
        var msg = $msgForm.val();


        msg = msg.replace('script', '고마해라 마이묵었다');
        msg = msg.replace('<', ' ');
        msg = msg.replace('>', ' ');
        msg = msg.replace('{', ' ');
        msg = msg.replace('}', ' ');
        msg = msg.replace('$', ' ');
        msg = msg.replace('null', '널');

        socket.emit('chat', {
            msg: msg,
            displayName: displayName
        });
        $msgForm.val("");
    });
});

/* Set the width of the side navigation to 250px and the left margin of the page content to 250px and add a black background color to body */
function openNav() {
    var windowWidth = $(window).width();
    console.log(windowWidth);
    if (windowWidth < 1000) {
        document.getElementById("mySidenav").style.width = "100%";
    } else {
        document.getElementById("mySidenav").style.width = "400px";
        document.getElementById("main").style.paddingLeft = "400px";
    }
}

/* Set the width of the side navigation to 0 and the left margin of the page content to 0, and the background color of body to white */
function closeNav() {
    document.getElementById("mySidenav").style.width = "0";
    document.getElementById("main").style.paddingLeft = "0";
}

function makePage(data) {
    console.log(data);

    $('#contents').html("");
    $('#content-wrapper').html("");

    var $list = $('<div id="content-wrapper"></div>').appendTo($('#contents'));

    var sites = data.sites;
    var fnAppendPage = function (start) {
        $('#content-wrapper').html("");
        var end = data.total;

        <!-- 게시판 -->
        var $board = $('<div id="board"></div>').appendTo($list);
        $('<div id="board-title">식당 이름</div>').appendTo($board);
        $('<div id="board-author">거리</div>').appendTo($board);


        for (var i = start; i < end; i++) {
            var o = sites[i];
            var $content = $('<div class="content list-group-item list-group-item-action"></div>').data('data', o).appendTo($list).click(function () {
                popUp($(this).data('data'));
                $("#popUp").data("save", o.id);
            });
            $content_img = $('<div class="content-img"></div>').appendTo($content);
            $('<div class="content-title"></div>').text(o.name).appendTo($content);
            $('<div class="content-dist"></div>').text(parseInt(o.dist * 100000) + 'm').appendTo($content);
        }
    };

    fnAppendPage(0);
}