var baseUrl = "http://ec2-13-124-219-114.ap-northeast-2.compute.amazonaws.com:8080";
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

$(document).ready(function () {
    $.ajax({
        type: 'GET',
        data: "",
        url: baseUrl + '/files/retrieveIconAll',
        success: function (data) {
            saveIcons(data);
        }
    });

    var param = window.location.href.split('displayName=')[1];

    $.ajax({
        type: 'GET',
        data: 'displayName=' + param,
        url: baseUrl + '/footprint/history',
        success: function (data) {
            console.log(data);
            new naver.maps.Marker({
                map: map,
                position: new naver.maps.LatLng(data.latitude, data.longitude),
                icon: {
                    url: data.iconUrl,
                    size: new naver.maps.Size(30, 30),
                    scaledSize: new naver.maps.Size(30, 30),
                    origin: new naver.maps.Point(0, 0),
                    anchor: new naver.maps.Point(15, 15)
                },
                title: data.footprint_id
            });

            makeMarkers(data);

            map.setZoom(13, true);
            map.panTo(new naver.maps.LatLng(data.latitude, data.longitude));
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

function makeMarkers(links) {

    links.forEach(function (link) {
        console.log(link);
        var latitude = link.latitude;
        var longitude = link.longitude;
        var iconKey = link.icon_key;
        var title = link.footprint_id;

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

    markers.forEach(function (marker, index) {
        naver.maps.Event.addListener(marker, 'click', getClickHandler(index));
    });
}

