// 全局配置
var config = {
    is3D   : false, // 是否显示3D地图
    showCtl: true, // 是否显示控制工具
    zoom   : 16,
    center : [121.053822,31.109918], //朱家角
    // center : [120.48976236979166,30.7478857421875], //乌镇
    // center: [121.420106,31.256928], //品尊国际
    // center : [116.33719, 39.942384], //北京动物园
    style  : 'amap://styles/normal', //'amap://styles/062b35213e420b0f0d0c9fb6aed0cb8f',
             // 标准: normal, 幻影黑: dark, 月光银: light, 远山黛: whitesmoke, 草色青: fresh, 雅士灰: grey, 涂鸦: graffiti, 马卡龙: macaron, 靛青蓝: blue, 极夜蓝: darkblue, 酱籽: wine
    image  : {
        opacity: 0.5, // 0.3
        zooms: [0, 24] // [15, 18] 在哪些地图层级区间可见
    }
};

// 结果数据
var data = {
    "start": {
        "lng": 0,
        "lat": 0
    },
    "end"  : {
        "lng": 0,
        "lat": 0
    },
    image: '../img/cover.png' // 'http://amappc.cn-hangzhou.oss-pub.aliyun-inc.com/lbs/static/img/dongwuyuan.jpg'
};

// [浏览器辅助函数](https://lbs.amap.com/api/javascript-api/guide/utils/browser)

/*                             基础功能                                  */
var mapOptions = {
    mapStyle: config.style,
    //   mapStyle: 'amap://styles/062b35213e420b0f0d0c9fb6aed0cb8f',
    center:config.center, // 地图中心点
    resizeEnable: true,
    rotateEnable:true,
    pitchEnable:true,
    buildingAnimation:true,//楼块出现是否带动画
    showBuildingBlock:true,
    expandZoomRange:true,
    zooms:[3,20],
    zoom:config.zoom,
    pitch:50
};
if (config.is3D) { // 3D配置
    Object.assign(mapOptions, {
        rotation:-15,
        pitch:80,
        viewMode:'3D'
    });
}
var map = new AMap.Map('mapDiv', mapOptions);
if (config.showCtl) {
    map.addControl(new AMap.ControlBar({
        showZoomBar:false,
        showControlButton:true,
        position:{
        right:'10px',
        top:'10px'
        }
    }));

    AMap.plugin('AMap.Geolocation', function() {
        var geolocation = new AMap.Geolocation({
            enableHighAccuracy: true,//是否使用高精度定位，默认:true
            timeout: 10000,          //超过10秒后停止定位，默认：5s
            buttonPosition:'RB',    //定位按钮的停靠位置
            buttonOffset: new AMap.Pixel(10, 20),//定位按钮与设置的停靠位置的偏移量，默认：Pixel(10, 20); 当右上角时:Pixel(35, 110)
            zoomToAccuracy: true,   //定位成功后是否自动调整地图视野到定位点
            // buttonPosition: 'RT',//定位按钮的位置，默认RB /* LT LB RT RB */
        });
        map.addControl(geolocation);
        AMap.event.addListener(geolocation, 'complete', onComplete);
        AMap.event.addListener(geolocation, 'error', onError);
        // geolocation.getCurrentPosition(function(status,result){
        //     if(status=='complete'){
        //         onComplete(result)
        //     }else{
        //         onError(result)
        //     }
        // });
    });
} else {
    $(".amap-controls").css("display", "none");
}

//为地图注册click事件获取鼠标点击出的经纬度坐标
map.on('click', function(e) {
    addMarker(e);
    document.getElementById("lnglat").value = e.lnglat.getLng() + ',' + e.lnglat.getLat();
});

AMap.plugin('AMap.Autocomplete', function(){
    var autoComplete = new AMap.Autocomplete({
        input: "lnglat"
    });
    AMap.event.addListener(autoComplete, "select", function(e){
        if (e && e.poi && e.poi.location) {
            map.setZoom(18);
            map.setCenter(e.poi.location);
        }  
    });//注册监听，当选中某条记录时会触发
});

document.querySelector("#btn-query").onclick = function() {
    queryLatlng();
}

function queryLatlng() {
    var lnglat = document.getElementById("lnglat");
    query = lnglat.value;
    map.setZoom(18);
    if (query.includes(".")&&query.includes(",")) {
        query = query.split(',');
        var lng = query[0];
        var lat = query[1];
        map.setCenter([lng, lat]); 
    } else {
        AMap.plugin('AMap.PlaceSearch', function(){
            var autoOptions = {
            city: '全国'
            }
            var placeSearch = new AMap.PlaceSearch(autoOptions);
            placeSearch.search(query, function(status, result) {
                // console.log(result);
                if (result && result.poiList && result.poiList.pois) {
                    var location = result.poiList.pois[0];
                    if (location&&location.location){
                        map.setZoom(17);
                        map.setCenter(location.location);
                    }
                }
            });
        });
    }
}

//解析定位结果
function onComplete(data) {
    // document.getElementById('status').innerHTML='定位成功'
    var str = [];
    str.push('定位结果：' + data.position);
    str.push('定位类别：' + data.location_type);
    if(data.accuracy){
            str.push('精度：' + data.accuracy + ' 米');
    }//如为IP精确定位结果则没有精度信息
    str.push('是否经过偏移：' + (data.isConverted ? '是' : '否'));
    console.log( str.join('\r\n') );
}
//解析定位错误信息
function onError(data) {
    // document.getElementById('status').innerHTML='定位失败'
    console.log( '失败原因排查信息:'+data.message );
}

/*                             高级功能                                  */
var markers = [];
var i = 0; 
var overlayGroups;
/**
 * 添加Marker点位，放置图片
 * 在图片上右键可删除点位
 * 点击两个marker，即确定图片位置
 */
function addMarker(source) {
    var location = source.lnglat;
    if (markers && markers.length <= 1) {
        var marker = new AMap.Marker({
            id: "m" + i,
            position: new AMap.LngLat(location.lng, location.lat),
            draggable: true,
            icon: 'https://webapi.amap.com/theme/v1.3/markers/n/mark_b' + (i + 1) + '.png',
            extData: {
                id: i + 1
            }
        });
        
        marker.on('dragging', _.debounce(markerDragging, 15, false));
        // marker.on('dragend', function(e){
        //     markerDragging(e);
        // });
        i += 1;
        markers.push(marker);
        // 创建覆盖物群组，并将 marker 传给 OverlayGroup
        overlayGroups = new AMap.OverlayGroup(markers);
        map.add(overlayGroups);
        if (markers.length == 2) {
            refreshImg();
        }
    }
}
// 拖拽点位
function markerDragging(e) {
    // console.log(e);
    if (e && e.target && e.target.B &&  e.target.B.id && e.lnglat && markers && markers.length == 2) {
        if (e.target.B.id == 'm0') {
            markers[0].B.position = e.lnglat;
        }
        if (e.target.B.id == 'm1') {
            markers[1].B.position = e.lnglat;
        }
        refreshImg();
    }
};

var imageLayer = null;
// 重置图片
function refreshImg() {
    if (imageLayer!=null) imageLayer.setMap(null);
    if (markers[0] == null || markers[1] == null) return;
    if (markers[0].B == null || markers[1].B == null) return;
    if (markers[0].B.position == null || markers[1].B.position == null) return;
    var southWestLat = markers[0].B.position.lat;
    var northEastLat = markers[1].B.position.lat;
    if (southWestLat && northEastLat && southWestLat > northEastLat) {
        southWestLat = markers[1].B.position.lat;
        northEastLat = markers[0].B.position.lat;
    } 
    var southWestLng = markers[0].B.position.lng;
    var northEastLng = markers[1].B.position.lng; 
    if (southWestLng && northEastLng && southWestLng > northEastLng) {
        southWestLng = markers[1].B.position.lng;
        northEastLng = markers[0].B.position.lng;
    }
    data.start = {
        lng: southWestLng,
        lat: southWestLat
    };
    data.end   = {
        lng: northEastLng,
        lat: northEastLat
    };
    console.log(data);
    if (southWestLng && northEastLng && southWestLat && northEastLat) {
        var southWest = new AMap.LngLat(southWestLng, southWestLat);
        var northEast = new AMap.LngLat(northEastLng, northEastLat);
        var bounds = new AMap.Bounds(southWest, northEast);
        imageLayer = new AMap.ImageLayer({
            url: data.image,
            opacity: config.image.opacity,
            zooms: config.image.zooms
            
        });
        imageLayer.setBounds(bounds);
        imageLayer.setMap(map);
    }
}

// 获取图片本地路径
function previewHandle(fileDOM) {
    map.remove(markers);
    markers = [];
    i = 0; 
    if (imageLayer!=null) imageLayer.setMap(null);
    var file = fileDOM.files[0], // 获取文件
        imageType = /^image\//,
        reader = '';
 
    // 文件是否为图片
    if (!imageType.test(file.type)) {
        alert("请选择图片！");
        return;
    }
    // 判断是否支持FileReader    
    if (window.FileReader) {
        reader = new FileReader();
    }
    // IE9及以下不支持FileReader
    else {
        alert("您的浏览器不支持图片预览功能，如需该功能请升级您的浏览器！");
        return;
    }
    // 读取完成    
    reader.onload = function (event) {
        // 图片路径设置为读取的图片    
        data.image = event.target.result;
    };
    reader.readAsDataURL(file);
}

//创建右键菜单
var contextMenu = new AMap.ContextMenu();

//右键放大
contextMenu.addItem("删除图片", function () {
    map.remove(markers);
    markers = [];
    i = 0;
    if (imageLayer!=null) imageLayer.setMap(null);
}, 0);

map.on('rightclick', function (e) {
    if (imageLayer!=null) {
        contextMenu.open(map, e.lnglat);
    }
});

$(function(){
    $.edit.fileBrowser("#img_url", "#img_urlTxt", "#img_urlDiv");

});