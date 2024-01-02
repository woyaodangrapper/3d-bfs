/*!
 * Taoist JavaScript Library v0.0.1
 * Date: 20211025
 */
(function (global, factory) {
  "use strict";
  if (typeof module === "object" && typeof module.exports === "object") {
    module.exports = global.document
      ? factory(global, true)
      : function (w) {
          if (!w.document) {
            throw new Error("requires a window with a document");
          }
          return factory(w);
        };
  } else {
    factory(global);
  }

  // Pass this if window is not defined yet
})(typeof window !== "undefined" ? window : this, function (window, noGlobal) {
  //球体自转 事件
  var multiplier = 200; //球体旋转速度
  var previousTime; //球体时间 与旋转速度相关 与日照相关
  //定义GIS对象
  var version = "0.0.1",
    // Define a local copy of Taoist
    Taoist = function () {
      // return Taoist.fn
      return new Taoist.fn.init();
    };
  Taoist.fn = Taoist.prototype = {
    Taoist: version,
    constructor: Taoist,
    create3D: function (Cesium) {
      return Taoist.create3D(options, Cesium);
    },
    BaseLayer: function (viewer, options) {
      return Taoist.BaseLayer(viewer, options);
    },
    Open: function (gear, event) {
      return Taoist.Open(gear, event);
    },
    //遍历器
    each: function (fn) {
      var length = this.length;
      for (var i = 0; i < length; i++) {
        fn.call(this[i], i, this[i]);
      }
      return this;
    },
    size: function () {
      //原型方法
      return this.length;
    },
  };
  Object.defineProperties(Taoist, {
    viewer: {
      get: function () {
        return this._viewer;
      },
      set: function (e) {
        this._viewer = e;
      },
    },
  });

  Taoist.extend = Taoist.fn.extend = function (obj) {
    //obj是传递过来扩展到this上的对象
    var target = this;
    for (var name in obj) {
      //name为对象属性
      //copy为属性值
      copy = obj[name];
      //防止循环调用
      if (target === copy) continue;
      //防止附加未定义值
      if (typeof copy === "undefined") continue;
      //赋值
      target[name] = copy;
    }
    return target;
  };

  // 定义构造函数
  var init = (Taoist.fn.init = function () {
    return this;
  });
  // 使用构造函数的原型扩张css和html方法
  init.prototype = Taoist.fn;

  /**
   * 接收Iframe上层信息触发相应动作
   */
  Taoist.Open = function (gear, event) {
    //触发器
    window.addEventListener(
      "message",
      function (e) {
        // 我们能信任信息来源吗？
        // if (event.origin !== "http://example.com:8080")
        //     return;
        console.log("map", e.data);

        if ((e.data, Object.getPrototypeOf(gear)[e.data.event] !== undefined)) {
          if (event) {
            //回调函数
            event(e.data);
          }

          var eva = gear[e.data.event](e.data.value);
          if (eva != null) {
            if (eva.constructor === Object) {
              window.parent.postMessage(eva, "*");
            }
            console.log("回参", eva);
          }
        }
      },
      false
    );
  };
  /**
   * 发送消息给Iframe上层
   * @param {String} message
   */
  Taoist.fn.Message = Taoist.ExternalMessage = async function (message) {
    window.parent.postMessage(message, "*");
  };
  /**
   * 创建一个地球
   * @param {Object} Cesium
   * @param {Object} options
   * @returns viewer
   */
  Taoist.create3D = function (options, Cesium) {
    Cesium.Ion.defaultAccessToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJiNGZiOTc1NS0zZmZlLTQ4MzUtODFlMS00ZDI2NWE5YTFkZjIiLCJpZCI6MTgwMDUsInNjb3BlcyI6WyJhc3IiLCJnYyJdLCJpYXQiOjE1NzMxMTcwODd9.WPytI-wsAoBmC7NLmz01l0GcYoh3bvTES7z1yZQgGMM";

    //初始化部分参数 如果没有就默认设为false;
    var args = ["geocoder", "homeButton", "sceneModePicker", "baseLayerPicker", "navigationHelpButton", "animation", "timeLine", "fullscreenButton", "vrButton", "infoBox", "selectionIndicator", "shadows"];
    for (var i = 0; i < args.length; i++) {
      if (!options[args[i]]) {
        options[args[i]] = false;
      }
    }
    options["shouldAnimate"] = true; //飞行漫游启动 viewer动画效果
    var container = options["id"];
    //创建viewer
    var viewer = new Cesium.Viewer(container, options);
    /**对Cesium的改造 *******************************************************************/
    //隐藏Cesium原有的一些控件，默认只剩一个球
    _hideCesiumElement();

    //设置鼠标的样式，在使用滚轮及右键对地球缩放或旋转时在鼠标位置添加一个图标
    _setMouseStyle(viewer, container);

    //解决限定相机进入地下
    viewer.camera.changed.addEventListener(function () {
      if (viewer.camera._suspendTerrainAdjustment && viewer.scene.mode === Cesium.SceneMode.SCENE3D) {
        viewer.camera._suspendTerrainAdjustment = false;
        viewer.camera._adjustHeightForTerrain();
      }
    });

    viewer.scene.globe.depthTestAgainstTerrain = true;
    //开启hdr
    viewer.scene.highDynamicRange = true;

    viewer.scene.globe.enableLighting = true;

    // 分辨率调整函数
    if (Cesium.FeatureDetection.supportsImageRenderingPixelated()) {
      //判断是否支持图像渲染像素化处理
      viewer.resolutionScale = window.devicePixelRatio;
    }
    //是否开启抗锯齿
    viewer.scene.fxaa = true;
    viewer.scene.postProcessStages.fxaa.enabled = true;
    var supportsImageRenderingPixelated = viewer.cesiumWidget._supportsImageRenderingPixelated;
    if (supportsImageRenderingPixelated) {
      var vtxf_dpr = window.devicePixelRatio;
      while (vtxf_dpr >= 2.0) {
        vtxf_dpr /= 2.0;
      }
      viewer.resolutionScale = vtxf_dpr;
    }

    viewer.scene.fog.enabled = true; //雾
    viewer.scene.globe.enableLighting = true; //照明

    //移除默认的bing影像图层
    viewer.imageryLayers.removeAll();
    viewer.clock.currentTime = Cesium.JulianDate.fromDate(new Date());

    //是否关闭大气效果
    if (options.showGroundAtmosphere && options.showGroundAtmosphere == true) {
      viewer.scene.globe.showGroundAtmosphere = true;
    } else {
      viewer.scene.globe.showGroundAtmosphere = false;
    }

    /************************Debug模式 */
    //debug模式，显示实时帧率
    if (options.debug) {
      viewer.scene.debugShowFramesPerSecond = true;
    }

    viewer.config = options;

    /************************回调函数 */
    //加载成功后回调函数
    if (options.success) {
      options.success(viewer);
    }

    return viewer;
  };
  //底部隐藏
  function _hideCesiumElement() {
    const array = ["cesium-viewer-toolbar", "cesium-viewer-animationContainer", "cesium-viewer-timelineContainer", "cesium-viewer-bottom"];
    for (let index = 0; index < array.length; index++) {
      const element = array[index];
      if (document.getElementsByClassName(element).length >= 1) {
        // HTMLElement Element
        let objs = document.getElementsByClassName(element);
        for (let index = 0; index < objs.length; index++) {
          objs[index].style.visibility = "hidden";
        }
      }
    }
  }
  //设置鼠标的样式
  function _setMouseStyle(viewer, container) {
    //修改视图默认鼠标操作方式
    viewer.scene.screenSpaceCameraController.zoomEventTypes = [Cesium.CameraEventType.WHEEL, Cesium.CameraEventType.PINCH];
    viewer.scene.screenSpaceCameraController.tiltEventTypes = [Cesium.CameraEventType.MIDDLE_DRAG, Cesium.CameraEventType.PINCH, Cesium.CameraEventType.RIGHT_DRAG];
    // document.body.appendChild( renderer.domElement );

    let buff = document.createElement("div");
    let buff_1 = document.createElement("div");
    buff.setAttribute("class", "cesium-mousezoom");
    buff_1.setAttribute("class", "zoomimg");
    buff.appendChild(buff_1);
    document.getElementById(container).appendChild(buff);
    var handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);

    function getMousezoomElement() {
      if (document.getElementsByClassName("cesium-mousezoom").length >= 1) {
        // HTMLElement Element
        let objs = document.getElementsByClassName("cesium-mousezoom");
        for (let index = 0; index < objs.length; index++) {
          let Element = objs[index];
          return Element;
        }
      }
      return undefined;
    }
    //按住鼠标右键
    handler.setInputAction(function (event) {
      handler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
      let element = getMousezoomElement();
      if (element) {
        element.style.top = event.position.y + "px";
        element.style.left = event.position.x + "px";
        element.className = "cesium-mousezoom cesium-mousezoom-visible";
      }
    }, Cesium.ScreenSpaceEventType.RIGHT_DOWN);
    //抬起鼠标右键
    handler.setInputAction(function (event) {
      let element = getMousezoomElement();
      handler.setInputAction(function (evnet) {
        if (element) {
          element.style.top = evnet.endPosition.y + "px";
          element.style.left = evnet.endPosition.x + "px";
        }
      }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
      element.className = "cesium-mousezoom";
    }, Cesium.ScreenSpaceEventType.RIGHT_UP);

    //按住鼠标中键
    handler.setInputAction(function (event) {
      handler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
      let element = getMousezoomElement();
      if (element) {
        element.style.top = event.position.y + "px";
        element.style.left = event.position.x + "px";
        element.className = "cesium-mousezoom cesium-mousezoom-visible";
      }
    }, Cesium.ScreenSpaceEventType.MIDDLE_DOWN);
    //抬起鼠标中键
    handler.setInputAction(function (event) {
      let element = getMousezoomElement();
      handler.setInputAction(function (evnet) {
        if (element) {
          element.style.top = evnet.endPosition.y + "px";
          element.style.left = evnet.endPosition.x + "px";
        }
      }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
      element.className = "cesium-mousezoom";
    }, Cesium.ScreenSpaceEventType.MIDDLE_UP);

    //滚轮滚动
    handler.setInputAction(function (evnet) {
      let element = getMousezoomElement();
      handler.setInputAction(function (evnet) {
        if (element) {
          element.style.top = evnet.endPosition.y + "px";
          element.style.left = evnet.endPosition.x + "px";
        }
      }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
      element.className = "cesium-mousezoom cesium-mousezoom-visible";
      setTimeout(function () {
        element.className = "cesium-mousezoom";
      }, 200);
    }, Cesium.ScreenSpaceEventType.WHEEL);
  }

  /**
   * 添加地图底图图层
   * @param {Object} viewer
   * @param {Object} options
   */
  Taoist.BaseLayer = (viewer, options) => {
    var imageryProvider = createImageryProvider(options);
    var imageryOption = {
      show: true,
      alpha: this._opacity,
    };
    if (options.rectangle && options.rectangle.xmin && options.rectangle.xmax && options.rectangle.ymin && options.rectangle.ymax) {
      var xmin = options.rectangle.xmin;
      var xmax = options.rectangle.xmax;
      var ymin = options.rectangle.ymin;
      var ymax = options.rectangle.ymax;
      var rectangle = Cesium.Rectangle.fromDegrees(xmin, ymin, xmax, ymax);
      this.rectangle = rectangle;
      imageryOption.rectangle = rectangle;
    }
    if (options.brightness) imageryOption.brightness = options.brightness;
    if (options.minimumTerrainLevel) imageryOption.minimumTerrainLevel = options.minimumTerrainLevel;
    if (options.maximumTerrainLevel) imageryOption.maximumTerrainLevel = options.maximumTerrainLevel;
    var layer = new Cesium.ImageryLayer(imageryProvider, imageryOption);
    layer.config = options;

    viewer.imageryLayers.add(layer);
    return layer;
  };
  /**
   * 添加地图底图图层
   * @param {Object} config
   */
  //创建地图底图
  function createImageryProvider(config) {
    var options = {};
    for (var key in config) {
      var value = config[key];
      if (value == null) return;

      switch (key) {
        case "crs":
          if (value == "4326" || value.toUpperCase() == "EPSG4326") {
            options.tilingScheme = new Cesium.GeographicTilingScheme({
              numberOfLevelZeroTilesX: config.numberOfLevelZeroTilesX || 2,
              numberOfLevelZeroTilesY: config.numberOfLevelZeroTilesY || 1,
            });
          } else {
            options.tilingScheme = new Cesium.WebMercatorTilingScheme({
              numberOfLevelZeroTilesX: config.numberOfLevelZeroTilesX || 2,
              numberOfLevelZeroTilesY: config.numberOfLevelZeroTilesY || 1,
            });
          }
          break;
        case "rectangle":
          options.rectangle = Cesium.Rectangle.fromDegrees(value.xmin, value.ymin, value.xmax, value.ymax);
          break;
        default:
          options[key] = value;
          break;
      }
    }

    if (options.proxy) {
      options.url = new Cesium.Resource({
        url: options.url,
        proxy: options.proxy,
      });
    }
    var layer;
    switch (options.type) {
      case "image":
        layer = new Cesium.SingleTileImageryProvider(options);
        break;
      case "xyz":
      case "tile":
        options.customTags = {
          "z&1": function z1(imageryProvider, x, y, level) {
            return level + 1;
          },
        };
        layer = new Cesium.UrlTemplateImageryProvider(options);
        break;
      case "wms":
        layer = new Cesium.WebMapServiceImageryProvider(options);
        break;
      case "wmts":
        layer = new Cesium.WebMapTileServiceImageryProvider(options);
        break;
      case "arcgis":
      case "arcgis_tile":
      case "arcgis_dynamic":
        layer = new Cesium.ArcGisMapServerImageryProvider(options);
        break;
      case "arcgis_cache":
        if (!Cesium.UrlTemplateImageryProvider.padLeft0) {
          Cesium.UrlTemplateImageryProvider.padLeft0 = function (numStr, n) {
            numStr = String(numStr);
            var len = numStr.length;
            while (len < n) {
              numStr = "0" + numStr;
              len++;
            }
            return numStr;
          };
        }
        options.customTags = {
          //小写
          arc_x: function arc_x(imageryProvider, x, y, level) {
            return imageryProvider.padLeft0(x.toString(16), 8);
          },
          arc_y: function arc_y(imageryProvider, x, y, level) {
            return imageryProvider.padLeft0(y.toString(16), 8);
          },
          arc_z: function arc_z(imageryProvider, x, y, level) {
            return imageryProvider.padLeft0(level.toString(), 2);
          },
          //大写
          arc_X: function arc_X(imageryProvider, x, y, level) {
            return imageryProvider.padLeft0(x.toString(16), 8).toUpperCase();
          },
          arc_Y: function arc_Y(imageryProvider, x, y, level) {
            return imageryProvider.padLeft0(y.toString(16), 8).toUpperCase();
          },
          arc_Z: function arc_Z(imageryProvider, x, y, level) {
            return imageryProvider.padLeft0(level.toString(), 2).toUpperCase();
          },
        };
        layer = new Cesium.UrlTemplateImageryProvider(options);
        break;
      case "www_gaode":
        //高德
        var _url;
        switch (options.layer) {
          case "vec":
          default:
            //style=7是立体的，style=8是灰色平面的
            _url = "http://" + (options.bigfont ? "wprd" : "webrd") + "0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=7&x={x}&y={y}&z={z}";
            break;
          case "img_d":
            _url = "http://webst0{s}.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}";
            break;
          case "img_z":
            _url = "http://webst0{s}.is.autonavi.com/appmaptile?x={x}&y={y}&z={z}&lang=zh_cn&size=1&scale=1&style=8";
            break;
          case "time":
            var time = new Date().getTime();
            _url = "http://tm.amap.com/trafficengine/mapabc/traffictile?v=1.0&;t=1&x={x}&y={y}&z={z}&&t=" + time;
            break;
        }

        layer = new Cesium.UrlTemplateImageryProvider({
          url: options.proxy ? new Cesium.Resource({ url: _url, proxy: options.proxy }) : _url,
          subdomains: ["1", "2", "3", "4"],
          maximumLevel: 18,
        });
        break;
      case "www_google":
        //谷歌国内
        var _url;

        if (config.crs == "4326" || config.crs == "wgs84") {
          //wgs84   无偏移
          switch (options.layer) {
            default:
            case "img_d":
              _url = "http://www.google.cn/maps/vt?lyrs=s&x={x}&y={y}&z={z}";
              break;
          }
        } else {
          //有偏移
          switch (options.layer) {
            case "vec":
            default:
              _url = "http://mt{s}.google.cn/vt/lyrs=m@207000000&hl=zh-CN&gl=CN&src=app&x={x}&y={y}&z={z}&s=Galile";
              break;
            case "img_d":
              _url = "http://mt{s}.google.cn/vt/lyrs=s&hl=zh-CN&gl=CN&x={x}&y={y}&z={z}&s=Gali";
              break;
            case "img_z":
              _url = "http://mt{s}.google.cn/vt/imgtp=png32&lyrs=h@207000000&hl=zh-CN&gl=cn&x={x}&y={y}&z={z}&s=Galil";
              break;
            case "ter":
              _url = "http://mt{s}.google.cn/vt/lyrs=t@131,r@227000000&hl=zh-CN&gl=cn&x={x}&y={y}&z={z}&s=Galile";
              break;
          }
        }

        layer = new Cesium.UrlTemplateImageryProvider({
          url: options.proxy ? new Cesium.Resource({ url: _url, proxy: options.proxy }) : _url,
          subdomains: ["1", "2", "3"],
          maximumLevel: 20,
        });
        break;
      case "www_osm":
        //OSM开源地图
        var _url = "http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
        layer = new Cesium.UrlTemplateImageryProvider({
          url: options.proxy ? new Cesium.Resource({ url: _url, proxy: options.proxy }) : _url,
          subdomains: "abc",
          maximumLevel: 18,
        });
        break;
      case "www_geoq":
        //智图开源地图
        var _url = "https://map.geoq.cn/ArcGIS/rest/services/ChinaOnlineCommunity/MapServer/tile/{z}/{y}/{x}";
        layer = new Cesium.UrlTemplateImageryProvider({
          url: options.proxy ? new Cesium.Resource({ url: _url, proxy: options.proxy }) : _url,
          subdomains: "abc",
          maximumLevel: 18,
        });
        break;
      case "thematic_geoq":
        //智图水系开源地图
        var _url = "http://thematic.geoq.cn/arcgis/rest/services/ThematicMaps/WorldHydroMap/MapServer/tile/{z}/{y}/{x}";
        layer = new Cesium.UrlTemplateImageryProvider({
          url: options.proxy ? new Cesium.Resource({ url: _url, proxy: options.proxy }) : _url,
          subdomains: "abc",
          maximumLevel: 18,
        });
      case "sl_geoq":
        //智图深蓝开源地图
        var _url = "https://map.geoq.cn/ArcGIS/rest/services/ChinaOnlineStreetPurplishBlue/MapServer/tile/{z}/{y}/{x}";
        layer = new Cesium.UrlTemplateImageryProvider({
          url: options.proxy ? new Cesium.Resource({ url: _url, proxy: options.proxy }) : _url,
          subdomains: "abc",
          maximumLevel: 18,
        });
        break;
      case "local":
        //本地
        var _url = options.url + "/{z}/{y}/{x}.png";
        layer = new Cesium.UrlTemplateImageryProvider({
          url: options.proxy ? new Cesium.Resource({ url: _url, proxy: options.proxy }) : _url,
          subdomains: "abc",
          maximumLevel: 18,
        });
        break;
      case "tdt":
        //天地图
        var _url;
        // 添加mapbox自定义地图实例 mapbox://styles/1365508153/ckmy004lc1bsj17n94k80cfik
        switch (options.layer) {
          case "satellite":
            break;
          case "navigation":
            _url = "https://services.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
            break;
          case "blue":
            // _url = "http://services.arcgisonline.com/arcgis/rest/services/Canvas/World_Dark_Gray_Base/MapServer?tk=d97070ed5b0f397ed2dd8317bcbb486d";
            _url = "http://services.arcgisonline.com/arcgis/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}";
            break;
          case "terrain":
            break;
        }

        layer = new Cesium.UrlTemplateImageryProvider({
          url: _url,
          subdomains: "abc",
          maximumLevel: 18,
        });
        break;
      case "mapbox":
        //mapboxgl的底图
        var style;
        // 添加mapbox自定义地图实例 mapbox://styles/1365508153/ckmy004lc1bsj17n94k80cfik
        var config = {
          url: "https://api.mapbox.com/styles/v1",
          username: "1365508153",
          styleId: style,
          accessToken: "pk.eyJ1IjoiMTM2NTUwODE1MyIsImEiOiJja214ejg5ZWMwZGhqMnJxa3F3MjVuaTJqIn0.ERt-vJ_qoD10EP5CvwsEzQ",
          scaleFactor: true,
        };
        switch (options.layer) {
          case "satellite":
            style = "ckmy0yizu18bx17pdcfh81ikn";
            break;
          case "navigation":
            style = "ckmy0li0j1cd717la2xd0mamg";
            break;
          case "blue":
            style = "ckmy004lc1bsj17n94k80cfik";
            break;
          case "terrain":
            style = "ckn9dnm5b2m9a17o0nijfqbl3";
          default:
            config.styleId = options.layer;
            config.accessToken = options.accessToken;
            config.username = options.username;
            break;
        }
        config.styleId = style;
        var layer = new Cesium.MapboxStyleImageryProvider(config);
        break;
    }
    layer.config = options;
    layer.brightness = options.brightness;
    return layer;
  }
  /**
   * 隐藏指定的底图图层
   * @param {Object} viewer
   * @param {Object} layer (图层名字或图层对象)
   */
  Taoist.BaseLayer.hide = Taoist.hideBaseLayer = (viewer, layer) => {
    if (layer instanceof Cesium.ImageryLayer) {
      layer.show = false;
    } else {
      for (var i = 0; i < viewer.imageryLayers.length; i++) {
        var name = viewer.imageryLayers.get(i).config.name;
        if (name == layer) {
          viewer.imageryLayers.get(i).show = false;
        }
      }
    }
  };
  /**
   * 显示指定的底图图层
   * @param viewer
   * @param layer (图层名字或图层对象)
   */
  Taoist.BaseLayer.show = Taoist.BaseLayer.showBaseLayer = (viewer, layer) => {
    if (layer instanceof Cesium.ImageryLayer) {
      layer.show = true;
    } else {
      for (var i = 0; i < viewer.imageryLayers.length; i++) {
        var name = viewer.imageryLayers.get(i).config.name;
        if (name == layer) {
          viewer.imageryLayers.get(i).show = true;
        }
      }
    }
  };
  /**
   * 移除指定的底图图层
   * @param {Object} viewer
   * @param {Object} layer (图层名字或图层对象)
   */
  Taoist.BaseLayer.remove = Taoist.removeBaseLayer = (viewer, layer) => {
    if (layer instanceof Cesium.ImageryLayer) {
      viewer.imageryLayers.remove(layer);
    } else {
      for (var i = 0; i < viewer.imageryLayers.length; i++) {
        var name = viewer.imageryLayers.get(i).config.name;
        if (name == layer) {
          viewer.imageryLayers.remove(viewer.imageryLayers.get(i));
        }
      }
    }
  };

  /**
   * 批量添加czml模型
   * @param {Object} viewer
   * @param {Object} options (图层名字或图层对象)
   */
  Taoist.CZMLModels = function (viewer, options) {
    var models = [];
    options.ts.forEach(element => {
      var czml = [
        {
          id: "document",
          name: "CZML Model",
          version: "1.0",
        },
        {
          id: element.id,
          name: "Cesium Air",
          position: {
            cartographicDegrees: [element.x, element.y, element.z],
          },
          model: {
            gltf: element.url,
            scale: element.scale,
            //minimumPixelSize: 128,
          },
        },
      ];

      var dataSourcePromise = viewer.dataSources.add(Cesium.CzmlDataSource.load(czml));

      // var modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(
      //     Cesium.Cartesian3.fromDegrees(element.x , element.y, element.z));
      // var model = viewer.scene.primitives.add(Cesium.Model.fromGltf({
      //     id :element.id,
      //     url: element.url,
      //     modelMatrix: modelMatrix,
      //     scale: element.scale
      // }));
      models.push(dataSourcePromise);
    });
    return models;
  };

  /**
   * 添加Gltf
   * @param {Object} viewer
   * @param {Object} options (坐标参数，模型地址及，模型朝向)
   */
  Taoist.aGLTF = function (viewer, options) {
    var model;
    if (options instanceof Cesium.Model) {
      //typeof
      model = viewer.scene.primitives.add(options);
      return model;
    } else if (!options.url) {
      return;
    }
    model = viewer.scene.primitives.add(
      Cesium.Model.fromGltf({
        url: options.url,
        modelMatrix: Cesium.Transforms.headingPitchRollToFixedFrame(
          Cesium.Cartesian3.fromDegrees(options.position.x, options.position.y, options.position.z),
          new Cesium.HeadingPitchRoll(Cesium.Math.toRadians(options.position.h ?? 0), Cesium.Math.toRadians(options.position.p ?? 0), Cesium.Math.toRadians(options.position.r ?? 0)),
          Cesium.Ellipsoid.WGS84,
          Cesium.Transforms.localFrameToFixedFrameGenerator("north", "west")
        ),
        scale: options.scale ?? 1,
      })
    );
    model.object = options;
    return model;
  };

  Taoist.scene = {};

  //销毁所有类型未命名的scene
  Taoist.scene.Release = viewer => {
    for (var i = 0; i < viewer.scene.primitives.length; i++) {
      var mode = viewer.scene.primitives.get(i);
      if (!(mode instanceof Cesium.PrimitiveCollection)) {
        if (mode.type == null) {
          viewer.scene.primitives.remove(mode);
          Taoist.scene.Release(viewer);
        }
      }
    }
  };

  Taoist.entities = {};

  //销毁所有类型未命名的entities
  Taoist.entities.Release = viewer => {
    var entitys = viewer.entities._entities._array;
    for (var i = 0; i < entitys.length; i++) {
      if (entitys[i].type == null) {
        viewer.entities.remove(entitys[i]);
        Taoist.entities.Release(viewer);
      }
    }
  };

  /**
   * 添加model
   * @param {Object} viewer
   * @param {Object} options (坐标参数，模型地址及，模型朝向)
   */
  Taoist.aMODEL = function (viewer, options) {
    var model = viewer.entities.add({
      position: Cesium.Cartesian3.fromDegrees(options.position.x, options.position.y, options.position.z),
      model: {
        uri: options.url,
        scale: options.scale,
      },
    });
    model.object = options;
    return model;
  };

  /**
   * 删除模型
   * @param {Object} viewer
   * @param {Object} options (模型名字或模型对象)
   */
  Taoist.dMod = function (viewer, _model) {
    if (!_model) {
      console.warn("未查询到！");
      return false;
    } else if (_model instanceof Cesium.Cesium3DTileset) {
      if (viewer.scene.primitives.contains(_model)) {
        viewer.scene.primitives.remove(_model);
        return true;
      }
    } else {
      for (var i = 0; i < viewer.scene.primitives.length; i++) {
        if (viewer.scene.primitives.get(i).config) {
          var name = viewer.scene.primitives.get(i).config.id;
          if (name == _model) {
            viewer.scene.primitives.remove(viewer.scene.primitives.get(i));
            return true;
          }
          if (viewer.scene.primitives.get(i) === _model) {
            viewer.scene.primitives.remove(viewer.scene.primitives.get(i));
            return true;
          }
        } else if (viewer.scene.primitives.get(i) === _model) {
          viewer.scene.primitives.remove(viewer.scene.primitives.get(i));
          return true;
        }
      }
      var entitys = viewer.entities._entities._array;

      for (var i = 0; i < entitys.length; i++) {
        if (entitys[i]._id === _model) {
          viewer.entities.remove(entitys[i]);
          return true;
        }
        if (entitys[i] === _model) {
          viewer.entities.remove(entitys[i]);
          return true;
        }
      }
    }
    return false;
  };
  /**
   * 根据自定义类型删除查询模型数组
   * @param {Object} viewer
   * @param {Object} _model 自定义模型对象
   */
  Taoist.dMod_X = function (viewer, _model) {
    var entitys = viewer.entities._entities._array;
    var _arr_entitys = [];
    for (var i = 0; i < entitys.length; i++) {
      if (!_model) viewer.entities.remove(entitys[i]);
      else if (entitys[i][Object.keys(options)[0]] === options[Object.keys(options)[0]]) {
        _arr_entitys.push(entitys[i]);
      }
    }
    var _arr_entitys_primitives = [];
    for (var i = 0; i < viewer.scene.primitives.length; i++) {
      if (!_model) viewer.scene.primitives.remove(viewer.scene.primitives.get(i));
      else if (viewer.scene.primitives.get(i)[Object.keys(options)[0]] === options[Object.keys(options)[0]]) {
        _arr_entitys_primitives.push(viewer.scene.primitives.get(i));
      }
    }
    var i = 1;
    new Array(_arr_entitys, _arr_entitys_primitives).forEach(elements => {
      if (i === 1) {
        elements.forEach(element => {
          viewer.entities.remove(element);
        });
      } else {
        elements.forEach(element => {
          viewer.scene.primitives.remove(element);
        });
      }
      i++;
    });
  };
  /**
   * 根据id查询scene模型,Entities模型
   * @param {Object} viewer
   * @param {Object} options (坐标参数，模型地址及，模型朝向)
   */
  Taoist.Query = function (viewer, options) {
    if (!options) {
      return [viewer.scene.primitives, viewer.entities._entities._array];
    }
    for (var i = 0; i < viewer.scene.primitives.length; i++) {
      if (viewer.scene.primitives.get(i).id == options.id) {
        return viewer.scene.primitives.get(i);
      }
    }
    var entitys = viewer.entities._entities._array;
    for (var i = 0; i < entitys.length; i++) {
      if (entitys[i]._id === options.id) {
        return entitys[i];
      }
    }
    return null;
  };

  /**
   * 根据自定义类型查询模型数组
   * @param  {Object} viewer
   * @param  {Object} options 自定义对象
   */
  Taoist.Query_X = function (viewer, options) {
    if (!options) {
      return [viewer.scene.primitives, viewer.entities._entities._array];
    }
    var entitys = viewer.entities._entities._array;
    var _arr = [];
    for (var i = 0; i < entitys.length; i++) {
      if (entitys[i][Object.keys(options)[0]] === options[Object.keys(options)[0]]) {
        _arr.push(entitys[i]);
      }
    }

    for (var i = 0; i < viewer.scene.primitives.length; i++) {
      if (viewer.scene.primitives.get(i)[Object.keys(options)[0]] === options[Object.keys(options)[0]]) {
        _arr.push(viewer.scene.primitives.get(i));
      }
    }

    for (let index = 0; index < viewer.dataSources._dataSources.length; index++) {
      const element = viewer.dataSources._dataSources[index];
      if (Cesium.defined(element.entities._entities._array)) {
        for (let i = 0; i < element.entities._entities._array.length; i++) {
          const entitys = element.entities._entities._array[i];
          if (entitys[Object.keys(options)[0]] === options[Object.keys(options)[0]]) {
            _arr.push(entitys);
          }
        }
      }
    }

    return _arr;
  };

  /**
   * 绕点
   * @param {Object} viewer
   */
  Taoist.Rotate = function (viewer) {
    function initAutoRotateParameters(options, viewer) {
      if (Taoist.Rotate.ExectionState) {
        Taoist.Rotate.ExectionState = false;
        viewer.clock.onTick.removeEventListener(Taoist.Rotate.Exection);
        return;
      } else Taoist.Rotate.ExectionState = true;
      var position = Cesium.Cartesian3.fromDegrees(options.x, options.y, options.z);

      // 相机看点的角度，如果大于0那么则是从地底往上看，所以要为负值，这里取-30度
      var pitch = Cesium.Math.toRadians(options.pitch ?? -30);
      // 给定飞行一周所需时间，比如30s, 那么每秒转动度数
      var angle = 360 / 90;
      // 给定相机距离点多少距离飞行，这里取值为5000m
      var distance = viewer.camera.positionCartographic.height;
      // var startTime = Cesium.JulianDate.fromDate(options.time??new Date());
      // // var stopTime = Cesium.JulianDate.addSeconds(startTime, 10, new Cesium.JulianDate());

      // viewer.clock.startTime = startTime.clone();  // 开始时间
      // // viewer.clock.stopTime = stopTime.clone();     // 结速时间
      // viewer.clock.currentTime = startTime.clone(); // 当前时间
      // viewer.clock.clockRange = Cesium.ClockRange.CLAMPED; // 行为方式
      // viewer.clock.clockStep = Cesium.ClockStep.SYSTEM_CLOCK; // 时钟设置为当前系统时间; 忽略所有其他设置。
      // 相机的当前heading
      var initialHeading = viewer.camera.heading;
      Taoist.Rotate.Exection = function TimeExecution() {
        // 当前已经过去的时间，单位s
        var delTime = Cesium.JulianDate.secondsDifference(viewer.clock.currentTime, viewer.clock.startTime);
        var heading = Cesium.Math.toRadians(delTime * angle) + initialHeading;
        viewer.scene.camera.setView({
          destination: position, // 点的坐标
          orientation: {
            heading: heading,
            pitch: pitch,
          },
        });
        viewer.scene.camera.moveBackward(distance);

        if (Cesium.JulianDate.compare(viewer.clock.currentTime, viewer.clock.stopTime) >= 0) {
          viewer.clock.onTick.removeEventListener(Taoist.Rotate.Exection);
        }
      };

      viewer.clock.onTick.addEventListener(Taoist.Rotate.Exection);
    }
    var handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    handler.setInputAction(function (movement) {
      if (viewer.scene.pickPosition(movement.position)) {
        var cartographic = Cesium.Cartographic.fromCartesian(viewer.scene.pickPosition(movement.position));
        var lng = Cesium.Math.toDegrees(cartographic.longitude);
        var lat = Cesium.Math.toDegrees(cartographic.latitude);
        var height = cartographic.height; //模型高度
        //distance = viewer.camera.positionCartographic.height;
        var mapPosition = { x: lng, y: lat, z: height, distance: viewer.camera.positionCartographic.height, camera: G.C.getCameraView(viewer) };
        initAutoRotateParameters(mapPosition, viewer);
      }
    }, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
    return initAutoRotateParameters;
  };
  //球体事件
  function onTickCallback() {
    var viewer = Taoist.viewer;

    var spinRate = 1;
    var currentTime = viewer.clock.currentTime.secondsOfDay;
    var delta = (currentTime - previousTime) / 1000;
    previousTime = currentTime;
    viewer.scene.camera.rotate(Cesium.Cartesian3.UNIT_Z, -spinRate * delta);
  }
  /**
   * 自转
   * @param {Object} viewer
   */
  Taoist.Turn = function (viewer) {
    this._viewer = viewer;

    function setvisible(viewer, value, time) {
      previousTime = viewer.clock.currentTime.secondsOfDay;
      switch (value) {
        case "play":
          viewer.clock.multiplier = multiplier; //速度
          viewer.clock.onTick.addEventListener(onTickCallback);
          break;
        case "stop":
          viewer.clock.currentTime = Cesium.JulianDate.fromDate(new Date());
          viewer.clock.multiplier = 1; //速度
          viewer.clock.onTick.removeEventListener(onTickCallback);
          break;
        case "delayed":
          setvisible(viewer, "play");
          setTimeout(
            () => {
              setvisible(viewer, "stop");
            },
            time == null ? 6000 : time
          );

          break;
      }
    }
    return setvisible;
  };
  //销毁自转效果
  Taoist.Turn.Release = function (viewer) {
    viewer.clock.currentTime = Cesium.JulianDate.fromDate(new Date());
    viewer.clock.multiplier = 1; //速度
    viewer.clock.onTick.removeEventListener(onTickCallback);
  };

  /**
   *坐标定位
   * @param viewer 地图对象
   * @param mapPosition 坐标对象要包含xyzhpr duration
   */
  Taoist.Go = function (viewer, mapPosition, e) {
    var duration = mapPosition.duration == null ? 0 : mapPosition.duration;
    setTimeout(() => {
      try {
        if (viewer.clock.multiplier == 1 || mapPosition.force) {
          viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(mapPosition.x, mapPosition.y, mapPosition.z), //经度、纬度、高度
            orientation: {
              heading: mapPosition.h ?? 0, //绕垂直于地心的轴旋转
              pitch: mapPosition.p ?? 0, //绕纬度线旋转
              roll: mapPosition.r ?? 0, //绕经度线旋转
            },
            duration: duration,
          });
        }
      } catch (error) {
        console.error({ e: error, message: "定位异常" });
      }
    }, 10);
    setTimeout(() => {
      if (e) e();
    }, duration + 100);
  };
  /**
   *高程地形
   * @param viewer 地图对象
   * @param uri 高程资源
   */
  Taoist._TP = function (viewer, uri) {
    var provider = new Cesium.CesiumTerrainProvider({
      url: uri ?? "http://121.40.42.254:8008/%E6%9D%AD%E5%B7%9E-%E9%AB%98%E7%A8%8B/data/",
      requestWaterMask: true, //开启法向量
      requestVertexNormals: true, //开启水面特效
    });
    viewer.terrainProvider = provider;
  };

  /**
   * 添加3D图层
   * @param viewer
   * @param options
   */
  Taoist.aTiles = function (viewer, options, e) {
    var tileset;
    tileset = viewer.scene.primitives.add(new Cesium.Cesium3DTileset(options));
    tileset.readyPromise.then(function () {
      var boundingSphere = tileset.boundingSphere;
      var cartographic = Cesium.Cartographic.fromCartesian(boundingSphere.center);
      var surface = Cesium.Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, options.heightOffset ?? 0);
      var offset = Cesium.Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, options.height ?? 0);
      var translation = Cesium.Cartesian3.subtract(offset, surface, new Cesium.Cartesian3());
      viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);

      tileset.modelMatrix = Cesium.Matrix4.fromTranslation(translation);

      if (options.flyTo) {
        if (!Taoist.aTiles.Timeout)
          Taoist.aTiles.Timeout = setTimeout(() => {
            //开始飞行
            if (viewer.clock.multiplier == 1 && viewer !== undefined) {
              viewer.flyTo(tileset, {
                offset: {
                  heading: Cesium.Math.toRadians(0.0),
                  pitch: Cesium.Math.toRadians(-25),
                  range: 0,
                },
                duration: options.duration == undefined ? 3 : options.duration,
              });
              // viewer.camera.viewBoundingSphere(boundingSphere, new Cesium.HeadingPitchRange(0.0, -0.5, boundingSphere.radius));
            }
            Taoist.aTiles.Timeout = undefined;
          }, 500);
        //console.log('自动定位', new Cesium.HeadingPitchRange(0.0, -0.5, boundingSphere.radius));
      }
      if (e) e();
    });
    // .otherwise(function (error) {
    //   console.log("add3DTiles", error);
    // });

    if (options.style) {
      var defaultStyle = new Cesium.Cesium3DTileStyle({
        color: options.style.color ?? "color('white', 1)",
      });
      tileset.style = defaultStyle;
    }
    if (options.id) tileset.id = options.id;
    tileset.object = options;

    if (options.ca) {
      //添加模型高低颜色差
      tileset.style = new Cesium.Cesium3DTileStyle({
        color: {
          conditions: [
            ["${floor} >= 300", "rgba(45, 0, 75, 0.5)"],
            ["${floor} >= 200", "rgb(102, 71, 151)"],
            ["${floor} >= 100", "rgb(170, 162, 204)"],
            ["${floor} >= 50", "rgb(224, 226, 238)"],
            ["${floor} >= 25", "rgb(252, 230, 200)"],
            ["${floor} >= 10", "rgb(248, 176, 87)"],
            ["${floor} >= 5", "rgb(198, 106, 11)"],
            ["true", "rgb(127, 59, 8)"],
          ],
        },
      });
    }
    return tileset;
  };

  /**
   * 更新3D图层
   * @param viewer
   * @param options
   */
  Taoist.uTiles = function (options) {
    var tileset = options.tileset ?? false;
    if (!tileset) return;

    var boundingSphere = tileset.boundingSphere;
    var cartographic = Cesium.Cartographic.fromCartesian(boundingSphere.center);
    // var surface = Cesium.Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, options.heightOffset ?? 0);
    var lng = Cesium.Math.toDegrees(cartographic.longitude);
    var lat = Cesium.Math.toDegrees(cartographic.latitude);
    var height = cartographic.height; //模型高度

    var params = {
      tx: lng, //模型中心X轴坐标（经度，单位：十进制度）
      ty: lat, //模型中心Y轴坐标（纬度，单位：十进制度）
      tz: height, //模型中心Z轴坐标（高程，单位：米）
      rx: 0, //X轴（经度）方向旋转角度（单位：度）
      ry: 0, //Y轴（纬度）方向旋转角度（单位：度）
      rz: 0, //Z轴（高程）方向旋转角度（单位：度）
    };
    //旋转
    var mx = Cesium.Matrix3.fromRotationX(Cesium.Math.toRadians(params.rx));
    var my = Cesium.Matrix3.fromRotationY(Cesium.Math.toRadians(params.ry));
    var mz = Cesium.Matrix3.fromRotationZ(Cesium.Math.toRadians(params.rz));
    var rotationX = Cesium.Matrix4.fromRotationTranslation(mx);
    var rotationY = Cesium.Matrix4.fromRotationTranslation(my);
    var rotationZ = Cesium.Matrix4.fromRotationTranslation(mz); //平移
    var position = Cesium.Cartesian3.fromDegrees(params.tx, params.ty, params.tz);
    var m = Cesium.Transforms.eastNorthUpToFixedFrame(position); //旋转、平移矩阵相乘
    Cesium.Matrix4.multiply(m, rotationX, m);
    Cesium.Matrix4.multiply(m, rotationY, m);
    Cesium.Matrix4.multiply(m, rotationZ, m); //赋值给tileset

    var scale = Cesium.Matrix4.fromUniformScale(options.scale ?? 0.6);
    Cesium.Matrix4.multiply(m, scale, m);

    tileset._root.transform = m;
  };

  /**
   * 定位时戳到中午十二点
   * @param viewer
   */
  Taoist.sTime = function (viewer, time) {
    var _time = time ?? "2021-10-08T04:00:43.52Z";
    viewer.clock.currentTime = Cesium.JulianDate.fromDate(new Date(_time));
  };

  /**
   * 漫游
   * @param {*} viewer
   */
  Taoist.aFR = (viewer, options, timer) => {
    var start = Cesium.JulianDate.fromDate(new Date(Taoist.aFR.getTimes(options.positions[0].time, timer)));
    var stop = Cesium.JulianDate.addSeconds(start, options.stopTime ?? options.positions[options.positions.length - 1].time, new Cesium.JulianDate());

    if (typeof options.positions[0].time == "string") {
      start = Cesium.JulianDate.fromDate(new Date(options.positions[0].time));
      var d1 = new Date(options.positions[0].time);
      var d2 = new Date(options.positions[options.positions.length - 1].time);
      stop = Cesium.JulianDate.addSeconds(start, options.stopTime ?? parseInt(d2 - d1) / 1000, new Cesium.JulianDate());
    }

    viewer.timeline.zoomTo(start, stop);

    function computeFlight(source, start) {
      // 取样位置 相当于一个集合
      let property = new Cesium.SampledPositionProperty();
      for (let i = 0; i < source.length; i++) {
        console.log(i + 1);
        let time = Cesium.JulianDate.addSeconds(start, source[i].time, new Cesium.JulianDate());
        let position = Cesium.Cartesian3.fromDegrees(source[i].longitude, source[i].dimension, source[i].height);
        // 添加位置，和时间对应
        property.addSample(time, position);
      }
      return { property };
    }

    var ccf = Taoist.aFR.computeCirclularFlight(options.positions); //computeFlight(options.positions,start)//

    //Make sure viewer is at the desired time.
    viewer.clock.startTime = start.clone();
    viewer.clock.stopTime = stop.clone();
    viewer.clock.currentTime = start.clone();
    viewer.clock.clockRange = Cesium.ClockRange.LOOP_STOP; //Loop at the end
    viewer.clock.multiplier = 1.0;

    //Actually create the entity
    var entity = viewer.entities.add({
      id: "Will I still be able to use data roaming after I have NO!",
      //Set the entity availability to the same interval as the simulation time.
      availability: new Cesium.TimeIntervalCollection([
        new Cesium.TimeInterval({
          start: start,
          stop: stop,
        }),
      ]),
      //Use our computed positions
      position: ccf.property, //Automatically compute orientation based on position movement.
      orientation: new Cesium.VelocityOrientationProperty(ccf.property),
      //Load the Cesium plane model to represent the entity
      model: {
        uri: options.url,
        scale: options.scale,
      },
      path: {
        resolution: 0.1,
        width: 26,
        material: new Cesium.PolylineGlowMaterialProperty({
          glowPower: 0.1,
          color: Cesium.Color.YELLOW,
        }),
        width: 3,
      },
    });
    return entity;
  };

  /**
   * 线条漫游
   * @param {*} viewer
   * @param {*} datas
   * @param {*} options
   */
  Taoist.aLM = (viewer, options, timer) => {
    timer = timer ?? "16:00:00"; //起始时间
    /**
     * 计算飞行
     * @param source 数据坐标
     * @returns {SampledPositionProperty|*}
     */
    function computeFlight(start, source) {
      // 取样位置 相当于一个集合
      let property = new Cesium.SampledPositionProperty();
      for (let i = 0; i < source.length; i++) {
        let time = Cesium.JulianDate.addSeconds(start, source[i].time, new Cesium.JulianDate());
        let position = Cesium.Cartesian3.fromDegrees(source[i].longitude, source[i].dimension, source[i].height);
        // 添加位置，和时间对应
        property.addSample(time, position);
      }
      return property;
    }

    //viewer.scene.globe.enableLighting = true;
    // 起始时间
    var start = Cesium.JulianDate.fromDate(new Date(Taoist.aFR.getTimes(options.positions[0].time, timer)));
    var stop = Cesium.JulianDate.addSeconds(start, options.stopTime ?? options.positions[options.positions.length - 1].time, new Cesium.JulianDate());

    if (typeof options.positions[0].time == "string") {
      start = Cesium.JulianDate.fromDate(new Date(options.positions[0].time));
      var d1 = new Date(options.positions[0].time);
      var d2 = new Date(options.positions[options.positions.length - 1].time);
      stop = Cesium.JulianDate.addSeconds(start, options.stopTime ?? parseInt(d2 - d1) / 1000, new Cesium.JulianDate());
    }
    // 设置始时钟始时间
    viewer.clock.startTime = start.clone();
    // 设置时钟当前时间
    viewer.clock.currentTime = start.clone();
    // 设置始终停止时间
    viewer.clock.stopTime = stop.clone();
    // 时间速率，数字越大时间过的越快
    viewer.clock.multiplier = options.multiplier;
    // 时间轴
    viewer.timeline.zoomTo(start, stop);
    // 循环执行,即为2，到达终止时间，重新从起点时间开始
    viewer.clock.clockRange = Cesium.ClockRange.LOOP_STOP;

    let property = computeFlight(start, options.positions);

    // 添加模型
    viewer.entities.add({
      shapeType: "LineMovement",
      // 和时间轴关联
      availability: new Cesium.TimeIntervalCollection([
        new Cesium.TimeInterval({
          start: start,
          stop: stop,
        }),
      ]),
      position: property,
      // 根据所提供的速度计算模型的朝向
      orientation: new Cesium.VelocityOrientationProperty(property),
      path: {
        show: true,
        leadTime: 0,
        trailTime: 60,
        width: 5,
        resolution: 1,
        material: new Cesium.PolylineGlowMaterialProperty({
          glowPower: 0.3,
          taperPower: 0.3,
          color: Cesium.Color.RED,
        }),
        clampToGround: true,
      },
      point: {
        pixelSize: 5, //大小
        color: Cesium.Color.RED,
        // outlineColor: Cesium.Color.RED,//边框颜色
        // outlineWidth: 3,//宽 边框
        // disableDepthTestDistance: Number.POSITIVE_INFINITY//防止被遮挡
      },
    });
  };
  //地面漫游（贴地）
  Taoist.aGR = Taoist.GroundRoaming = (viewer, czml, tileset, state, e) => {
    var scene = viewer.scene;
    var clock = viewer.clock;
    var entity;
    var positionProperty;

    var dataSourcePromise = Cesium.CzmlDataSource.load(czml);
    viewer.dataSources.add(dataSourcePromise).then(function (dataSource) {
      entity = dataSource.entities.getById(czml[1].id);
      positionProperty = entity.position;
      entity.model.scale = czml[1].model.scale;
      if (e) {
        e();
      }
    });

    if (Cesium.defined(tileset)) {
      if (scene.clampToHeightSupported) {
        tileset.initialTilesLoaded.addEventListener(start);
      } else {
        window.alert("This browser does not support clampToHeight.");
      }
    } else {
      console.error("tileset.initialTilesLoaded", "绑定失败 请核查模型是否加载完成，或是否被隐藏");
      return false;
    }

    function start() {
      clock.shouldAnimate = true;
      var objectsToExclude = [entity];

      var Start_EventListener = function () {
        var position = positionProperty.getValue(clock.currentTime);
        entity.position = scene.clampToHeight(position, objectsToExclude);
      };
      scene.postRender.addEventListener(Start_EventListener);
      viewer.GroundRoaming_Start_EventListener = Start_EventListener;
      viewer.GroundRoaming_initialTilesLoaded = true;
    }

    if (viewer.GroundRoaming_initialTilesLoaded || state) {
      start();
    }

    viewer.GroundRoaming_EventListener = start;
    return entity;
  };
  //Set timeline to simulation bounds
  Taoist.computeCirclularFlight = Taoist.aFR.computeCirclularFlight = function computeCirclularFlight(position) {
    var _start;
    var _stop;
    var property = new Cesium.SampledPositionProperty();
    for (var i = 0, len = position.length; i < len; i++) {
      var item = position[i];
      var lng = Number(item.longitude ?? item.x);
      var lat = Number(item.dimension ?? item.y);
      var hei = item.height ?? item.z;
      var time = item.time;

      var _position = null;
      if (lng && lat) _position = Cesium.Cartesian3.fromDegrees(lng, lat, hei);

      var juliaDate = null;
      if (time) {
        if (typeof time == "string") {
          juliaDate = Cesium.JulianDate.fromDate(new Date(time));
        } else {
          juliaDate = Cesium.JulianDate.fromIso8601((time, timer));
        }
      }

      if (_position && juliaDate) property.addSample(juliaDate, _position);

      if (i == 0) _start = juliaDate;
      else if (i == len - 1) _stop = juliaDate;
    }
    return { property: property, start: _start, stop: _stop };
  };
  /**
   * 漫游获取时差
   * @param {*} viewer
   */
  Taoist.getTimes = Taoist.aFR.getTimes = (mm, timer) => {
    mm = mm ?? 10;
    var cameraTimer = timer ?? "04:00:00";
    var hour = cameraTimer.split(":")[0];
    var min = cameraTimer.split(":")[1];
    var sec = cameraTimer.split(":")[2];
    var s = Number(hour * 3600) + Number(min * 60) + Number(sec); //加当前相机时间

    var date = new Date();
    timer = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + "T" + Taoist.formatTime(s + mm) + "+0000";
    return timer;
  };
  /**
   * 偏移时分秒
   * @param {*} s 秒
   * @returns
   */
  Taoist.formatTime = s => {
    var t;
    if (s > -1) {
      var hour = Math.floor(s / 3600);
      var min = Math.floor(s / 60) % 60;
      var sec = s % 60;
      if (hour < 10) {
        t = "0" + hour + ":";
      } else {
        t = hour + ":";
      }

      if (min < 10) {
        t += "0";
      }
      t += min + ":";
      if (sec < 10) {
        t += "0";
      }
      t += sec.toFixed(2);
    }
    return t;
  };

  /**
   * 图片
   */
  Taoist.aImg = (viewer, options) => {
    /*NearFarScalar*/
    // near	Number	0.0	可选 摄像机范围的下限。
    // nearValue	Number	0.0	可选 摄像机范围下限的值。
    // far	Number	1.0	可选 摄像机范围的上限。
    // farValue	Number	0.0	可选 摄像机范围上限的值。
    return viewer.entities.add({
      object: options,
      position: Cesium.Cartesian3.fromDegrees(options.x, options.y, options.z),
      billboard: {
        image: options.url,
        scaleByDistance: new Cesium.NearFarScalar(options.near ?? 600, options.nearValue ?? 1, options.far ?? 1000, options.farValue ?? 0.1),
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        width: options.width ?? 64,
        height: options.height ?? 64,
      },
    });
  };

  /**
   * 资源回调
   * @param {* Fnction} e 开始回调
   * @param {* Fnction} a 加载完成回调
   */
  Taoist.IA = Taoist.InterceptionAndmonitoring = (e, a, f) => {
    var open = window.XMLHttpRequest.prototype.open,
      send = window.XMLHttpRequest.prototype.send;

    function openReplacement(method, url, async, user, password) {
      this._url = url;
      this._method = method;
      this._async = async;

      return open.apply(this, arguments);
    }
    function indexOf(_url) {
      if (_url.indexOf("bin") != -1 || _url.indexOf("gltf") != -1 || _url.indexOf("glb") != -1 || _url.indexOf("tileset.json") != -1 || _url.indexOf("b3dm") != -1 || _url.indexOf("cmpt") != -1) {
        return true;
      } else {
        return false;
      }
    }

    function sendReplacement(data) {
      if (this.onreadystatechange) {
        this._onreadystatechange = this.onreadystatechange;
      }
      //取加载进度
      if (this._url.indexOf("glb") != -1 || this._url.indexOf("b3dm") != -1) {
        this.onprogress = function (e) {
          if (e.lengthComputable) {
            //进度信息是否可用
            // console.log(e.loaded + " of " + e.total + " bytes", Taoist.getPercent(e.loaded, e.total));
            if (f) f(Taoist.getPercent(e.loaded, e.total));
          }
        };
      }

      // console.log('Request sent',  );
      if (indexOf(this._url)) {
        if (e) e(this);
        // console.log("正在加载",this._url)
      }

      this.onreadystatechange = onReadyStateChangeReplacement;
      return send.apply(this, arguments);
    }

    function onReadyStateChangeReplacement() {
      // console.log('Ready state changed to: ', this.readyState);

      if (this.readyState == 4)
        if (indexOf(this._url)) {
          if (a) a(this);
          // console.log("加载完成",this._url)
        }

      if (this._onreadystatechange) {
        return this._onreadystatechange.apply(this, arguments);
      }
    }

    window.XMLHttpRequest.prototype.open = openReplacement;
    window.XMLHttpRequest.prototype.send = sendReplacement;
  };
  /**
   *
   * @param {*} viewer 球体对象
   * @param {*} options
   */
  Taoist.aLabel = (viewer, options) => {
    const label = viewer.entities.add({
      type: "label",
      position: Cesium.Cartesian3.fromDegrees(options.x, options.y, options.z),
      label: {
        scale: options.style.fontSize ?? 2.5,
        font: "16px Helvetica",
        text: options.text,
        fillColor: new Cesium.Color.fromCssColorString(options.style.fontColor ?? "#000"),
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        translucencyByDistance: new Cesium.NearFarScalar(15, 1, 5000, 10),
        outlineWidth: options.style.borderWitch ?? 5,
        outlineColor: new Cesium.Color.fromCssColorString(options.style.borderColor ?? "#fff"),
        scaleByDistance: new Cesium.NearFarScalar(50, 1, 300, 0.1), //缩放
      },
      _isQyPoint: true, //标识下，事件中判断
      tooltip: {
        //html: inthtml,
        anchor: [0, -12],
      },
    });
    label.object = options;
    return label;
  };

  /**
   * 画点
   * @param {*} viewer
   * @param {*} e 回调
   */
  Taoist.drawPoint = (viewer, e) => {
    var handlers = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    handlers.setInputAction(function (movement) {
      if (viewer.scene.pickPosition(movement.position)) {
        var cartographic = Cesium.Cartographic.fromCartesian(viewer.scene.pickPosition(movement.position));
        var lng = Cesium.Math.toDegrees(cartographic.longitude);
        var lat = Cesium.Math.toDegrees(cartographic.latitude);
        var mapPosition = { x: lng, y: lat, z: 0 };
        var mod = viewer.entities.add({
          position: Cesium.Cartesian3.fromDegrees(mapPosition.x, mapPosition.y),
          clampToGround: true,
          id: Taoist.uuid(),
          point: {
            pixelSize: 10, //大小
            color: Cesium.Color.YELLOW,
            outlineColor: Cesium.Color.RED, //边框颜色
            outlineWidth: 3, //宽 边框
            disableDepthTestDistance: Number.POSITIVE_INFINITY, //防止被遮挡
          },
        });
        e(mod.id);
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    //单击鼠标右键结束画点
    handlers.setInputAction(function (movement) {
      handlers.destroy();
    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
  };

  /**
   * 生成随机id字符串
   * @returns string
   */
  Taoist.uuid = () => {
    var temp_url = URL.createObjectURL(new Blob());
    var uuid = temp_url.toString(); // blob:https://xxx.com/b250d159-e1b6-4a87-9002-885d90033be3
    URL.revokeObjectURL(temp_url);
    return uuid.substr(uuid.lastIndexOf("/") + 1);
  };

  //地下模式
  Taoist.TB = viewer => {
    var scene = viewer.scene;
    var globe = scene.globe;
    scene.screenSpaceCameraController.enableCollisionDetection = false;
    globe.translucency.frontFaceAlphaByDistance = new Cesium.NearFarScalar(400.0, 0.0, 800.0, 1.0);

    function update() {
      var viewModel = {
        translucencyEnabled: true,
        fadeByDistance: true,
        alpha: 0.5,
      };
      globe.translucency.enabled = viewModel.translucencyEnabled;

      var alpha = Number(viewModel.alpha);
      alpha = !isNaN(alpha) ? alpha : 1.0;
      alpha = Cesium.Math.clamp(alpha, 0.0, 1.0);

      globe.translucency.frontFaceAlphaByDistance.nearValue = alpha;
      globe.translucency.frontFaceAlphaByDistance.farValue = viewModel.fadeByDistance ? 1.0 : alpha;
    }
    update();
  };
  //销毁地下模式
  Taoist.TB.Releas = viewer => {
    var scene = viewer.scene;
    var globe = scene.globe;
    scene.screenSpaceCameraController.enableCollisionDetection = true;
    globe.translucency.frontFaceAlphaByDistance = new Cesium.NearFarScalar(400.0, 0.0, 800.0, 1.0);
    function update() {
      var viewModel = {
        translucencyEnabled: false,
        fadeByDistance: false,
        alpha: 1,
      };
      globe.translucency.enabled = viewModel.translucencyEnabled;

      var alpha = Number(viewModel.alpha);
      alpha = !isNaN(alpha) ? alpha : 1.0;
      alpha = Cesium.Math.clamp(alpha, 0.0, 1.0);

      globe.translucency.frontFaceAlphaByDistance.nearValue = alpha;
      globe.translucency.frontFaceAlphaByDistance.farValue = viewModel.fadeByDistance ? 1.0 : alpha;
    }
    update();
  };
  //生成面
  Taoist.generatingSurface = (viewer, options, positions) => {
    var style = options._style;
    var material = style != null ? Cesium.Color.fromCssColorString(style.shapeColor).withAlpha(style.shapeTransparency / 100) : Cesium.Color.fromCssColorString("#00f").withAlpha(0.5); //多边形绘制完成时的颜色
    var outlineMaterial = new Cesium.PolylineOutlineMaterialProperty({
      //PolylineGlowMaterialProperty 发光
      color: style != null ? Cesium.Color.fromCssColorString(style.borderColor).withAlpha(style.borderTransparency / 100) : Cesium.Color.fromCssColorString("#00f").withAlpha(0.9), //绘制时 线条的颜色
      //outlineWidth : style != null ? style.borderWitch : 3,
      outlineColor: style != null ? Cesium.Color.fromCssColorString(style.borderColor).withAlpha(style.borderTransparency / 100) : Cesium.Color.fromCssColorString("#00f").withAlpha(0.9), //绘制时 边框的颜色
    });
    positions = Cesium.Cartesian3.fromDegreesArray(positions);

    var outlinePositions = [].concat(positions);
    outlinePositions.push(positions[0]);
    var hierachy = new Cesium.PolygonHierarchy(positions);
    // console.log(Cesium.Cartesian3.fromDegreesArray(positions))
    var bData = {
      layerId: options.id,
      shapeType: "generatingSurface",
      polyline: {
        positions: outlinePositions,
        clampToGround: true,
        width: style != null ? style.borderWitch : 3,
        material: outlineMaterial,
        zIndex: 20,
      },
      polygon: new Cesium.PolygonGraphics({
        hierarchy: hierachy,
        asynchronous: false,
        material: material,
        zIndex: 19,
      }),
    }; //
    var entity = viewer.entities.add(bData);
    return entity;
  };

  /**
   * 求百分比
   * @param  num 当前数
   * @param  total 总数
   */
  Taoist.getPercent = (num, total) => {
    num = parseFloat(num);
    total = parseFloat(total);
    if (isNaN(num) || isNaN(total)) {
      return "-";
    }
    return total <= 0 ? "0%" : Math.round((num / total) * 10000) / 100.0 + "%";
  };

  /********************************************************************************************************* */
  if (typeof window.Taoist === "undefined") {
    window.Taoist = window.G = Taoist;
  }

  return Taoist;
});
Function.prototype.getName = function () {
  return this.name || this.toString().match(/function\s*([^(]*)\(/)[1];
};
