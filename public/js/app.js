var baseUrl = "http://ec2-13-124-219-114.ap-northeast-2.compute.amazonaws.com:8080";
var baseUrl2 = "http://localhost:8080";
var baseUrl3 = "http://www.firstbase.zone:8080";

var mapWidth = $("#map").outerWidth();
var mapHeight = $("#map").outerHeight();
var allIcon = {};
var socket = io();
var isImageComplete = false;

$.ajaxSetup({
    cache: true
});

$(window).resize(function () {
    mapWidth = $("#map").outerWidth();
    mapHeight = $("#map").outerHeight();
    $("#add-button").css("margin-left", mapWidth - 70);
    $("#add-button").css("margin-top", mapHeight - 70);
    $("#radar-button").css("margin-left", mapWidth - 38);
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

$(document).ready(function () {

    $.ajax({
        type: 'GET',
        data: "",
        url: baseUrl + '/files/retrieveIconAll',
        success: function (data) {
            saveIcons(data);
        },
        error: function (error) {
            location.href = baseUrl + "/404";
            console.log(error);
            debugger;
        }
    });

    $.ajax({
        type: 'GET',
        data: "",
        url: baseUrl + '/footprint/list/',
        success: function (data) {
            makePage(data);
            contentsData = data;
        },
        error: function (error) {
            location.href = baseUrl + "/404";
            console.log(error);
            debugger;
        }
    });

    $("#add-button").css("margin-left", mapWidth - 70);
    $("#add-button").css("margin-top", mapHeight - 70);
    $("#radar-button").css("margin-left", mapWidth - 38);

    var Bounds = map.getBounds();
    getMarkers(Bounds);
    naver.maps.Event.addListener(map, 'bounds_changed', function (bounds) {
        getMarkers(bounds);
    });

});

$(window).on('load', function () {
    $('#loading').remove();
});
//
// $(document).on('click', '#load-area', function(){
//     $("#load-area").animate({opacity: "0"}, 1200, function () {
//         $("#load-area").remove();
//     });
// });

//
//
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

//
// $(document).on('mouseup', '.write-icon img', function(event){
//     x = event.pageX;
//     y = event.pageY;
//     calCoord(x,y);
// });

//$(".write-icon img").mouseup(function(e){                 //아직 아이콘 생성 안돼서 불가능.
$(document).on('mouseup', '.write-icons img', function (e) {  //document라서 중간에 아이콘 생성돼도 가능.

    // for(i = 0; i<temp_Markers.length; i++){
    //     // temp_Markers[i]
    // }

    var x = e.pageX;
    var y = e.pageY;
    var mapX = $("#map").offset().left;
    var mapY = $("#map").offset().top;

    if (mapX < x && x < mapX + mapWidth && mapY < y && y < mapY + mapHeight) {
        $('#write-change').html("");
        ActivateWriteHere = true;

        // naver.maps.Event.trigger(map, 'mousemove', function check(e) {
        //     var check = true;
        //     var here = e.coord;
        //     writeHere(here);
        //     if(ActivateWriteHere == true){
        //         naver.maps.Event.removeListener(listener);
        //         ActivateWriteHere = false;
        //     }
        //     else {
        //         return;
        //     }
        //  });

    }
    else {
        alert("지도에 아이콘을 놔주세요.");
        write_button_click();
    }

});

var writeImages = [];
var writeCoord;

$(document).on('click', '#wbo', writeComplete);

function writeComplete() {
    if (isImageComplete) {
        var title = $("#write-title input").val();
        var icon_url = $("#write-div-icon img").attr("src");
        var content = $("#write-text-form textarea").val();
        var imageKey = writeImages;
        var latitude = parseFloat(writeCoord.y);
        var longitude = parseFloat(writeCoord.x);

        var ajaxData = {
            "title": title,
            "icon_url": icon_url,
            "content": content,
            "imageKeys": JSON.stringify(imageKey),
            "latitude": latitude,
            "longitude": longitude
        };

        console.log("이거 ajaxData");
        console.log(ajaxData);
        console.log(JSON.stringify(ajaxData));

        $.ajax({
            type: 'POST',
            data: ajaxData,
            url: baseUrl + '/footprint/create',
            success: function (data) {
                console.log(data);
                cancel($('#writePage'));
            },
            error: function (error) {
                location.href = baseUrl + "/404";
                console.log(error);
                debugger;
            }
        });
    }
}

function writeHere(coord, imgUrl) {
    ActivateWriteHere = false;
    writeCoord = coord;
    $('#write-change').html("");
    var markerOptions = {
        position: new naver.maps.LatLng(coord.y, coord.x),
        map: map,
        icon: {
            url: imgUrl,
            size: new naver.maps.Size(30, 30),
            scaledSize: new naver.maps.Size(30, 30),
            origin: new naver.maps.Point(0, 0),
            anchor: new naver.maps.Point(15, 15)
        }
    };
    marker_temp = new naver.maps.Marker(markerOptions);
    temp_Markers.push(marker_temp);

    var write_form = '';

    // write_form += '<form action="/footprint/create" method="post" enctype="application/json">';

    write_form += '<div id="write-top-div">';
    write_form += '<div id="write-div-icon"><img src=' + imgUrl + '></div>';
    write_form += '<div id="write-title"><input type="text" class="form-control" name="title" id="title" placeholder="제목"/></div>';
    write_form += '</div>';

    write_form += '<div id="write-images">';
    write_form += '</div>';

    write_form += '<div id="write-mid-div">';
    write_form += '<div id="write-text-form"><textarea name="content" id="write-content" class="form-control" placeholder="내용" wrap="hard"></textarea></div>';
    write_form += '<div id="write-add-img"><input type="file" id="write-img" accept="image/*" multiple/><label for="write-img"><img src="/img/layout/add-img.png">사진 첨부하기</label></div>';
    write_form += '</div>';

    write_form += '<div id="write-bot-div">';
    write_form += '<button type="button" class="btn" id = "wbx" onclick="cancel($(\'#writePage\'));">취소</button>';
    write_form += '<button type="submit" class="btn" id = "wbo">작성완료</button>';
    write_form += '</div>'

    // write_form += '</form>';

    $('#write-change').html(write_form);


    // $write_bot_div = $('<div id="write-bot-div"></div>');
    // $write_submit_div = $('<div id="write-submit-div"></div>');
    //
    //

    //
    // $write_add_img = $('<div class="write-add-img"></div>');
    // $add_img_button = $('<div class="add-img-button"></div>');
    // $write_id = $('<div class="write-id"></div>');
    //
    // $write_imgs = $('<div class="write-imgs"></div>');
    // $write_img = $('<div class="write-img"></div>');
    // $write_text = $('<div class="text"></div>');
    //
    // $add_img_button = $('<div class="add-img-button"></div>');
    // $add_img_button = $('<div class="add-img-button"></div>');
    // $add_img_button = $('<div class="add-img-button"></div>');
    // $add_img_button = $('<div class="add-img-button"></div>');
    //
    // $.each(allIcon, function (key, value) {
    //     $write_icon = $('<div class="write-icon"></div>');
    //     $write_icon.appendTo($('#write-change'));
    //     $icon = '<img src=' + value + '>';
    //     $($icon).prependTo($write_icon);
    // });
}

//글 작성 페이지 완성


// <div class='footprint-new'>
//         <form action="/footprint/create" method="post" enctype="application/json">
//         <h2>닉네임: <%= user.displayName %></h2>
//         <div>
//         <input type="text" class="form-control" name="title" id="title" placeholder="제목"/>
//         </div>
//         <div>
//         <img src='/img/layout/travel.png'>
//         <input type="text" class="form-control" name="icon_url" id="icon_url" placeholder="아이콘 주소"/>
//         </div>
//         <div>
//         <input type="textarea" class="form-control" name="content" id="content" placeholder="내용"/>
//         </div>
//
//         <div>
//         <input type="number" step="any" class="form-control" name="latitude" id="latitude" placeholder="latitude"/>
//         </div>
//
//         <div>
//         <input type="number" step="any" class="form-control" name="longitude" id="longitude" placeholder="longitude"/>
//         </div>
//
//         <div>
//         <button type="submit" class="btn btn-success btn-block">글 쓰기</button>
//     </div>
//     </form>
//     <form  action="/files/upload" enctype="multipart/form-data"  method="post">
//         <input  type="file" name="image" accept="image/*">
//         <button type="submit" class="btn btn-success btn-block">사진 제출</button>
//     </form>
//     </div>


//완료 버튼 클릭시 함수 작성

//완료 버튼 클릭시 marker 삭제 후 title 넣어서 재생성 & markers에 넣기

// var marker = new naver.maps.Marker({
//     map: map,
//     position: new naver.maps.LatLng(latitude, longitude),
//     icon: {
//         url: iconUrl,
//         size: new naver.maps.Size(30, 30),
//         scaledSize: new naver.maps.Size(30, 30),
//         origin: new naver.maps.Point(0, 0),
//         anchor: new naver.maps.Point(15, 15)
//     },
//     title: o.footprint_id
// });
// markers.push(marker);

//
// $("#contents-area .footprint-new #icon_url").val('/img/layout/travel.png');
// $("#contents-area .footprint-new #latitude").val(here.x);
// $("#contents-area .footprint-new #longitude").val(here.y);


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
            return function () {
                var id = markers[seq].getTitle();
                $.each(contentsData, function (index, item) {
                    $.each(item, function (key, value) {
                        if (key == 'footprint_id' && value == id) {

                            // if ($("#popUp").data("change") == "true") {
                            //     if (id == $("#popUp").data("save")) {
                            //         cancel($("#popUp"));
                            //     }
                            //     else {
                                    popUp(contentsData[index]);
                            //         $("#popUp").data("save", id);
                            //     }
                            // }
                            // else {
                            //     popUp(contentsData[index]);
                            //     $("#popUp").data("save", id);
                            // }
                        }
                    });
                });
            };
        }

        for (var i = 0, ii = markers.length; i < ii; i++) {
            naver.maps.Event.addListener(markers[i], 'click', getClickHandler(i));
        }
    }
}

function makePage(data) {
    // var myJSON = JSON.stringify(data);
    var $list = $('<div id="content-wrapper"></div>').appendTo($('#contents'));

    //data[i] 또는 foreach(data)
    if (data.length > 0) {
        var fnAppendPage = function (start) {
            $('#content-wrapper').html("");
            var end = Math.min(data.length, start + 10);

            <!-- 게시판 -->
            var $board = $('<div id="board"></div>').appendTo($list);
            $('<div id="board-title">제목</div>').appendTo($board);
            $('<div id="board-author">작성자</div>').appendTo($board);
            $('<div id="board-date">날짜</div>').appendTo($board);
            $('<div id="board-hits">조회수</div>').appendTo($board);


            for (var i = start; i < end; i++) {
                var o = data[i];
                var $content = $('<div class="content list-group-item list-group-item-action"></div>').data('data', o).appendTo($list).click(function () {
                    popUp($(this).data('data'));
                    // $("#popUp").data("save", o.id);
                });
                $content_img = $('<div class="content-img"></div>').appendTo($content);
                $('<div class="content-title"></div>').text(o.title).appendTo($content);
                $('<div class="content-author"></div>').text(o.displayName).appendTo($content);
                $('<div class="content-date"></div>').text(o.modified_date.substring(5, 10)).appendTo($content);
                $('<div class="content-hits"></div>').text(o.view_count).appendTo($content);

                var icon_key = o.icon_key;
                var $icon;
                $.each(allIcon, function (key, value) {
                    if (key == icon_key) {
                        $icon = '<img src=' + value + '>';
                    }
                });
                $($icon).prependTo($content_img);
                // var $post = $('<div class="post""></div>').appendTo($content).text(o.content).data('data', o).click(function(){
                //     popUp($(this).data('data'));
                // });
            }
        };

        var $page = $('<div id="contents-page"></div>').appendTo($('#contents'));
        console.log("asdfas" + data.length);
        console.log(data);
        var pageCnt = data.length / 10;
        for (i = 0; i < pageCnt; i++) {
            $('<span class="page"></span>').data('page', i).text(i + 1).appendTo($page).click(function () {
                var pageIdx = $(this).data('page');
                fnAppendPage(pageIdx * 10);
            });
        }
        makeMarkers(data);
        fnAppendPage(0);
    }
}

function renderPage(data) {
    if (data.length > 0) {
        $('#contents-page').html("");
        var fnAppendPage = function (start) {
            $('#content-wrapper').html("");
            var end = Math.min(data.length, start + 10);

            <!-- 게시판 -->
            var $board = $('<div id="board"></div>').appendTo($("#content-wrapper"));
            $('<div id="board-title">제목</div>').appendTo($board);
            $('<div id="board-author">작성자</div>').appendTo($board);
            $('<div id="board-date">날짜</div>').appendTo($board);
            $('<div id="board-hits">조회수</div>').appendTo($board);

            for (var i = start; i < end; i++) {
                var o = data[i];
                var $content = $('<div class="content list-group-item list-group-item-action"></div>').data('data', o).appendTo($("#content-wrapper")).click(function () {
                    popUp($(this).data('data'));
                    // $("#popUp").data("save", o.id);
                });
                $content_img = $('<div class="content-img"></div>').appendTo($content);
                $('<div class="content-title"></div>').text(o.title).appendTo($content);
                $('<div class="content-author"></div>').text(o.displayName).appendTo($content);
                $('<div class="content-date"></div>').text(o.modified_date.substring(5, 10)).appendTo($content);
                $('<div class="content-hits"></div>').text(o.view_count).appendTo($content);

                var icon_key = o.icon_key;
                var $icon;
                $.each(allIcon, function (key, value) {
                    if (key == icon_key) {
                        $icon = '<img src=' + value + '>';
                    }
                });
                $($icon).prependTo($content_img);
                // var $post = $('<div class="post""></div>').appendTo($content).text(o.content).data('data', o).click(function(){
                //     popUp($(this).data('data'));
                // });
            }
        };

        var pageCnt = data.length / 10;
        for (i = 0; i < pageCnt; i++) {
            $('<span class="page"></span>').data('page', i).text(i + 1).appendTo($("#contents-page")).click(function () {
                var pageIdx = $(this).data('page');
                fnAppendPage(pageIdx * 10);
            });
        }
        makeMarkers(data);
        fnAppendPage(0);
    }
}

function getMarkers(Bounds) {

    var pickBounds = _.pick(Bounds, "_min", "_max");

    var startlat = pickBounds._min._lat;
    var startlng = pickBounds._min._lng;
    var endlat = pickBounds._max._lat;
    var endlng = pickBounds._max._lng;

    var ajaxData = {
        startlat: endlat,
        startlng: startlng,
        endlat: startlat,
        endlng: endlng
    };

    $.ajax({
        type: 'GET',
        data: ajaxData,
        url: baseUrl + '/footprint/listbylocation/',
        success: function (data) {
            renderPage(data);
            contentsData = data;
        },
        error: function (error) {
            location.href = baseUrl + "/404";
            console.log(error);
            debugger;
        }
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
        if (tempMax == 25) {
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

    $("#writePage").animate({left: "62.5vw"});
}

// function calCoord(x,y){
//
//     ActivateWriteHere = true;
/*
a = $("#map").outerWidth();
b = $("#map").outerHeight();
if( (a>x) && (b>y) ){
    $( ".emoticon img" ).draggable({
        disabled: true
    });
}
*/

// $.ajax({
//     type: 'GET',
//     data: "",
//     url: '/footprint/new',
//     success: function(data) {
//         $("#contents-area").html(data);
//     }
// });


// <div class='footprint-new'>
//         <form action="/footprint/create" method="post" enctype="application/json">
//         <h2>닉네임: <%= user.displayName %></h2>
//         <div>
//         <input type="text" class="form-control" name="title" id="title" placeholder="제목"/>
//         </div>
//         <div>
//         <img src='/img/layout/travel.png'>
//         <input type="text" class="form-control" name="icon_url" id="icon_url" placeholder="아이콘 주소"/>
//         </div>
//         <div>
//         <input type="textarea" class="form-control" name="content" id="content" placeholder="내용"/>
//         </div>
//
//         <div>
//         <input type="number" step="any" class="form-control" name="latitude" id="latitude" placeholder="latitude"/>
//         </div>
//
//         <div>
//         <input type="number" step="any" class="form-control" name="longitude" id="longitude" placeholder="longitude"/>
//         </div>
//
//         <div>
//         <button type="submit" class="btn btn-success btn-block">글 쓰기</button>
//     </div>
//     </form>
//     <form  action="/files/upload" enctype="multipart/form-data"  method="post">
//         <input  type="file" name="image" accept="image/*">
//         <button type="submit" class="btn btn-success btn-block">사진 제출</button>
//     </form>
//     </div>
// }


function popUp(data) {

    history.pushState(null, null, baseUrl3 + '/post?id=' + data.footprint_id);
    console.log("이거 검토");
    console.log(data);

    $.getScript( "/js/post.js" )
        .done(function( script, textStatus ) {

        })
        .fail(function( jqxhr, settings, exception ) {
            location.href = baseUrl + "/404";
            debugger;
        });

    $(window).on('load', function () {
        $('#loading').remove();
    });

    $("#popUp").modal();

    // $("#popUp").css("display", "flex");
    // $("#popUp").data("change", "true");

    // $("#popUp").find($(".change")).text("");
    //
    // var icon_key = data.icon_key;
    // var $icon;
    // $.each( allIcon, function( key, value ) {
    //     if(key == icon_key){
    //         $icon = '<img src='+value+'>';
    //     }
    // });
    // $($icon).appendTo($("#detail-icon"));
    // console.log(data);
    // console.log(data.image);
    // $("#detail-title").text(data.title);
    // $("#detail-id").text(o.displayName);
    // $("#detail-modified_date").text(data.modified_date.substring(2,10));
    // $("#detail-title-plus-left-bot").text("조회수: "+data.view_count +"    댓글수: "+data.countComments);
    // $("#detail-image").text(data.image);
    // $("#detail-content").text(data.content);
    // $("#detail-cmt-count").text(data.commentCount);
    // $.ajax({
    //     type: 'GET',
    //     data: {footprintId : data.footprint_id},
    //     url: baseUrl+'/footprint/detail',
    //     success: function(data) {
    //         console.log(data);
    //         console.log(data.imageUrls);
    //         console.log(data.imageUrls[i]);
    //         var $img;
    //         for(i=0;i<data.imageUrls.length;i++){
    //             $img = '<img src='+data.imageUrls[i]+'>';
    //             $($img).appendTo($("#detail-images"));
    //         }
    //     }
    // });
    // var sideMap = new naver.maps.Map('sideMap', {
    //     center: map.center, //지도의 초기 중심 좌표
    //     zoom: 10, //지도의 초기 줌 레벨
    //     minZoom: 2, //지도의 최소 줌 레벨 //축소
    //     maxZoom: 14, //확대
    //     zoomControl: true, //줌 컨트롤의 표시 여부
    //     zoomControlOptions: { //줌 컨트롤의 옵션
    //         style: naver.maps.ZoomControlStyle.SMALL, // 바가 아니라 확대 축소로.
    //         position: naver.maps.Position.RIGHT_CENTER
    //     },
    //     logoControl: false, //네이버 로고 삭제
    //     scaleControl: false, //거리 단위 표시 삭제
    //     mapDataControl: false, //네이버 Corp. 삭제
    // });

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


$(document).on('change', '#write-img', handleImgFileSelect);

function handleImgFileSelect(e) {

    var files = e.target.files;
    var filesArr = Array.prototype.slice.call(files);

    isImageComplete = false;

    async.times(filesArr.length, function (n, next) {
        f = filesArr[n];
        if (!f.type.match("image.*")) {
            alert("확장자는 이미지 확장자만 가능합니다.");
            return next("확장자는 이미지 확장자만 가능합니다.");
        } else {
            var reader = new FileReader();
            reader.readAsDataURL(f);
            reader.onload = function (e) {
                var img_html = "<img src=\"" + e.target.result + "\" />";
                $("#write-images").append(img_html);
                var formData = new FormData();
                formData.append('files', f.value);
            }
            var formData = new FormData();
            formData.append('image', f);
            $.ajax({
                type: 'POST',
                data: formData,
                url: baseUrl + '/files/upload',
                processData: false,
                contentType: false,
                success: function (data) {
                    return next(null, data.imageKey);
                },
                error: function (error) {
                    location.href = baseUrl + "/404";
                    console.log(error);
                    debugger;
                }
            });
        }
    }, function (err, imageKeys) {
        writeImages = imageKeys;
        isImageComplete = true;
    });

    // filesArr.forEach(function (f) {
    //     if (!f.type.match("image.*")) {
    //         alert("확장자는 이미지 확장자만 가능합니다.");
    //         return false;
    //     } else {
    //         var reader = new FileReader();
    //         reader.readAsDataURL(f);
    //         reader.onload = function (e) {
    //             var img_html = "<img src=\"" + e.target.result + "\" />";
    //             $("#write-images").append(img_html);
    //             var formData = new FormData();
    //             formData.append('files', f.value);
    //         }
    //         var formData = new FormData();
    //         formData.append('image', f);
    //         $.ajax({
    //             type: 'POST',
    //             data: formData,
    //             url: baseUrl + '/files/upload',
    //             processData: false,
    //             contentType: false,
    //             success: function (data) {
    //                 console.log(data);
    //                 writeImages[writeImages.length] = data.imageKey;
    //             }
    //         });
    //     }
    // });
}

function hideModal() {
    $('#popUp').modal('hide');//버튼용
}

$('#popUp').on('hidden.bs.modal', function (e) {
    history.pushState(null, null, baseUrl3 + '/index');
});

$('#popUp').on('shown.bs.modal', function (e) {
    $("#detail-map").css("width", $("#detail-map-area").width());
    map2.setSize(new naver.maps.Size($("#detail-map-area").width(), 280));
    map2.setCenter(new naver.maps.LatLng(currentData.latitude, currentData.longitude));

    if(Cookies.get('jwt') != null){
        $('#detail-follow').css("display", "flex");
    }
    else {
        $('#detail-follow').css("display", "none");
    }

});




