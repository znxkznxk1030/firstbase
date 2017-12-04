var baseUrl = "http://ec2-13-124-219-114.ap-northeast-2.compute.amazonaws.com:8080";
var localUrl = "http://localhost:8080";
//지도 생성시에 옵션을 지정할 수 있습니다.
var map = new naver.maps.Map('profile-map', {
    center: new naver.maps.LatLng(37.504479, 127.048941), //지도의 초기 중심 좌표
    zoom: 10, //지도의 초기 줌 레벨
    minZoom: 2, //지도의 최소 줌 레벨 //축소
    maxZoom: 14, //확대
    zoomControl: true, //줌 컨트롤의 표시 여부
    zoomControlOptions: { //줌 컨트롤의 옵션
        style: naver.maps.ZoomControlStyle.SMALL, // 바가 아니라 확대 축소로.
        position: naver.maps.Position.RIGHT_CENTER
    },
    logoControl: false, //네이버 로고 삭제
    scaleControl: false, //거리 단위 표시 삭제
    mapDataControl: false //네이버 Corp. 삭제
});

map.setOptions("minZoom", 2);

var markers = [];
var allIcon = {};
var linkArrays = [];

var htmlUserInfo = function(profile){
    var content = '';

    content += '<li id=\'modal-li\'> <div>';
    content += '<a href=\'?displayName=' + profile.displayName + '\'>' +
        '                <img src=\'' + profile.profileUrl + '\'' +
        '                     alt=\"http://d2w40mi5mo8vk7.cloudfront.net/profile-default.png\"\n' +
        '                     class=\"img-thumbnail\"\n' +
        '                     id=\"icon-image\"\n' +
        '                     style=\"margin:15px;\"\n' +
        '                >' +
        '           ';
    content += '<h4 id=\'modal-displayName\'>' + profile.displayName + '</h4>';
    content += '</a> </div></li>';

    return content;
};

var htmlFoorprintInfo = function(footprint){
    var content = '';

    content += '<li id=\'modal-li\'> <div>';
    content += '<a href=../../post?footprintId=' + footprint.footprint_id + '\'>' +
        '                <img src=\'http://d2w40mi5mo8vk7.cloudfront.net/' + footprint.iconUrl + '\'' +
        '                     alt=\"http://d2w40mi5mo8vk7.cloudfront.net/profile-default.png\"\n' +
        '                     class=\"img-thumbnail\"\n' +
        '                     id=\"icon-image\"\n' +
        '                     style=\"margin:15px;\"\n' +
        '                >' +
        '           ';
    content += '<h4 id=\'modal-displayName\'>' + footprint.title + '</h4>';
    content += '</a> </div></li>';

    return content;
};

$(document).ready(function () {
    var param = window.location.href.split('displayName=')[1];

    $('#btn-follower').click(function(){
        $.ajax({
            type: 'GET',
            data: "displayName=" + param,
            url: baseUrl + '/follow/followers',
            success: function (data) {
                console.log(data);
                const followers = data.followers;
                $('#modal-list').html('');
                $('.modal-title').text('팔로워 리스트');
                followers.forEach(function(profile){
                    $('#modal-list').append(htmlUserInfo(profile));
                });
            }
        });
    });

    $('#btn-following').click(function(){
        $.ajax({
            type: 'GET',
            data: "displayName=" + param,
            url: baseUrl + '/follow/followings',
            success: function (data) {
                console.log(data);
                const followings = data.followings;
                $('#modal-list').html('');
                $('.modal-title').text('팔로우 리스트');
                followings.forEach(function(profile){
                    $('#modal-list').append(htmlUserInfo(profile));
                });
            }
        });
    });

    $('#btn-following').click(function(){
        $.ajax({
            type: 'GET',
            data: "displayName=" + param,
            url: baseUrl + '/follow/followers',
            success: function (data) {
                console.log(data);
            }
        });
    });

    $.ajax({
        type: 'GET',
        data: "",
        url: baseUrl + '/files/retrieveIconAll',
        success: function (data) {
            saveIcons(data);
        }
    });

    $.ajax({
        type: 'GET',
        data: 'displayName=' + param,
        url: baseUrl + '/footprint/history',
        success: function (data) {
            makeMarkers(data);
            $('#modal-footprint-list').html('');
            data.forEach(function(footprint){
                $('#modal-footprint-list').append(htmlFoorprintInfo(footprint));
            });
        }
    });

});

function saveIcons(data) {
    var o = data.iconUrls;
    for (i = 0; i < o.length; i++) {
        var key = o[i].key;
        var value = o[i].value;
        allIcon[key] = value;
    }
    console.log(allIcon);
}

function min(a, b){
    return a>b?b:a;
}
function max(a, b){
    return a>b?a:b;
}

function makeMarkers(links) {
    var minlat = maxlat = 37.504479;
    var minlng = maxlng = 127.048941;

    links.forEach(function (link) {
        console.log(link);
        var latitude = link.latitude;
        var longitude = link.longitude;
        var iconKey = link.icon_key;
        var title = link.footprint_id;

        minlat = min(minlat, latitude);
        minlng = min(minlng, longitude);
        maxlat = max(maxlat, latitude);
        maxlng = max(maxlng, longitude);

        var marker = new naver.maps.Marker({
            map: map,
            position: new naver.maps.LatLng(latitude, longitude),
            icon: {
                url: "http://d2w40mi5mo8vk7.cloudfront.net/" + iconKey,
                size: new naver.maps.Size(30, 30),
                scaledSize: new naver.maps.Size(30, 30),
                origin: new naver.maps.Point(0, 0),
                anchor: new naver.maps.Point(15, 15)
            },
            title: title
        });

        console.log("http://d2w40mi5mo8vk7.cloudfront.net/" + iconKey);
        markers.push(marker);
    });

    function getClickHandler(seq) {
        return function (e) {
            var id = markers[seq].getTitle();
            $.each(contentsData, function (index, item) {
                $.each(item, function (key, value) {
                    if (key == 'footprint_id' && value == id) {

                    }
                });
            });
        }
    }

    map.fitBounds(new naver.maps.LatLngBounds(
        new naver.maps.LatLng(minlat, minlng),
        new naver.maps.LatLng(maxlat, maxlng)
    ));

    markers.forEach(function (marker, index) {
        naver.maps.Event.addListener(marker, 'click', getClickHandler(index));
    });
}

