var baseUrl = "http://ec2-13-124-219-114.ap-northeast-2.compute.amazonaws.com:8080";

var mapWidth = $("#map").outerWidth();
var mapHeight = $("#map").outerHeight();
var allIcon = {};

var links = [];
var linkFootprints = [];

$(window).resize(function () {

});

upperP1 = new naver.maps.LatLng([127.1059799194336, 37.359788198380755]),
    upperP2 = new naver.maps.LatLng([127.1059799194336, 37.368861139209535]),
    lowerP1 = upperP1.destinationPoint(180, 1500),
    lowerP2 = upperP2.destinationPoint(180, 1500),
    strokeWeight = 6;

// 폴리라인의 시작/끝 점에 아이콘을 추가합니다.
// 아이콘 크기를 지정하지 않은 경우, 폴라리인의 strokeWeight 값에 영향을 받습니다.
var openArrowLine = new naver.maps.Polyline({
    path: [
        upperP1,
        upperP2
    ],
    map: map,
    endIcon: naver.maps.PointingIcon.OPEN_ARROW,
    strokeColor: '#ff0000',
    strokeWeight: strokeWeight
});

var options = {
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
};

//지도 생성시에 옵션을 지정할 수 있습니다.
var map = new naver.maps.Map('map', options);

//setOptions 메서드를 통해 옵션을 조정할 수도 있습니다.
map.setOptions("minZoom", 2);

var markers = [];
var contentsData;

$(document).ready(function () {

    $.ajax({
        type: 'GET',
        data: "",
        url: baseUrl + '/files/retrieveIconAll',
        success: function (data) {
            saveIcons(data);
        }
    });

    links = [];
    linkFootprints = [];

    $.ajax({
        type: 'GET',
        data: 'footprintId=148',
        url: baseUrl + '/footprint/detail',
        success: function (data) {

            console.log(data);
            var $img;

            $("#detail-images").empty();

            for (i = 0; i < data.imageUrls.length; i++) {
                $img = '<img src=' + data.imageUrls[i] + '>';
                $($img).appendTo($("#detail-images"));
            }

            $('#icon-image').attr('src', data.iconUrl);
            $('#title').text(data.title);

            $('#detail-text').text(data.content);

            $("#profile-image").attr('src', data.profileUrl);
            $("#displayName").text(data.displayName);

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

            makeMarkers(data.links);

            const origin = {footprint_id : data.footprint_id, latitude : data.latitude, longitude : data.longitude};
            makeArrows(origin, data.links);

            map.setZoom(13, true);
            map.panTo(new naver.maps.LatLng(data.latitude, data.longitude));
        }
    });
});

function makeArrows(origin, links){
    var prev = origin;
    var capacity = links.length;

    for(var i = 0; i < capacity; i++){
        console.log('#debug : ' + prev.latitude);
        var prev_point = new naver.maps.LatLng([prev.longitude, prev.latitude]);

        prev = links.find(function(link){
            if(link.start_footprint_id === prev.footprint_id)
                return true;
        });

        if(typeof prev !== 'undefined'){
            var next_point = new naver.maps.LatLng([prev.longitude, prev.latitude]);

            console.log(prev_point);
            console.log(next_point);

            new naver.maps.Polyline({
                path: [
                    prev_point,
                    next_point
                ],
                map: map,
                endIcon: naver.maps.PointingIcon.OPEN_ARROW,
                strokeColor: '#00bbd2',
                strokeWeight: 6
            });

        }
        else{
            break;
        }
    }
}

$(document).on('click', '#load-area', function () {
    $("#load-area").animate({opacity: "0"}, 1200, function () {
        $("#load-area").remove();
    });
});


var temp_Markers = [];
var marker_temp;
var ActivateWriteHere = false;

$(document).on('mousedown', '.write-icons img', function () {
    /* lock icon in map. user could drag icon only in map */
    // ActivateWriteHere = true;

    if (temp_Markers.length > 0) {
        marker_temp.setMap(null);
    }

    var imgUrl = $(this).attr('src');

    var writeListener = naver.maps.Event.addListener(map, 'mousemove', function (e) {

        if (ActivateWriteHere == true && e.coord != undefined) {
            writeHere(e.coord, imgUrl);
            naver.maps.Event.removeListener(writeListener);
        }
        else {
            console.log("???");
            return;
        }
    });
});


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
                    if (key === 'footprint_id' && value === id) {

                    }
                });
            });
        }
    }

    markers.forEach(function (marker, index) {
        naver.maps.Event.addListener(marker, 'click', getClickHandler(index));
    });
}

function write_button_click() {
    // $("#add-button").replaceWith( $("#add-button2") );
    // $("#add-button2").css("display", "block");

    $("#writePage").css("display", "flex");
    $('#write-change').html("");
    $('#writePage').css("overflow", "visible");

    var $write_icons;
    var $icon;
    var tempMax = 0;
    $.each(allIcon, function (key, value) {
        $write_icons = $('<div class="write-icons"></div>');
        $write_icons.appendTo($('#write-change'));
        $icon = $('<img src=' + value + '>');
        $icon.appendTo($write_icons);
        tempMax++;
        if (tempMax == 10) {
            return false;
        }
    });

    // $(".write-icon img").draggable({
    //     containment: "body"
    // });

    $(".write-icons img").draggable({
        containment: "#main-area",
        revert: "invalid",
        helper: "clone",
        cursor: "move"
    });

    $("#map").droppable({
        accept: ".write-icon img",
        drop: function (event, ui) {

        }
    });

    $("#writePage").animate({left: "65vw"});
}

function popUp(data) {
    $.ajax({
        type: 'GET',
        data: {footprintId: data.footprint_id},
        url: baseUrl + '/footprint/detail',
        success: function (data) {
            console.log(data);
            console.log(data.imageUrls);
            console.log(data.imageUrls[i]);

            var $img;

            $("#detail-images").empty();

            for (i = 0; i < data.imageUrls.length; i++) {
                $img = '<img src=' + data.imageUrls[i] + '>';
                $($img).appendTo($("#detail-images"));
            }

            $('#icon-image').attr('src', data.iconUrl);
            $('#title').text(data.title);

            $('#detail-text').text(data.content);

            $("#profile-image").attr('src', data.profileUrl);
            $("#displayName").text(data.displayName);

            map.setZoom(13, true);
            map.panTo(new naver.maps.LatLng(data.latitude, data.longitude));
        }
    });


    //window.location.href = 'http://localhost:8080' + '/footprint/modal_detail?footprintId=' + data.footprintId;
}

function cancel(page) {
    page.animate({left: "100vw"});
    page.data("change", "false");
}

function saveIcons(data) {
    var o = data.iconUrls;
    for (i = 0; i < o.length; i++) {
        var key = o[i].key;
        var value = o[i].value;
        allIcon[key] = value;
    }
    console.log(allIcon);
}

//자기 위치 찾기 시작
function search_position() {
    navigator.geolocation.getCurrentPosition(onSuccessGeolocation);
}

//자기 위치 찾기 끝
function onSuccessGeolocation(position) {
    var location = new naver.maps.LatLng(position.coords.latitude, position.coords.longitude);
    map.setCenter(location); // 얻은 좌표를 지도의 중심으로 설정합니다.
    map.setZoom(10); // 지도의 줌 레벨을 변경합니다.
}