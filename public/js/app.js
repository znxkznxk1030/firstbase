
var baseUrl = "http://ec2-13-124-219-114.ap-northeast-2.compute.amazonaws.com:8080";

var mapWidth = $("#map").outerWidth();
var mapHeight = $("#map").outerHeight();
var allIcon = {};

$(window).resize(function() {
    mapWidth = $("#map").outerWidth();
    mapHeight = $("#map").outerHeight();
    $("#add-button").css("margin-left",mapWidth-70);
    $("#add-button").css("margin-top",mapHeight-70);
    $("#radar-button").css("margin-left",mapWidth-38);
});

//지도 생성시에 옵션을 지정할 수 있습니다.
var map = new naver.maps.Map('map', {
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
map.setOptions("minZoom", 2);

var markers = [];
var contentsData;

$(document).ready(function(){

    $.ajax({
        type: 'GET',
        data: "",
        url: baseUrl+'/files/retrieveIconAll',
        success: function(data) {
            saveIcons(data);
        }
    });

    $.ajax({
        type: 'GET',
        data: "",
        url: baseUrl+'/footprint/list/',
        success: function(data) {
            makePage(data);
            contentsData = data;
        }
    });

    $("#add-button").css("margin-left",mapWidth-70);
    $("#add-button").css("margin-top",mapHeight-70);
    $("#radar-button").css("margin-left",mapWidth-38);

    var Bounds = map.getBounds();
    getMarkers(Bounds);
    naver.maps.Event.addListener(map, 'bounds_changed', function(bounds) {
        getMarkers(bounds);
    });

});

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
            return function(e) {
                var id = markers[seq].getTitle();
                $.each(contentsData, function (index, item) {
                    $.each(item, function (key, value) {
                        if (key == 'footprint_id' && value == id) {

                            if( $("#popUp").data("change") == "true" ){
                                if( id == $("#popUp").data("save") ){
                                    cancel();
                                }
                                else {
                                    popUp(contentsData[index]);
                                    $("#popUp").data("save", id);
                                }
                            }
                            else {
                                popUp(contentsData[index]);
                                $("#popUp").data("save", id);
                            }
                        }
                    });
                });
            }
        }

        for (var i=0, ii=markers.length; i<ii; i++) {
            naver.maps.Event.addListener(markers[i], 'click', getClickHandler(i));
        }
    }
}

function makePage(data) {
    // var myJSON = JSON.stringify(data);
    var $list = $('<div id="content-wrapper"></div>').appendTo($('#contents'));

    //data[i] 또는 foreach(data)
    if(data.length > 0) {
        var fnAppendPage = function(start){
            $('#content-wrapper').html("");
            var end = Math.min(data.length, start+10);

            <!-- 게시판 -->
            var $board = $('<div id="board"></div>').appendTo($list);
            $('<div id="board-title">제목</div>').appendTo($board);
            $('<div id="board-author">작성자</div>').appendTo($board);
            $('<div id="board-date">날짜</div>').appendTo($board);
            $('<div id="board-hits">조회수</div>').appendTo($board);


            for(var i=start; i<end; i++) {
                var o = data[i];
                var $content = $('<div class="content list-group-item list-group-item-action"></div>').data('data', o).appendTo($list).click(function(){
                    popUp($(this).data('data'));
                    $("#popUp").data("save", o.id);
                });
                $content_img = $('<div class="content-img"></div>').appendTo($content);
                $('<div class="content-title"></div>').text(o.title).appendTo($content);
                $('<div class="content-author"></div>').text(o.id).appendTo($content);
                $('<div class="content-date"></div>').text(o.modified_date.substring(5,10)).appendTo($content);
                $('<div class="content-hits"></div>').text(o.countView).appendTo($content);

                var icon_key = o.icon_key;
                var $icon;
                $.each( allIcon, function( key, value ) {
                    if(key == icon_key){
                        $icon = '<img src='+value+'>';
                    }
                });
                $($icon).prependTo($content_img);
                // var $post = $('<div class="post""></div>').appendTo($content).text(o.content).data('data', o).click(function(){
                //     popUp($(this).data('data'));
                // });
            }
        };

        var $page = $('<div id="contents-page"></div>').appendTo($('#contents'));
        console.log("asdfas"+data.length);
        console.log(data);
        var pageCnt = data.length / 10;
        for(i=0; i<pageCnt; i++) {
            $('<span class="page"></span>').data('page', i).text(i+1).appendTo($page).click(function(){
                var pageIdx = $(this).data('page');
                fnAppendPage(pageIdx * 10);
            });
        }
        makeMarkers(data);
        fnAppendPage(0);
    }
}

function renderPage(data) {
    if(data.length > 0) {
        $('#contents-page').html("");
        var fnAppendPage = function(start){
            $('#content-wrapper').html("");
            var end = Math.min(data.length, start+10);

            <!-- 게시판 -->
            var $board = $('<div id="board"></div>').appendTo($("#content-wrapper"));
            $('<div id="board-title">제목</div>').appendTo($board);
            $('<div id="board-author">작성자</div>').appendTo($board);
            $('<div id="board-date">날짜</div>').appendTo($board);
            $('<div id="board-hits">조회수</div>').appendTo($board);

            for(var i=start; i<end; i++) {
                var o = data[i];
                var $content = $('<div class="content list-group-item list-group-item-action"></div>').data('data', o).appendTo($("#content-wrapper")).click(function(){
                    popUp($(this).data('data'));
                    $("#popUp").data("save", o.id);
                });
                $content_img = $('<div class="content-img"></div>').appendTo($content);
                $('<div class="content-title"></div>').text(o.title).appendTo($content);
                $('<div class="content-author"></div>').text(o.id).appendTo($content);
                $('<div class="content-date"></div>').text(o.modified_date.substring(5,10)).appendTo($content);
                $('<div class="content-hits"></div>').text(o.countView).appendTo($content);

                var icon_key = o.icon_key;
                var $icon;
                $.each( allIcon, function( key, value ) {
                    if(key == icon_key){
                        $icon = '<img src='+value+'>';
                    }
                });
                $($icon).prependTo($content_img);
                // var $post = $('<div class="post""></div>').appendTo($content).text(o.content).data('data', o).click(function(){
                //     popUp($(this).data('data'));
                // });
            }
        };

        var pageCnt = data.length / 10;
        for(i=0; i<pageCnt; i++) {
            $('<span class="page"></span>').data('page', i).text(i+1).appendTo($("#contents-page")).click(function(){
                var pageIdx = $(this).data('page');
                fnAppendPage(pageIdx * 10);
            });
        }
        makeMarkers(data);
        fnAppendPage(0);
    }
}

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
            renderPage(data);
            contentsData = data;
        }
    });
}

function write_button_click() {
    // $("#add-button").replaceWith( $("#add-button2") );
    // $("#add-button2").css("display", "block");

    $("#contents-area").html("<div class='emoticon'><img src='/img/layout/travel.png'></div><div class='emoticon'><img src='/img/layout/travel.png'></div><div class='emoticon'><img src='/img/layout/travel.png'></div><div class='emoticon'><img src='/img/layout/travel.png'></div><div class='emoticon'><img src='/img/layout/travel.png'></div><div class='emoticon'><img src='/img/layout/travel.png'></div><div class='emoticon'><img src='/img/layout/travel.png'></div><div class='emoticon'><img src='/img/layout/travel.png'></div><div class='emoticon'><img src='/img/layout/travel.png'></div>");

    $(".emoticon img").draggable({
        containment: "body"
    });
}

var ActivateWriteHere = false;

$(document).on('mousedown', '.emoticon img', function(){
    $( ".emoticon img" ).draggable({
        containment: "#map"
    });
    /* lock icon in map. user could drag icon only in map */
});

$(document).on('mouseup', '.emoticon img', function(event){
    x = event.pageX;
    y = event.pageY;
    calCoord(x,y);
});

function calCoord(x,y){

    ActivateWriteHere = true;

    $( ".emoticon img" ).draggable({
        disabled: true
    });

    /*
    a = $("#map").outerWidth();
    b = $("#map").outerHeight();
    if( (a>x) && (b>y) ){
        $( ".emoticon img" ).draggable({
            disabled: true
        });
    }
    */

    $.ajax({
        type: 'GET',
        data: "",
        url: '/footprint/new',
        success: function(data) {
            $("#contents-area").html(data);
        }
    });
}


var listener = naver.maps.Event.addListener(map, 'mousemove', function(e) {
    if(ActivateWriteHere == true){
        var here = e.coord;
        writeHere(here);
        /*naver.maps.Event.removeListener(listener);*/
        ActivateWriteHere = false
    }
});

function writeHere(here) {
    var markerOptions = {
        position:  new naver.maps.LatLng(here.y, here.x),
        map: map,
        icon: {
            url: 'https://image.flaticon.com/icons/png/128/45/45873.png',
            size: new naver.maps.Size(30, 30),
            scaledSize: new naver.maps.Size(30, 30),
            origin: new naver.maps.Point(0, 0),
            anchor: new naver.maps.Point(15, 15)
        }
    };

    var marker = new naver.maps.Marker(markerOptions);
    $("#contents-area .footprint-new #icon_url").val('/img/layout/travel.png');
    $("#contents-area .footprint-new #latitude").val(here.x);
    $("#contents-area .footprint-new #longitude").val(here.y);
}

function popUp(data) {
    $("#popUp").css("display", "flex");
    $("#popUp").data("change", "true");

    $("#popUp").find($(".change")).text("");

    var icon_key = data.icon_key;
    var $icon;
    $.each( allIcon, function( key, value ) {
        if(key == icon_key){
            $icon = '<img src='+value+'>';
        }
    });
    $($icon).appendTo($("#detail-icon"));
    console.log(data);
    console.log(data.image);
    $("#detail-title").text(data.title);
    $("#detail-id").text(data.id);
    $("#detail-modified_date").text(data.modified_date);
    $("#detail-image").text(data.image);
    $("#detail-content").text(data.content);
    $("#detail-cmt-count").text(data.commentCount);
    $.ajax({
        type: 'GET',
        data: {footprintId : data.footprint_id},
        url: baseUrl+'/footprint/detail',
        success: function(data) {
            console.log(data);
            console.log(data.imageUrls);
            console.log(data.imageUrls[i]);
            var $img;
            for(i=0;i<data.imageUrls.length;i++){
                $img = '<img src='+data.imageUrls[i]+'>';
                $($img).appendTo($("#detail-image"));
            }
        }
    });
    $("#popUp").animate({left: "65vw"});
}

function cancel(){
    $("#popUp").animate({left: "100vw"});
    $("#popUp").data("change", "false");
}

function saveIcons(data){
    var o = data.iconUrls;
    for(i = 0; i<o.length; i++){
        var key = o[i].key;
        var value = o[i].value;
        allIcon[key] = value;
    }
    console.log(allIcon);
}