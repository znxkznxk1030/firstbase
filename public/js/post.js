
var baseUrl = "http://ec2-13-124-219-114.ap-northeast-2.compute.amazonaws.com:8080";

//지도 생성시에 옵션을 지정할 수 있습니다.
var map2 = new naver.maps.Map('detail-map', {
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
    mapDataControl: false, //네이버 Corp. 삭제
});

//setOptions 메서드를 통해 옵션을 조정할 수도 있습니다.
map2.setOptions("minZoom", 2);

var allIcon = {};
var markers = [];
var contentsData;

function saveIcons(data){
    var o = data.iconUrls;
    for(i = 0; i<o.length; i++){
        var key = o[i].key;
        var value = o[i].value;
        allIcon[key] = value;
    }
    console.log(allIcon);
}

$(document).ready(function(){

    $.ajax({
        type: 'GET',
        data: "",
        url: baseUrl+'/files/retrieveIconAll',
        success: function(data) {
            saveIcons(data);
        }
    });

    var param = window.location.href.split('id=')[1];
    var ajaxData = {
        footprintId: param
    };

    $.ajax({
        type: 'GET',
        data: ajaxData,
        url: baseUrl+'/footprint/detail/',
        success: function(data) {
            console.log("바로 밑");
            console.log(data);
            fillDetail(data);
        },
        error: function (error) {
            alert("잘못된 주소입니다.");
            location.href = baseUrl;
        }
    });

    var Bounds = map2.getBounds();
    getMarkers(Bounds);
    naver.maps.Event.addListener(map, 'bounds_changed', function(bounds) {
        getMarkers(bounds);
    });

});

$(window).on('load', function () {
    $('#loading').remove();
});


function getMarkers(Bounds) {

    var pickBounds = _.pick(Bounds,"_min","_max");

    var startlat = pickBounds._min._lat;
    var startlng = pickBounds._min._lng;
    var endlat = pickBounds._max._lat;
    var endlng = pickBounds._max._lng;

    var ajaxData = {
        startlat : endlat,
        startlng : startlng,
        endlat : startlat,
        endlng : endlng
    };

    $.ajax({
        type: 'GET',
        data: ajaxData,
        url: baseUrl+'/footprint/listbylocation/',
        success: function(data) {
            contentsData = data;
            makeMarkers(data);
        }
    });
}

function makeMarkers(data) {
    if (data.length > 0) {
        for (var i = 0; i < data.length; i++) {
            var o = data[i];
            var latitude = o.latitude;
            var longitude = o.longitude;

            var icon_key = o.icon_key;
            var iconUrl = "";

            $.each(allIcon, function (key, value) {
                if (key == icon_key) {
                    iconUrl = value;
                }
            });

            var marker = new naver.maps.Marker({
                map: map,
                position: new naver.maps.LatLng(latitude, longitude),
                icon: {
                    url: iconUrl,
                    size: new naver.maps.Size(30, 30),
                    scaledSize: new naver.maps.Size(30, 30),
                    origin: new naver.maps.Point(0, 0),
                    anchor: new naver.maps.Point(15, 15)
                },
                title: o.footprint_id
            });
            markers.push(marker);
        }

        function getClickHandler(seq) {
            return function() {
                var id = markers[seq].getTitle();
                $.ajax({
                    type: 'GET',
                    data: {footprintId : id},
                    url: baseUrl+'/footprint/detail',
                    success: function(data) {
                        fillDetail(data);
                    },
                    error: function (error) {
                        alert("죄송합니다. 에러가 발생했습니다.");
                        location.href = baseUrl;
                    }
                });
            }
        }

        for (var i=0, ii=markers.length; i<ii; i++) {
            naver.maps.Event.addListener(markers[i], 'click', getClickHandler(i));
        }
    }
}

function fillDetail(data) {
    var location = new naver.maps.LatLng(data.latitude, data.longitude);
    map2.setCenter(location); // 얻은 좌표를 지도의 중심으로 설정합니다.
    map2.setZoom(10); // 지도의 줌 레벨을 변경합니다.
    console.log("야호");
    console.log(data);
    $("#detail-icon").empty();
    $("#detail-images").empty();
    $("#detail-profileImg").empty();

    var icon_key = data.icon_key;
    var $icon;
    $.each( allIcon, function( key, value ) {
        if(key == icon_key){
            $icon = '<img src='+value+'>';
        }
    });
    $($icon).appendTo($("#detail-icon"));
    $("#detail-title").text(data.title);
    $("#detail-id").text(data.displayName);
    $detailDate = '' + data.modified_date.substring(2,10) + ' ' + data.modified_date.substring(11,16);
    $("#detail-modified_date").text($detailDate);
    $("#detail-countView span").html('&nbsp;'+data.countView);
    $("#detail-countComments span").html('&nbsp;'+data.countComments);

    for(i=0;i<data.imageUrls.length;i++){
        $img = '<img src='+data.imageUrls[i]+'>';
        $($img).appendTo($("#detail-images"));
    }

    $("#detail-content").text(data.content);
    $("#detail-like-count").text(data.countLike);
    $("#detail-dislike-count").text(data.countDisLike);

    $profileImg = '<img src='+data.profileUrl+'>';
    // $($profileImg).appendTo($("#detail-profileImg"));

    $("#detail-profileImg").css("background-image", 'url('+data.profileUrl+')');

    $("#detail-cmt-count").text(data.countComments);

    history.pushState(null,null,'http://localhost:8080/post?id='+data.footprint_id);
}
