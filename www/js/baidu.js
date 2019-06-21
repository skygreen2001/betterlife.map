// 全局配置
var config = {
    at     : '44dc0c91a39640a1216f4e23913854b6',
    is3D   : false, // 是否显示3D地图
    showCtl: false, // 是否显示控制工具
    zoom   : 18,
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
    image: '../img/cover.png'
};

//百度地图API功能
function loadJScript() {
    var script = document.createElement("script");
    script.type = "text/javascript";
    script.src = "http://api.map.baidu.com/api?v=2.0&ak=" + config.at + "&callback=init";
    document.body.appendChild(script);
}

window.onload = loadJScript;  //异步加载地图

var map;
function init() {
    map = new BMap.Map("allmap");            // 创建Map实例
    var point = new BMap.Point(config.center[0], config.center[1]); // 创建点坐标
    map.centerAndZoom(point, config.zoom);
    map.enableScrollWheelZoom(true);     //开启鼠标滚轮缩放
    if (config.showCtl) {
        addControl(map);
    }

    autoComplete(map);
         
	//单击获取点击的经纬度
	map.addEventListener("click",function(e){
		// console.log(e.point.lng + "," + e.point.lat);
        addMarker(e);
        document.getElementById("lnglat").value =e.point.lng + ',' + e.point.lat;
	});

    contextMenu();
    
}

/**
 * 添加地图控件
 * @param {*} map 地图
 */
function addControl(map) {
    var top_left_control = new BMap.ScaleControl({anchor: BMAP_ANCHOR_BOTTOM_LEFT});// 添加比例尺; 左上角: BMAP_ANCHOR_TOP_LEFT
    var top_left_navigation = new BMap.NavigationControl({
        // LARGE类型
        type: BMAP_NAVIGATION_CONTROL_LARGE,
        // 启用显示定位
        enableGeolocation: true,
        // 靠左上角位置
        anchor: BMAP_ANCHOR_TOP_LEFT,
    });
    //左上角，添加默认缩放平移控件
    // var top_right_navigation = new BMap.NavigationControl({anchor: BMAP_ANCHOR_TOP_RIGHT, type: BMAP_NAVIGATION_CONTROL_SMALL}); //右上角，仅包含平移和缩放按钮
    /*缩放控件type有四种类型:
    BMAP_NAVIGATION_CONTROL_SMALL：仅包含平移和缩放按钮；BMAP_NAVIGATION_CONTROL_PAN:仅包含平移按钮；BMAP_NAVIGATION_CONTROL_ZOOM：仅包含缩放按钮*/
    map.addControl(top_left_control);
    map.addControl(top_left_navigation);
    // map.addControl(top_right_navigation);
    // //添加地图类型控件
    // map.addControl(new BMap.MapTypeControl({
    //     mapTypes:[
    //         BMAP_NORMAL_MAP,
    //         BMAP_HYBRID_MAP
    //     ]})
    // );
    
    // 添加定位控件
    var geolocationControl = new BMap.GeolocationControl();
    geolocationControl.addEventListener("locationSuccess", function(e){
        // 定位成功事件
        var address = '';
        address += e.addressComponent.province;
        address += e.addressComponent.city;
        address += e.addressComponent.district;
        address += e.addressComponent.street;
        address += e.addressComponent.streetNumber;
        console.log(e);
        console.log("当前定位地址为：" + address);
    });
    geolocationControl.addEventListener("locationError",function(e){
        console.log(e);
        // 定位失败事件
        console.log(e.message);
    });
    map.addControl(geolocationControl); 
}

function autoComplete(map) {
    var ac = new BMap.Autocomplete({    //建立一个自动完成的对象
        "input" : "lnglat"
        ,"location" : map
        ,"onSearchComplete": function(data) {
            // console.log(data);
            if ($.isNumeric(data.keyword)) {
                ac.hide();
            }
        }
    });

    ac.addEventListener("onhighlight", function(e) {  //鼠标放在下拉列表上的事件
        var str = "";
        var _value = e.fromitem.value;
        var value = "";
        if (e.fromitem.index > -1) {
            value = _value.province +  _value.city +  _value.district +  _value.street +  _value.business;
        }    
        str = "FromItem<br />index = " + e.fromitem.index + "<br />value = " + value;
        
        value = "";
        if (e.toitem.index > -1) {
            _value = e.toitem.value;
            value = _value.province +  _value.city +  _value.district +  _value.street +  _value.business;
        }    
        str += "<br />ToItem<br />index = " + e.toitem.index + "<br />value = " + value;
        document.getElementById("searchResultPanel").innerHTML = str;
    });

    ac.addEventListener("onconfirm", function(e) {    //鼠标点击下拉列表后的事件
        var _value = e.item.value;
        var query = _value.province +  _value.city +  _value.district +  _value.street +  _value.business;
        document.getElementById("searchResultPanel").innerHTML ="onconfirm<br />index = " + e.item.index + "<br />myValue = " + query;
        setPlace(query);
    });
}

document.querySelector("#btn-query").onclick = function() {
    queryLatlng();
}

function setPlace(query) {
    map.clearOverlays();    //清除地图上所有覆盖物
    function myFun(){
        var pp = local.getResults().getPoi(0).point;    //获取第一个智能搜索的结果
        map.centerAndZoom(pp, 18);
        map.addOverlay(new BMap.Marker(pp));    //添加标注
    }
    var local = new BMap.LocalSearch(map, { //智能搜索
        onSearchComplete: myFun
    });
    local.search(query);
}

function queryLatlng() {
    var lnglat = document.getElementById("lnglat");
    query = lnglat.value;
    map.setZoom(18);
    if (query.includes(".")&&query.includes(",")) {
        query = query.split(',');
        var lng = query[0];
        var lat = query[1];
        var point = new BMap.Point(config.center[0], config.center[1]); 
        map.centerAndZoom(point, config.zoom); 
    } else {
        setPlace(query);
    }
}
/*                             高级功能                                  */
var markers = [];
var i = 0; 
/**
 * 添加Marker点位，放置图片
 * 在图片上右键可删除点位
 * 点击两个marker，即确定图片位置
 */
function addMarker(source) {
    var location = source.point;
    if (markers && markers.length <= 1) {
        var point = new BMap.Point(location.lng, location.lat);
        var marker = new BMap.Marker(point, {"raiseOnDrag": true, id: "m" + i});
        map.addOverlay(marker);
        marker.enableDragging();
        marker.setTitle("m" + i);
        // marker.addEventListener("dragging", _.debounce(markerDragging, 15, false));
        marker.addEventListener("dragging", markerDragging);
        // marker.addEventListener("dragend", markerDragging);

        i += 1;
        markers.push(marker);
        if (markers.length == 2) {
            refreshImg();
        }
    }
}
// 拖拽点位
function markerDragging(e) {
    // console.log(e);
    if (e && e.point && markers && markers.length == 2) {
        if (e.target.z.title == 'm0') {
            markers[0].point = e.point;
        }
        if (e.target.z.title == 'm1') {
            markers[1].point = e.point;
        }
        refreshImg();
    }
};

var groundOverlay = null;
// 重置图片
function refreshImg() {
    // 移除GroundOverlay
    if (groundOverlay!=null) map.removeOverlay(groundOverlay);
    if (markers[0] == null || markers[1] == null) return;
    if (markers[0].point == null || markers[1].point == null) return;
    var southWestLat = markers[0].point.lat;
    var northEastLat = markers[1].point.lat;
    if (southWestLat && northEastLat && southWestLat > northEastLat) {
        southWestLat = markers[1].point.lat;
        northEastLat = markers[0].point.lat;
    } 
    var southWestLng = markers[0].point.lng;
    var northEastLng = markers[1].point.lng; 
    if (southWestLng && northEastLng && southWestLng > northEastLng) {
        southWestLng = markers[1].point.lng;
        northEastLng = markers[0].point.lng;
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

        // 西南角和东北角
        var SW = new BMap.Point(southWestLng, southWestLat);
        var NE = new BMap.Point(northEastLng, northEastLat);

        groundOverlayOptions = {
            opacity: config.image.opacity,
            displayOnMinLevel: config.image.zooms[0],
            displayOnMaxLevel: config.image.zooms[1]
        }

        // 初始化GroundOverlay
        groundOverlay = new BMap.GroundOverlay(new BMap.Bounds(SW, NE), groundOverlayOptions);
        // 设置GroundOverlay的图片地址
        groundOverlay.setImageURL(data.image);
        
        // 添加GroundOverlay
        map.addOverlay(groundOverlay);
    }
}

// 获取图片本地路径
function previewHandle(fileDOM) {
    map.clearOverlays();
    markers = [];
    i = 0; 
    if (groundOverlay!=null) map.removeOverlay(groundOverlay);
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

function contextMenu() {
    //创建右键菜单
    var contextMenu = new BMap.ContextMenu();

    //右键放大
    contextMenu.addItem(new BMap.MenuItem("删除图片", function () {
        markers = [];
        i = 0;
        if (groundOverlay!=null) map.removeOverlay(groundOverlay);
        map.clearOverlays();
    }, 0));
    map.addContextMenu(contextMenu);
    // groundOverlay.addContextMenu(contextMenu);
}

$(function(){
    $.edit.fileBrowser("#img_url", "#img_urlTxt", "#img_urlDiv");
    $(".tangram-suggestion-main").css({"top":"auto", "bottom": "55px"});
});