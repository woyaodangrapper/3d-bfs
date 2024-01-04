

var defaultOptions = {
  mapId: "mapBox",
  toInitialPosition: true,
  noBasemap: true,
  noTerrain: true,
  cameraPosition: {
    "y": 30.275377,
    "x": 120.111744,
    "z": 325.1,
    "h": 3.17,
    "p": -1.5012066139,
    "r": 0
  }
}
let that;
/**
 * 初始化基础类
 */
class mapMain {
  //========== 构造方法 ========== 
  constructor(options) {

    if (!this._webglReport()) throw new Error("浏览器不支持WebGL，需更换浏览器");
    if (!options) options = defaultOptions;

    that = this;
    this.mapId = options.mapId || defaultOptions.mapId;
    this.cameraPosition = options.cameraPosition || defaultOptions.cameraPosition;
    this.toInitialPosition = (options.toInitialPosition != null ? options.toInitialPosition : defaultOptions.toInitialPosition);
    this.noTerrain = (options.noTerrain != null ? options.noTerrain : defaultOptions.noTerrain);
    this.noBasemap = (options.noBasemap != null ? options.noBasemap : defaultOptions.noBasemap);
    if (!this.cameraPosition || !this.cameraPosition) {
      console.log("初始化失败：请确认相机位置与视点位置正确！");
      return;
    }
    //传入了DOM
    if (!options.dom)
      this._createMapEle()

    this._create3DLibrary()
    return new Promise((resolve, reject) => {
      try {
        window.onload = async () => {
          let viewer = null
          if (this.earth) viewer = that._viewer = await this._createMap();
          if (!this.noTerrain) that._terrainProvider(viewer)
          if (this.earth) that._locationTimeNoon(viewer)
          if (!this.noBasemap) that._loadingImageUnderlays(viewer)
          if (this.earth) that._enableSphereStyleEnhancements(viewer)
          if (this.toInitialPosition) that._flyToDefaultPosition(viewer, that.cameraPosition)
          resolve(viewer)
        };
      } catch (error) {
        reject(error)
      }
    })

  }

  //========== 对外属性 ========== 
  /**
   *  获取viewer
   */
  get viewer() {
    return this._viewer;
  }

  //创建Map元素
  _createMapEle() {//创建可视域video DOM  元素
    const mapContainer = document.createElement('div');
    mapContainer.classList.add('map-container');
    mapContainer.style.zIndex = 999;
    mapContainer.id = this.mapId;
    document.body.appendChild(mapContainer);
    return mapContainer;
  }

  /**
  * 初始化交互
  */
  setCameraView(viewer, mapPosition) {
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
  }
  /**
   * 加载3D库
   */
  _create3DLibrary() {
    var script = ['<!-- 初始化三维库 --><script type="text/javascript" src="/lib/index.js" libpath="../" include="Taoist"></script>'];
    script.forEach(element => {
      document.writeln(element);
    });
  }
  /**
   * 创建地图
   */
  _createMap() {
    return new Promise((resolve, reject) => {
      G.create3D({
        id: this.mapId,
        showGroundAtmosphere: true,
        success: function (_viewer) {
          _viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
          resolve(_viewer)
        }
      }, Cesium);
    })

  }

  /**
   * 加载杭州地形
   */
  _terrainProvider(viewer) {
    var provider = new Cesium.CesiumTerrainProvider({
      url: WEBGL_Server + "/杭州-地形切片/地形切片/",
      requestWaterMask: true, //开启法向量
      requestVertexNormals: true, //开启水面特效
    });
    viewer.terrainProvider = provider;
  }

  /**
  * 定位时戳到中午十二点
  * @param viewer
  */
  _locationTimeNoon(viewer) {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1; // 月份从0开始，所以需要加1
    const day = currentDate.getDate();

    const _time = `${year}-${month}-${day}T04:00:00.00Z`;
    viewer.clock.currentTime = Cesium.JulianDate.fromDate(new Date(_time));
  };
  /**
   * 加载影像底图
   */
  _loadingImageUnderlays(viewer) {
    return G.BaseLayer(viewer, {
      name: '影像底图',
      type: 'mapbox',
      layer: 'blue',
      brightness: 0
    })
  }

  /**
   * 初始化交互
   */
  _flyToDefaultPosition(viewer, position) {
    if (this.toInitialPosition)
      this.setCameraView(viewer, position)
  }
  /**
   * 开启球体样式增强
   * @param {*} viewer 
   */
  _enableSphereStyleEnhancements(viewer) {
    viewer.scene.highDynamicRange = true;
    viewer.scene.globe.baseColor = new Cesium.Color.fromCssColorString("#171744");
    viewer.scene.moon.show = false;
    viewer.scene.skyBox.show = false;
    viewer.scene.backgroundColor = new Cesium.Color.fromCssColorString("#171744");
  }


  /**
   * 检测浏览器webgl支持
   */
  _webglReport() {
    var exinfo = this._getExplorerInfo();
    if (exinfo.type == "IE" && exinfo.version < 11) {
      return false;
    }

    try {
      var glContext;
      var canvas = document.createElement('canvas');
      var requestWebgl2 = typeof WebGL2RenderingContext !== 'undefined';
      if (requestWebgl2) {
        glContext = canvas.getContext('webgl2') || canvas.getContext('experimental-webgl2') || undefined;
      }
      if (glContext == null) {
        glContext = canvas.getContext('webgl') || canvas.getContext('experimental-webgl') || undefined;
      }
      if (glContext == null) {
        return false;
      }
    } catch (e) {
      return false;
    }
    return true;
  }

  /**
   * 获取浏览器类型及版本
   */
  _getExplorerInfo() {
    var explorer = window.navigator.userAgent.toLowerCase();
    //ie 
    if (explorer.indexOf("msie") >= 0) {
      var ver = Number(explorer.match(/msie ([\d]+)/)[1]);
      return { type: "IE", version: ver };
    }
    //firefox 
    else if (explorer.indexOf("firefox") >= 0) {
      var ver = Number(explorer.match(/firefox\/([\d]+)/)[1]);
      return { type: "Firefox", version: ver };
    }
    //Chrome
    else if (explorer.indexOf("chrome") >= 0) {
      var ver = Number(explorer.match(/chrome\/([\d]+)/)[1]);
      return { type: "Chrome", version: ver };
    }
    //Opera
    else if (explorer.indexOf("opera") >= 0) {
      var ver = Number(explorer.match(/opera.([\d]+)/)[1]);
      return { type: "Opera", version: ver };
    }
    //Safari
    else if (explorer.indexOf("Safari") >= 0) {
      var ver = Number(explorer.match(/version\/([\d]+)/)[1]);
      return { type: "Safari", version: ver };
    }
    return { type: explorer, version: -1 };
  }

}