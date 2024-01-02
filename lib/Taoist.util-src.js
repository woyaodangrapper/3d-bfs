/**
 * Visualization map spatial data service R&D 工具类
 * @author Oran
 * @version 1.1
 * @time 2021/3/25
 */
 'use strict';
(function() {
  const version = "0.0.1"

  //获取浏览器类型及版本
  function getExplorerInfo() {
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

  //检测浏览器webgl支持
  function webglReport() {
      var exinfo = getExplorerInfo();
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

  //格式化数字 小数位数
  function formatNum(num, digits) {
      return Number(num.toFixed(digits || 0));
  }

  //获取当前相机视角
  function getCameraView(viewer) {
      var camera = viewer.camera;
      var position = camera.positionCartographic;
      var cv = {};
      cv.y = formatNum(Cesium.Math.toDegrees(position.latitude), 6);
      cv.x = formatNum(Cesium.Math.toDegrees(position.longitude), 6);
      cv.z = formatNum(position.height, 2);
      cv.h = formatNum(camera.heading,2);
      cv.p = formatNum(camera.pitch,10);
      cv.r = formatNum(camera.roll,2);
      return cv;
  }
  function  VisualAnalysis() {
      var arrViewField = [];
      var viewModel = { verticalAngle: 90, horizontalAngle: 120, distance: 10 };
      function addViewField(viewer) {
          var e = new Cesium.ViewShed3D(viewer, {
              horizontalAngle: Number(viewModel.horizontalAngle),
              verticalAngle: Number(viewModel.verticalAngle),
              distance: Number(viewModel.distance),
              calback: function () {
                  viewModel.distance = e.distance
              }
          });
        arrViewField.push(e)

      }

      function clearAllViewField() {
          for (var e = 0, i = arrViewField.length; e < i; e++)
              arrViewField[e].destroy();
          arrViewField = []
      }


      function setvisible(viewer,value) {
          switch (value) {
              case 'add':
                  addViewField(viewer);
                  break;
              case 'clear':
                  clearAllViewField(viewer);
                  break;
          }
      }
      return setvisible
  }


  /**
   * 提示框类（entity方式）
   */
  class Tooltip {
      constructor(viewer) {
          this.viewer = viewer;
          this.isInit = false;
          this.labelEntity = null;
          this.init();
      }
      init() {
          var _this = this;
          if (_this.isInit) { return; }
          _this.labelEntity = _this.viewer.entities.add({
              position: Cesium.Cartesian3.fromDegrees(0, 0),
              label: {
                  text: '提示',
                  font: '12px Microsoft Yahei',
                  pixelOffset: new Cesium.Cartesian2(8, 8),
                  horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
                  showBackground: true,
                  backgroundColor: new Cesium.Color.fromCssColorString("#000").withAlpha(50 / 100),
                  disableDepthTestDistance: Number.POSITIVE_INFINITY
              }
          });
          _this.labelEntity.show = false;
          _this.isInit = true;
      }

      setVisible(visible) {
          var _this = this;
          if (!_this.isInit) { return; }
          _this.labelEntity.show = visible;
      }

      showAt(position, message) {
          var _this = this;
          if (!_this.isInit) { return; }
          if (position && message) {
              _this.labelEntity.show = true;
              var cartesian = _this.viewer.camera.pickEllipsoid(position, _this.viewer.scene.globe.ellipsoid);
              if (cartesian) {
                  _this.labelEntity.position = cartesian;
                  _this.labelEntity.show = true;
                  _this.labelEntity.label.text = message;
              } else {
                  _this.labelEntity.show = false;
              }
          }
      }
  }
  /**
   * 热力图生成
   */
  function  DistributionMap(viewer,max,data,options) {
      // 创建热力图
      function createHeatMap(max, data) {
          // 创建元素
          var heatDoc = document.createElement("div");
          heatDoc.setAttribute("style", "width:1000px;height:1000px;margin: 0px;display: none;");
          document.body.appendChild(heatDoc);
          // 创建热力图对象
          var heatmap = h337.create({
              container: heatDoc,
              radius: 20,
              maxOpacity: .5,
              minOpacity: 0,
              blur: .75,
              gradient: {
                  '0.9': 'red',
                  '0.8': 'orange',
                  '0.7': 'yellow',
                  '0.5': 'blue',
                  '0.3': 'green',
              },
          });
          // 添加数据
          heatmap.setData({
              max: max,
              data: data
          });
          return heatmap;
      }
      var canvas = createHeatMap(max,data);
      console.log(canvas)
      viewer.entities.add({
          name: 'Rotating rectangle with rotating texture coordinate',
          show: true,
          rectangle: {
              coordinates: Cesium.Rectangle.fromDegrees(options[0], options[1], options[2], options[3]),
              material: canvas._renderer.canvas // 核心语句，填充热力图
          }
      });
  }
  /**
   * 字符串转对象
   * @param {*} text 字符串
   * @returns 
   */
  function OBJ(text) {
    var json = eval('(' + text + ')');
    return json
  }

  /**
   * Get请求
   * @param {*} url 请求地址
   * @param {*} event 回调方法
   * @param {*} textType 返回类型
   */
  const Get = (url,event,textType) => {
    var request=new XMLHttpRequest();
    var method = "GET";
    var TextType = textType ?? "JSON"
    request.open(method,url);
    request.send(null);
    request.onreadystatechange = function(){
      if (request.readyState==4&&(request.status==200 || request.status==304))
      {
        if(event)
        {
          let data = request.responseText
          switch (TextType) {
            case "JSON":
              data = G.U.OBJ(data)
              break;
            default:
              break;
          }
          event(data);
        }
      }
    }
  }


  let U = { expando: "util" + ( version + Math.random() ).replace( /\D/g, "" ),

  OBJ,Get,
  DistributionMap,
  VisualAnalysis,
  getExplorerInfo,
  webglReport,
  formatNum,
  getCameraView,
  Tooltip

  }



  Object.defineProperties(U, {
    Map: {
      get: function() {
          return 0
      },
      set: function(e) {
        
      }
    }
  })


  G.extend({
    U
  });

  if ( typeof window.util === "undefined" ) {
    window.util =  G.U;
  }

})();
