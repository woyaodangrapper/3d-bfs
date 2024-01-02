/*!
 * Control JavaScript Library v0.0.1
 * Date: 20211025
 */
(function (window) {
  /**
   *
   * @param {*} viewer
   * @param {*} opt
   *      opt.type：类型，默认为1，即为鼠标移动提示框；type=2 ，定点提示框
   *      opt.popupCartesian : 定点提示框的位置（Cartesian3），仅当opt.type=2时可用
   *      opt.content ： 框内所展示的信息 （可传入html标签、也可以传入文本）
   *      opt.style : 为框体的相关样式 （即css样式）
   *      opt.show ： 是否显示框体
   */
  const MovePrompt = function (viewer, opt) {
    if (!opt) opt = {};

    var randomId = opt.id == null ? VMSDS.core.uuid() : opt.id;
    this.innerHTML = opt.innerHTML;
    this.id = randomId;
    this.style = opt.style;
    this.viewer = viewer;
    if (!this.viewer) return;
    this.scene = this.viewer.scene;
    this.camera = this.viewer.camera;
    this.mapContainer = this.viewer.container.id;
    this.rendHandler = null;
    if (!this.mapContainer) return;

    this.trackPopUpId = "trackPopUp" + randomId;
    this.promptContentId = "promptContent" + randomId;
    this.promptDivId = "promptDiv" + randomId;
    this.trackPopUpContentId = "trackPopUpContent" + randomId;
    this.closeBtnId = "closeBtn" + randomId;

    var infoDiv;
    var max_width = 300;
    var max_height = 500;
    infoDiv = win.document.createElement("div");
    infoDiv.id = this.trackPopUpId;
    infoDiv.className = "trackPopUp";

    this.content = opt.content || ""; //提示框内容

    if (opt.innerHTML == undefined || opt.innerHTML == null) {
      if (!opt.type || opt.type == 1) {
        infoDiv.innerHTML =
          `<div id="` +
          this.trackPopUpContentId +
          `" class="cesium-popup" style="top:0;left:0;"><div class="cesium-prompt-content-wrapper" id="` +
          this.promptDivId +
          `"><div id="trackPopUpLink" class="cesium-popup-content" style=""><span class="promptContent" id="` +
          this.promptContentId +
          `">` +
          this.content +
          `</span></div></div></div>`;
      } else {
        infoDiv.innerHTML =
          `<div id="` +
          this.trackPopUpContentId +
          `" class="cesium-popup" style="top:0;left:0;"><a class="cesium-popup-close-button" href="javascript:void(0)" id="` +
          this.closeBtnId +
          `">×</a><div class="cesium-popup-content-wrapper" id="` +
          this.promptDivId +
          `"><div id="trackPopUpLink" class="cesium-popup-content" style=""><span class="popupContent" id="` +
          this.promptContentId +
          `" >` +
          this.content +
          `</span></div></div><div class="cesium-popup-tip-container"><div class="cesium-popup-tip"></div></div></div>`;
      }
    } else {
      if (!opt.type || opt.type == 1) {
        infoDiv.innerHTML = this.innerHTML[0];
      } else {
        infoDiv.innerHTML = this.innerHTML[1];
      }
    }
    infoDiv.innerHTML = infoDiv.innerHTML.replace(/this.trackPopUpContentId/g, this.trackPopUpContentId);
    infoDiv.innerHTML = infoDiv.innerHTML.replace(/this.promptDivId/g, this.promptDivId);
    infoDiv.innerHTML = infoDiv.innerHTML.replace(/this.promptContentId/g, this.promptContentId);
    infoDiv.innerHTML = infoDiv.innerHTML.replace(/this.content/g, this.content);
    infoDiv.innerHTML = infoDiv.innerHTML.replace(/this.closeBtnId/g, this.closeBtnId);

    win.document.getElementById(this.mapContainer).appendChild(infoDiv);
    win.document.getElementById(this.trackPopUpId).style.display = "block";

    this.offset = opt.offset || {};

    this.infoDiv = win.document.getElementById(this.trackPopUpId);
    this.trackPopUpContent = win.document.getElementById(this.trackPopUpContentId);

    this.promptDiv = win.document.getElementById(this.promptDivId);
    this.promptContent = win.document.getElementById(this.promptContentId);
    this.trackPopUpLink = win.document.getElementById(this.promptContentId);

    this.popupCartesian = opt.popupCartesian;
    this.rendHandler = null;
    this.show = opt.show == undefined ? true : opt.show;
    if (opt.type == 2) {
      if (!this.popupCartesian) {
        console.warn("缺少空间坐标！");
        return;
      }
    }
    if (opt.type && opt.type != 1 && this.popupCartesian) {
      // this.popupCartesian = this.getPosition(this.popupCartesian) || this.popupCartesian;

      var that = this;
      win.document.getElementById(that.closeBtnId).addEventListener("click", function () {
        that.setVisible(false);
      });

      var offsetHeight = -Math.ceil(this.trackPopUpContent.offsetHeight);
      var offsetWidth = -Math.ceil(this.trackPopUpContent.offsetWidth / 2);

      this.rendHandler = this.viewer.scene.postRender.addEventListener(function () {
        if (that.popupCartesian) {
          var px = Cesium.SceneTransforms.wgs84ToWindowCoordinates(that.scene, that.popupCartesian);
          if (px != null) {
            that.trackPopUpContent = win.document.getElementById(that.trackPopUpContentId);
            // console.log(that.trackPopUpContent.offsetHeight,that.trackPopUpContent.clientHeight)
            that.trackPopUpContent.style.left = px.x + (that.offset.x || 0) + offsetWidth + "px";
            that.trackPopUpContent.style.top = px.y + (that.offset.y || 0) + offsetHeight + "px";
          }

          var res = false;
          var e = that.popupCartesian,
            i = that.camera.position,
            n = that.scene.globe.ellipsoid.cartesianToCartographic(i).height;
          if (!((n += 1 * that.scene.globe.ellipsoid.maximumRadius), Cesium.Cartesian3.distance(i, e) > n)) {
            res = true;
          }
          if (res && that.show) {
            if (that.infoDiv) that.infoDiv.style.display = "block";
          } else {
            if (that.infoDiv) that.infoDiv.style.display = "none";
          }
        }
      });
    }
  };
  MovePrompt.prototype = {
    //设置提示框的文本内容
    setHtml: function (html) {
      if (!html) {
        return;
      }
      if (this.trackPopUpLink) {
        this.trackPopUpLink.innerHtml = html;
      }
    },
    //销毁提示框对象
    destroy: function () {
      if (this.infoDiv && this.mapContainer) {
        this.infoDiv.style.display = "none";
        win.document.getElementById(this.mapContainer).removeChild(this.infoDiv);
        this.infoDiv = null;
      }
      if (this.rendHandler) {
        this.rendHandler();
        this.rendHandler = null;
      }
    },

    displayPrompt: function (display) {
      if (this.infoDiv) this.infoDiv.style.display = display ? "block" : "none";
    },
    //修改提示框样式
    updateStyle: function (opt) {
      if (!opt) opt = {};
      this.promptDiv.style.background = opt.rgba || "rgba(0,0,0,.4)";
      this.promptContent.style.color = opt.fontColor || "white";
      if (opt.additional != null) {
        for (let index = 0; index < opt.additional.length; index++) {
          const element = opt.additional[index];
          $(this.promptDiv).css(element.name, element.txt);
        }
      }
    },
    //更新提示框的内容和位置
    updatePrompt: function (px, html) {
      if (!px) return;
      this.infoDiv.style.display = "block";
      this.trackPopUpContent.style.left = px.x + (this.offset.x || 30) + "px";
      this.trackPopUpContent.style.top = px.y + (this.offset.y || 30) + "px";
      this.setHtml(html);
    },
    //  控制提示框的显示隐藏
    setVisible: function (isOpen) {
      if (isOpen == undefined) isOpen = true;
      if (isOpen) {
        this.infoDiv.style.display = "block";
        this.show = true;
      } else {
        this.infoDiv.style.display = "none";
        this.show = false;
      }
    },
  };

  //添加导航控件
  //引用了lib/CesiumPlugins/cesium-navigation
  const NavigationBox = function (viewer, cameraView) {
    viewer.extend(Cesium.viewerCesiumNavigationMixin, {
      defaultResetView: {
        y: cameraView.y,
        x: cameraView.x,
        z: cameraView.z,
        heading: cameraView.heading,
        pitch: cameraView.pitch,
        roll: cameraView.roll,
      },
    });
  };
  //度转度°分′秒″
  function ToDegrees(val) {
    if (typeof val == "undefined" || val == "") {
      return "";
    }
    var i = val.indexOf(".");
    var strDu = i < 0 ? val : val.substring(0, i); //获取度
    var strFen = 0;
    var strMiao = 0;
    if (i > 0) {
      var strFen = "0" + val.substring(i);
      strFen = strFen * 60 + "";
      i = strFen.indexOf(".");
      if (i > 0) {
        strMiao = "0" + strFen.substring(i);
        strFen = strFen.substring(0, i); //获取分
        strMiao = strMiao * 60 + "";
        i = strMiao.indexOf(".");
        strMiao = strMiao.substring(0, i + 4); //取到小数点后面三位
        strMiao = parseFloat(strMiao).toFixed(2); //精确小数点后面两位
      }
    }
    return strDu + "°" + strFen + "'" + strMiao;
  }
  var gisData = {};
  var MouseHeight = function (viewer) {
    var canvas = viewer.scene.canvas;
    var handler = new Cesium.ScreenSpaceEventHandler(canvas);
    handler.setInputAction(function (movement) {
      var cartesian = G.P.getCurrentMousePosition(viewer, movement.position);
      if (cartesian) {
        var start = cartesian;
        var end = cartesian;
        // 插值
        var count = 1;
        var positions = [];
        for (var i = 0; i <= count; i++) {
          positions.push(Cesium.Cartesian3.lerp(start, end, i / count, new Cesium.Cartesian3()));
        }
        viewer.scene.clampToHeightMostDetailed(positions).then(function (clampedCartesians) {
          // 每个点的高度
          var height = [];
          for (var i = 0; i < count; ++i) {
            height.push(Cesium.Cartographic.fromCartesian(clampedCartesians[i]).height);
          }
          // console.log(height)
          gisData.terrain_height = height[0].toFixed(3);
          var format = `<div style="float: left;min-width: 0px;margin-left: 45px;margin-right: 0;"><span class="loader-x"> </span></div>
                    <span style="margin-left: 18px;text-align: right;width: 32px;" id="percentage-text" aria-labelledby="percentage-text-tooltip-text"> 100% </span>
                    <div  id="terrain_height">高程:{}米</div><div id="terrain_y">维:{}</div><div id="terrain_x">经:{}</div>`;
          format += ' <div id="camera_height">相机:{}米</div><div id="degrees_">{}"N {}"E</div>';
          _template(format, gisData);
        });
      }
      // var e = event || win.event;
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
  };

  //添加鼠标位置控件
  const MousePositionBox = function (viewer, containerid, crs) {
    MouseHeight(viewer);
    $("#" + containerid).prepend('<div id="MouseControl"  class="gis-bar" ></div>');
    $("#MouseControl").css({
      right: "0px",
      bottom: "0",
      background: "#ffffff00",
    });

    var format = `<div style="float: left;min-width: 0px;margin-left: 45px;margin-right: 0;"><span id="loader" style="top: 4px;" class="loader-x"> </span></div>
        <span style="margin-left: 8px;text-align: right;width: 32px;font-size: 13px;" id="percentage-text" aria-labelledby="percentage-text-tooltip-text"> 100% </span>
        <div  id="terrain_height">高程:{}米</div><div id="terrain_y">维:{}</div><div id="terrain_x">经:{}</div>`;
    format += ' <div id="camera_height">相机:{}米</div><div id="degrees_">{}"N {}"E</div>';
    $("#MouseControl").html(format);

    function setXYZ2Data(cartesian) {
      var cartographic = Cesium.Cartographic.fromCartesian(cartesian);
      gisData.z = cartographic.height.toFixed(1);
      var jd = Cesium.Math.toDegrees(cartographic.longitude);
      var wd = Cesium.Math.toDegrees(cartographic.latitude);
      //和地图一致的原坐标
      var fixedLen = 6;
      gisData.x = jd.toFixed(fixedLen);
      gisData.y = wd.toFixed(fixedLen);
    }
    gisData.terrain_height = "右键地图获取";
    var handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    handler.setInputAction(function () {
      var e = event || win.event;
      var ray = viewer.camera.getPickRay({ x: e.clientX, y: e.clientY });
      var cartesian = viewer.scene.globe.pick(ray, viewer.scene);
      // var cartesian = VMSDS.positionHandler.getCurrentMousePosition(viewer.scene, {x: e.clientX, y: e.clientY});
      if (cartesian) {
        setXYZ2Data(cartesian);
        gisData.height = viewer.camera.positionCartographic.height.toFixed(1);
        gisData.heading = Cesium.Math.toDegrees(viewer.camera.heading).toFixed(0);
        gisData.pitch = Cesium.Math.toDegrees(viewer.camera.pitch).toFixed(0);

        gisData.degrees_y = ToDegrees(gisData.y);
        gisData.degrees_x = ToDegrees(gisData.x);
        _template(format, gisData);
      }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    //监控地图加载
    var helper = new Cesium.EventHelper();
    var count = 0;
    var Wrong_number = 0;
    helper.add(viewer.scene.globe.tileLoadProgressEvent, function (e) {
      $("#loader").removeClass("loader-x");
      $("#loader").addClass("loader-14");
      if (e > count) {
        count = e;
      }
      if (Wrong_number++ > 2) {
        Wrong_number = 0;
        $("#percentage-text").html(100 - G.P.GetPercent(e, count).toFixed(0) + "%");
      }
      // console.log('每次加载地图服务矢量切片都会进入这个回调', e);

      if (e == 0) {
        $("#percentage-text").html(100 - G.P.GetPercent(e, count).toFixed(0) + "%");
        count = 0;
        $("#loader").removeClass("loader-14");
        $("#loader").addClass("loader-x");
        // console.log("矢量切片加载完成时的回调");
      }
    });
  };

  function _template(str, data) {
    // degrees_x: "120°4'13.90"
    // degrees_y: "30°13'20.92"
    // heading: "22"
    // height: "1836.9"
    // pitch: "-35"
    // terrain_height: "右键地图获取"
    // x: "120.070527"
    // y: "30.222477"
    // z: "291.8"

    var camera = viewer.camera;
    var position = camera.positionCartographic;
    function formatNum(num, digits) {
      return Number(num.toFixed(digits || 0));
    }
    $("#terrain_height").html("高程:" + data.terrain_height + "米");
    $("#terrain_y").html("维:" + data.y + "");
    $("#terrain_x").html("经:" + data.x + "");
    $("#camera_height").html("相机:" + formatNum(position.height, 2) + "米");
    $("#degrees_").html("" + data.degrees_x + '"N ' + data.degrees_y + '"E');
  }

  //获取当前相机视角
  const getCameraView = function (viewer) {
    //格式化数字 小数位数
    function formatNum(num, digits) {
      return Number(num.toFixed(digits || 0));
    }

    var camera = viewer.camera;
    var position = camera.positionCartographic;
    var cv = {};
    cv.y = formatNum(Cesium.Math.toDegrees(position.latitude), 6);
    cv.x = formatNum(Cesium.Math.toDegrees(position.longitude), 6);
    cv.z = formatNum(position.height, 2);
    cv.h = formatNum(camera.heading, 2);
    cv.p = formatNum(camera.pitch, 10);
    cv.r = formatNum(camera.roll, 2);

    return cv;
  };

  //取点击坐标小工具
  const getPosition = function (viewer, e) {
    viewer.cesiumWidget.screenSpaceEventHandler.setInputAction(function (click) {
      try {
        var cartographic = Cesium.Cartographic.fromCartesian(viewer.scene.pickPosition(click.position));
        var lng = Cesium.Math.toDegrees(cartographic.longitude);
        var tab = viewer.scene.pick(click.position); //选取当前的entity
        var lat = Cesium.Math.toDegrees(cartographic.latitude);
        var height = cartographic.height; //模型高度
        var mapPosition = { x: lng, y: lat, z: height };
        var cartesian = viewer.scene.camera.pickEllipsoid(click.position, viewer.scene.globe.ellipsoid);

        var idcode = "";
        if (tab != null) {
          if (tab.primitive != null) {
            idcode = tab.primitive.id;
            if (tab.primitive.id != null && tab.primitive.id.id != null) {
              idcode = tab.primitive.id.id;
            }
          } else if (tab.id != null) {
            idcode = tab.id;
          }
        }
        // console.log(tab)
        var modelType;
        if (tab != null && tab.primitive != null && tab.primitive.modelMatrix != null) {
          modelType = "scene";
        } else if (tab instanceof Cesium.Cesium3DTileset) {
          modelType = "tileset";
        } else if (tab instanceof Cesium.ImageryLayer) {
          modelType = "imageryLayer";
        } else {
          modelType = "entity";
        }
        if (tab == null) {
          modelType = "";
        }

        click.name = "二维坐标（屏幕）";
        mapPosition.name = "经纬度";
        cartesian.name = "笛卡尔直角坐标 笛卡尔3";
        var wsc = {
          screen: click.position,
          warpWeft: mapPosition,
          descartes: cartesian,
          id: idcode == undefined ? "" : idcode,
          modelType: modelType,
        };
        if (e) e(wsc);
      } catch (error) {
        console.log(error);
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
  };

  //添加鹰眼控件
  const addOverview = function (container, father) {
    $("#" + container).html('<div class="overview-div"><div class="overview-close"></div><div id="eye" class="overview-map"></div></div>');
    $(".overview-div").append('<div class="overview-narrow"></div>');
    $(".overview-div").append('<div class="overview-enlarge"></div>');
    //1.创建双球
    var viewer = new Cesium.Viewer("eye", {
      fullscreenButton: false,
      orderIndependentTranslucency: false,
      contextOptions: {
        webgl: {
          alpha: true,
        },
      },
    });

    viewer.scene.globe.depthTestAgainstTerrain = true;
    //开启hdr
    viewer.scene.highDynamicRange = true;

    viewer.scene.globe.enableLighting = true;
    //移除默认的bing影像图层
    viewer.imageryLayers.removeAll();
    viewer.clock.currentTime = Cesium.JulianDate.fromDate(new Date("2019/10/04 06:00:00"));

    //是否关闭大气效果
    viewer.scene.globe.showGroundAtmosphere = true;

    // VMSDS.effect.AtmosphericEffects(viewer);
    $(".overview-div").animate({ width: "90%" });
    $(".overview-div").animate({ height: "74%" });
    $("#eye").animate({ width: "94%" });
    $("#eye").animate({ height: "85%" });

    $(".overview-close").click(function () {
      $(".overview-div").animate({ opacity: 0 }, 100, "linear", function () {
        $(".overview-div").remove();
      });
    });
    $(".overview-narrow").click(function () {
      $(".overview-div").animate({ height: "20%" }, 100, "linear", function () {});
      $(".overview-div").animate({ width: "21%" }, 100, "linear", function () {
        $(".overview-narrow").css("display", "none");
        $(".overview-enlarge").css("display", "block");
      });
    });
    $(".overview-enlarge").click(function () {
      $(".overview-div").animate({ height: "85%" }, 100, "linear", function () {});
      $(".overview-div").animate({ width: "94%" }, 100, "linear", function () {
        $(".overview-narrow").css("display", "block");
        $(".overview-enlarge").css("display", "none");
      });
    });

    viewer.scene.sun.show = false; //在Cesium1.6(不确定)之后的版本会显示太阳和月亮，不关闭会影响展示
    viewer.scene.moon.show = false;
    viewer.scene.skyBox.show = false; //关闭天空盒，否则会显示天空颜色
    viewer.scene.backgroundColor = new Cesium.Color(0.0, 0.0, 0.0, 0.0);

    //2.设置鹰眼图中球属性
    let control = viewer.scene.screenSpaceCameraController;
    control.enableRotate = true;
    control.enableTranslate = true;
    control.enableZoom = true;
    control.enableTilt = true;
    control.enableLook = false;

    $(".cesium-viewer-toolbar").hide();
    $(".cesium-viewer-animationContainer").hide();
    $(".cesium-viewer-timelineContainer").hide();
    $(".cesium-viewer-bottom").hide();

    let syncViewer = function () {
      viewer.camera.flyTo({
        destination: _changeViewerHeight(viewer, father.camera.position),
        orientation: {
          heading: father.camera.heading,
          pitch: father.camera.pitch,
          roll: father.camera.roll,
        },
        duration: 0.0,
      });
    };
    if (father) {
      //3. 同步
      father.entities.add({
        position: Cesium.Cartesian3.fromDegrees(0, 0),
        label: {
          text: new Cesium.CallbackProperty(function () {
            syncViewer();
            return "";
          }, true),
        },
      });
    }
    function _changeViewerHeight(viewer, position) {
      var positions = new Array();
      positions.push(position);
      var formatPos = viewer.positionHandler.formatPositon(position);
      var addedHeight = 1000;
      if (formatPos.z > 200) {
        addedHeight = 2000;
      } else if (formatPos.z > 1000) {
        addedHeight = formatPos.z * 2;
      }
      var positions_ = viewer.positionHandler.addPositionsHeight(positions, addedHeight);
      return positions_[0];
    }
    return viewer;
  };

  //添加旋转控件
  const Editing = (viewer, model) => {
    class ArrowPolyline {
      /**
       * 箭头线
       */
      constructor(option = {}) {
        this._color = option.color || Cesium.Color.RED;
        this._width = option.width || 3;
        this._headWidth = option.headWidth || 2 * this._width;
        this._length = option.length || 300;
        this._headLength = option.headLength || 10;
        this._inverse = option.inverse || false;
        this.position = option.position;
        const id = option.id;
        //这里用的是圆锥几何对象，当topRadius和bottomRadius相同时，它就是一个圆柱
        const line = Cesium.CylinderGeometry.createGeometry(
          new Cesium.CylinderGeometry({
            length: this._length,
            topRadius: this._width,
            bottomRadius: this._width,
          })
        );
        const arrow = Cesium.CylinderGeometry.createGeometry(
          new Cesium.CylinderGeometry({
            length: this._headLength,
            topRadius: 0,
            bottomRadius: this._headWidth,
          })
        );
        let offset = (this._length + this._headLength) / 2;
        if (this._inverse) {
          offset = -offset;
        }

        ArrowPolyline.translate(arrow, [0, 0, offset]);

        return new Cesium.Primitive({
          modelMatrix: Cesium.Transforms.eastNorthUpToFixedFrame(this.position),
          geometryInstances: [
            new Cesium.GeometryInstance({
              id: id + "-line",
              geometry: line,
            }),
            new Cesium.GeometryInstance({
              id: id + "-arrow",
              geometry: arrow,
            }),
          ],
          appearance: new Cesium.MaterialAppearance({
            material: Cesium.Material.fromType("Color", { color: this._color }),
          }),
        });
      }
      /**
       * 按上面的方法画出的箭头在线的中间，我们需要把它平移到线的一端
       */
      static translate = function (geometry, offset) {
        const scratchOffset = new Cesium.Cartesian3();
        if (Array.isArray(offset)) {
          scratchOffset.x = offset[0];
          scratchOffset.y = offset[1];
          scratchOffset.z = offset[2];
        } else {
          Cesium.Cartesian3.clone(offset, scratchOffset);
        }

        for (let i = 0; i < geometry.attributes.position.values.length; i += 3) {
          geometry.attributes.position.values[i] += scratchOffset.x;
          geometry.attributes.position.values[i + 1] += scratchOffset.y;
          geometry.attributes.position.values[i + 2] += scratchOffset.z;
        }
      };
    }
    // model.readyPromise.then(m => {

    model.readyPromise.then(m => {
      console.log("初始化完成");
      const center1 = Cesium.Matrix4.getTranslation(m.modelMatrix, new Cesium.Cartesian3());
      const boundingShpere = m.boundingSphere;
      const radius = boundingShpere.radius;
      const axisZ = new ArrowPolyline({
        id: "axisZ",
        color: Cesium.Color.RED,
        position: center1,
        width: 3,
        headWidth: 5,
        length: radius * 2 + 50,
        headLength: 10,
      });
      const axisX = new ArrowPolyline({
        id: "axisX",
        color: Cesium.Color.GREEN,
        position: center1,
        width: 3,
        headWidth: 5,
        length: radius * 2 + 50,
        headLength: 10,
      });
      const axisY = new ArrowPolyline({
        id: "axisY",
        color: Cesium.Color.BLUE,
        position: center1,
        width: 3,
        headWidth: 5,
        length: radius * 2 + 50,
        headLength: 10,
      });

      const mx = Cesium.Matrix3.fromRotationY(Cesium.Math.toRadians(90));
      const rotationX = Cesium.Matrix4.fromRotationTranslation(mx);
      Cesium.Matrix4.multiply(axisX.geometryInstances[0].modelMatrix, rotationX, axisX.geometryInstances[0].modelMatrix);
      Cesium.Matrix4.multiply(axisX.geometryInstances[1].modelMatrix, rotationX, axisX.geometryInstances[1].modelMatrix);
      const my = Cesium.Matrix3.fromRotationX(Cesium.Math.toRadians(90));
      const rotationY = Cesium.Matrix4.fromRotationTranslation(my);
      Cesium.Matrix4.multiply(axisY.geometryInstances[0].modelMatrix, rotationY, axisY.geometryInstances[0].modelMatrix);
      Cesium.Matrix4.multiply(axisY.geometryInstances[1].modelMatrix, rotationY, axisY.geometryInstances[1].modelMatrix);
      viewer.scene.primitives.add(axisZ);
      viewer.scene.primitives.add(axisX);
      viewer.scene.primitives.add(axisY);

      try {
        function createAxisSphere(id, position, matrix, color) {
          const geometry = new Cesium.PolylineGeometry({
            positions: position,
            width: 10,
          });
          const instnce = new Cesium.GeometryInstance({
            geometry: geometry,
            id: id,
            attributes: {
              color: Cesium.ColorGeometryInstanceAttribute.fromColor(color),
            },
          });
          return new Cesium.Primitive({
            geometryInstances: instnce,
            appearance: new Cesium.PolylineColorAppearance({
              translucent: false,
            }),
            modelMatrix: matrix,
          });
        }
        const position = [];
        for (let i = 0; i <= 360; i += 3) {
          const sin = Math.sin(Cesium.Math.toRadians(i));
          const cos = Math.cos(Cesium.Math.toRadians(i));
          const x = radius * cos;
          const y = radius * sin;
          position.push(new Cesium.Cartesian3(x, y, 0));
        }
        const axisSphereZ = createAxisSphere("axisSphereZ", position, matrix, Cesium.Color.RED);
        viewer.scene.primitives.add(axisSphereZ);
        const axisSphereY = createAxisSphere("axisSphereY", position, matrix, Cesium.Color.GREEN);
        viewer.scene.primitives.add(axisSphereY);
        Cesium.Matrix4.multiply(axisSphereY.geometryInstances.modelMatrix, rotationY, axisSphereY.geometryInstances.modelMatrix);
        const axisSphereX = createAxisSphere("axisSphereX", position, matrix, Cesium.Color.BLUE);
        viewer.scene.primitives.add(axisSphereX);
        Cesium.Matrix4.multiply(axisSphereX.geometryInstances.modelMatrix, rotationX, axisSphereX.geometryInstances.modelMatrix);
      } catch (error) {
        console.log(error);
      }
    });
    var matrix = model.modelMatrix;
  };

  const EventConstant = {
    LEFT_DOWN: "LEFT_DOWN",
    RIGHT_CLICK: "RIGHT_CLICK",
    LEFT_DOWN_MOUSE_MOVE: "LEFT_DOWN_MOUSE_MOVE",
    MOUSE_MOVE: "MOUSE_MOVE",
    RENDER: "RENDER",
    KEYUP: "KEYUP",
    KEYDOWN: "KEYDOWN",
    LEFT_UP: "LEFT_UP",
  };

  class Axis {
    /**
     * 实体
     * @type {Cesium.Primitive}
     */
    primitive = null;

    /**
     * 选中状态
     * @type {boolean}
     */
    selected = false;

    /**
     * 轴的颜色
     * @type {Cesium.Color}
     * @private
     */
    _color = null;

    /**
     * 平移
     * @param moveVector{Cesium.Cartesian3} 移动距离
     * @param unit
     * @param moveLength
     */
    translation(moveVector, unit, moveLength) {
      Cesium.Matrix4.multiplyByTranslation(this.primitive.modelMatrix, Cesium.Cartesian3.multiplyByScalar(unit, moveLength, new Cesium.Cartesian3()), this.primitive.modelMatrix);
    }

    /**
     * 旋转轴
     * @param {Cesium.Matrix4} rotation
     */
    rotationAxis(rotation) {
      Cesium.Matrix4.multiply(this.primitive.modelMatrix, rotation, this.primitive.modelMatrix);
    }

    /**
     * 旋转
     * @param rotationX{Cesium.Matrix4} 旋转角度
     */
    rotation(rotationX) {
      this.instance = [];
      if (this.primitive.geometryInstances.constructor === Array) {
        this.instance = this.primitive.geometryInstances;
      } else {
        this.instance = [this.primitive.geometryInstances];
      }
      for (let i = 0; i < this.instance.length; i++) {
        Cesium.Matrix4.multiply(this.instance[i].modelMatrix, rotationX, this.instance[i].modelMatrix);
      }
    }

    // 复位颜色
    rest() {
      this.selected = false;
      this.primitive.appearance.material.uniforms.color = this._color;
    }

    // 选中
    select() {
      this.selected = true;
      this.primitive.appearance.material.uniforms.color = Cesium.Color.WHITE;
    }

    /**
     * 是否是当前轴
     * @param id
     * @return {boolean}
     */
    is(id) {
      return !!this.primitive._instanceIds.find(item => item === id);
    }
  }

  class ArrowPolyline extends Axis {
    /**
     * 方向
     * @type {Cesium.Cartesian3}
     */
    direction = null;

    /**
     * 哪个轴
     * @type {Cartesian3}
     */
    unit = null;

    /**
     * 箭头线
     */
    constructor(option = {}) {
      super();
      this._color = option.color || Cesium.Color.RED;
      this._width = option.width || 3;
      this._headWidth = option.headWidth || 2 * this._width;
      this._length = option.length || 300;
      this._headLength = option.headLength || 10;
      this._inverse = option.inverse || false;
      this.position = option.position;
      this.direction = option.direction;
      this.unit = option.unit;
      const id = option.id;
      //这里用的是圆锥几何对象，当topRadius和bottomRadius相同时，它就是一个圆柱
      const line = Cesium.CylinderGeometry.createGeometry(
        new Cesium.CylinderGeometry({
          length: this._length,
          topRadius: this._width,
          bottomRadius: this._width,
        })
      );
      const arrow = Cesium.CylinderGeometry.createGeometry(
        new Cesium.CylinderGeometry({
          length: this._headLength,
          topRadius: 0,
          bottomRadius: this._headWidth,
        })
      );
      let offset = (this._length + this._headLength) / 2;
      if (this._inverse) {
        offset = -offset;
      }

      this.translate(arrow, [0, 0, offset]);
      const modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(this.position);
      this.primitive = new Cesium.Primitive({
        modelMatrix: modelMatrix,
        geometryInstances: [
          new Cesium.GeometryInstance({
            id: id + "-line",
            geometry: line,
          }),
          new Cesium.GeometryInstance({
            id: id + "-arrow",
            geometry: arrow,
          }),
        ],
        appearance: new Cesium.MaterialAppearance({
          material: Cesium.Material.fromType("Color", {
            color: this._color,
          }),
        }),
        asynchronous: false,
      });
    }

    /**
     * 按上面的方法画出的箭头在线的中间，我们需要把它平移到线的一端
     */
    translate(geometry, offset) {
      const scratchOffset = new Cesium.Cartesian3();
      if (Array.isArray(offset)) {
        scratchOffset.x = offset[0];
        scratchOffset.y = offset[1];
        scratchOffset.z = offset[2];
      } else {
        Cesium.Cartesian3.clone(offset, scratchOffset);
      }

      for (let i = 0; i < geometry.attributes.position.values.length; i += 3) {
        geometry.attributes.position.values[i] += scratchOffset.x;
        geometry.attributes.position.values[i + 1] += scratchOffset.y;
        geometry.attributes.position.values[i + 2] += scratchOffset.z;
      }
    }
  }

  class AxisSphere extends Axis {
    id = "";

    /**
     * 轴位置
     * @type {[]}
     */
    position = [];

    /**
     * 方向
     * @type {Cesium.Cartesian3}
     */
    direction = null;

    /**
     * 轴的角度
     * @type {number}
     */
    angle = 0;

    /**
     * 构造一个旋转轴
     * @param id{string} id
     * @param radius{number} 半径
     * @param position{Cesium.Cartesian3} 位置
     * @param color{Cesium.Color} 颜色
     */
    constructor(id, radius, position, color) {
      super();
      this.id = id;
      this._color = color;
      this._calculation(radius, position);
      this._createAxisSphere(id, position, color);
    }

    /**
     * 创建圆环轴
     * @param id{string} id
     * @param matrix{Cesium.Cartesian3} 位置
     * @param color{Cesium.Color} 颜色
     * @private
     */
    _createAxisSphere(id, position, color) {
      const matrix = Cesium.Transforms.eastNorthUpToFixedFrame(position);
      const geometry = new Cesium.PolylineGeometry({
        positions: this.position,
        width: 10,
      });
      const instance = new Cesium.GeometryInstance({
        geometry: geometry,
        id: id,
        attributes: {
          color: Cesium.ColorGeometryInstanceAttribute.fromColor(color),
        },
      });
      this.primitive = new Cesium.Primitive({
        geometryInstances: instance,
        appearance: new Cesium.PolylineColorAppearance({
          translucent: false,
        }),
        modelMatrix: matrix,
      });
    }

    /**
     * 计算轴圆弧位置
     * @param radius{number}
     */
    _calculation(radius, position) {
      for (let i = 0; i <= 360; i += 3) {
        const sin = Math.sin(Cesium.Math.toRadians(i));
        const cos = Math.cos(Cesium.Math.toRadians(i));
        const x = radius * cos;
        const y = radius * sin;
        this.position.push(new Cesium.Cartesian3(x, y, 0));
      }
    }

    /**
     * 更新轴的角度
     * @param angle
     */
    updateAngle(angle) {
      this.angle += angle;
      if (this.angle >= 360 || this.angle <= 360) {
        this.angle = 0;
      }
    }

    /**
     * 选中
     */
    select() {
      this.selected = true;
    }

    // 复位颜色
    rest() {
      this.selected = false;
    }
  }
  /**
   * https://github.com/mrdoob/eventdispatcher.js/
   */

  function EventDispatcher() {}
  Object.assign(EventDispatcher.prototype, {
    /**
     * 添加监听器
     * @param type{string} 监听器类型
     * @param listener{function} 方法
     * @param mutexStatus{boolean} 互斥开关
     */
    addEventListener: function (type, listener, mutexStatus = false) {
      if (this._listeners === undefined) this._listeners = {};
      this._mutex = this._mutex || {};
      const mutex = this._mutex;
      var listeners = this._listeners;

      if (listeners[type] === undefined) {
        listeners[type] = [];
      }

      if (listeners[type].indexOf(listener) === -1) {
        // 如果启用功能互斥
        if (mutexStatus) {
          mutex[type] = listener;
        }
        listeners[type].push(listener);
      }
    },

    hasEventListener: function (type, listener) {
      if (this._listeners === undefined) return false;

      var listeners = this._listeners;

      return listeners[type] !== undefined && listeners[type].indexOf(listener) !== -1;
    },

    removeEventListener: function (type, listener) {
      if (this._listeners === undefined) return;

      var listeners = this._listeners;
      var listenerArray = listeners[type];

      // 移除指定的功能互斥
      if (this._mutex[type] === listener) {
        this._mutex[type] = null;
      }

      if (listenerArray !== undefined) {
        var index = listenerArray.indexOf(listener);

        if (index !== -1) {
          listenerArray.splice(index, 1);
        }
      }
    },

    /**
     * 派发事件
     * @param event{{type: string, message?: *}}
     */
    dispatchEvent: function (event) {
      if (this._listeners === undefined) return;

      var listeners = this._listeners;
      var listenerArray = listeners[event.type];

      if (listenerArray !== undefined) {
        event.target = this;

        // Make a copy, in case listeners are removed while iterating.
        var array = listenerArray.slice(0);
        if (this._mutex[event.type]) {
          const find = array.find(item => item === this._mutex[event.type]);
          find.call(this, event);
          console.log(" 事件互斥已启动");
          return;
        }
        for (var i = 0, l = array.length; i < l; i++) {
          array[i].call(this, event);
        }
      }
    },

    removeAllListener() {
      this._mutex = {};
      for (const key in this._listeners) {
        this._listeners[key] = [];
      }
    },
  });

  class EventManager extends EventDispatcher {
    /**
     * 视图对象
     * @type {Viewer}
     */
    viewer = null;

    /**
     * 事件处理器
     * @type{Cesium.ScreenSpaceEventHandler}
     */
    handler = null;

    /**
     * 按下左键
     * @type {boolean}
     */
    press = false;

    /**
     * 创建事件管理工具
     * @param viewer
     */
    constructor(viewer) {
      super();
      this.viewer = viewer;

      // 创建事件管理器
      this.handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);

      // 派发左键单击事件
      this.handler.setInputAction(e => {
        this.dispatchEvent({
          type: EventConstant.CLICK,
          message: e,
        });
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

      // 左键按下事件
      this.handler.setInputAction(e => {
        this.press = true;
        this.dispatchEvent({
          type: EventConstant.LEFT_DOWN,
          message: e,
        });
      }, Cesium.ScreenSpaceEventType.LEFT_DOWN);

      // 右键按下事件
      this.handler.setInputAction(e => {
        this.press = false;
        this.dispatchEvent({
          type: EventConstant.LEFT_UP,
          message: e,
        });
      }, Cesium.ScreenSpaceEventType.LEFT_UP);

      // 派发右键单击事件
      this.handler.setInputAction(e => {
        this.dispatchEvent({
          type: EventConstant.RIGHT_CLICK,
          message: e,
        });
      }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);

      // 鼠标移动事件
      this.handler.setInputAction(e => {
        // 左键按下移动事件
        if (this.press) {
          this.dispatchEvent({
            type: EventConstant.LEFT_DOWN_MOUSE_MOVE,
            message: e,
          });
        }
        this.dispatchEvent({
          type: EventConstant.MOUSE_MOVE,
          message: e,
        });
      }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

      // 派发渲染事件
      this.viewer.scene.postRender.addEventListener((e, time) => {
        // TWEEN && TWEEN.update()
        this.viewer.stats && this.viewer.stats.update();
        this.dispatchEvent({
          type: EventConstant.RENDER,
          message: {
            scene: e,
            time: time,
          },
        });
      });
      // 键盘抬起事件
      document.addEventListener(EventConstant.KEYUP, e => {
        this.dispatchEvent({
          type: EventConstant.KEYUP,
          message: {
            e: e,
          },
        });
      });

      // 键盘按下事件
      document.addEventListener(EventConstant.KEYDOWN, e => {
        this.dispatchEvent({
          type: EventConstant.KEYDOWN,
          message: {
            e: e,
          },
        });
      });
    }

    /**
     * 添加相机位置监听方法
     * @param fn{Function} 监听方法
     */
    addCameraMoveListener(fn) {
      this.viewer.camera.changed.addEventListener(fn);
    }

    /**
     * 移除相机位置监听
     * @param fn{Function} 监听方法
     */
    removeCameraMoveListener(fn) {
      this.viewer.camera.changed.removeEventListener(fn);
    }
  }

  class TranslationController {
    /**
     * 视图
     * @type {Viewer}
     */
    viewer = null;

    /**
     * 模型
     * @type {Cesium.Model}
     */
    model = null;

    /**
     * 模型位置
     * @type {Cesium.Cartesian3}
     */
    position = null;

    /**
     * z轴
     * @type {ArrowPolyline}
     */
    axisZ = null;

    /**
     * x轴
     * @type {ArrowPolyline}
     */
    axisX = null;

    /**
     * y轴
     * @type {ArrowPolyline}
     */
    axisY = null;

    /**
     * 操作杆集合
     * @type {Cesium.PrimitiveCollection}
     */
    primitives = null;

    /**
     * 从摄像头发出与视窗上一点相交的射线
     */
    pickRay = new Cesium.Ray();

    /**
     * 当前操作轴
     * @type {ArrowPolyline}
     */
    axis = null;

    /**
     * Z旋转轴
     * @type {AxisSphere}
     */
    axisSphereZ = null;

    /**
     * X旋转轴
     * @type {AxisSphere}
     */
    axisSphereX = null;

    /**
     * Y旋转轴
     * @type {AxisSphere}
     */
    axisSphereY = null;

    /**
     * 辅助球
     * @type {Cesium.Primitive}
     */
    auxiliaryBall = null;

    constructor(viewer) {
      this.viewer = viewer;
      this.viewer.eventManager = new EventManager(viewer);
    }

    /**
     * 添加到模型编辑器 *** 注意创建模型时 矩阵必须为本地矩阵, 否则移动方向会是跟随球心矩阵 ***
     * @param model{Cesium.Model}
     */
    add(model) {
      this.destroy();
      this.model = model;
      this.position = Cesium.Matrix4.getTranslation(model.modelMatrix, new Cesium.Cartesian3());
      // debugger
      this.primitives = this.viewer.scene.primitives; //this.viewer.dataSourceManager.createPrimitives('TranslationController');

      // 创建平移轴
      this._createRod();
      // 旋转平移轴
      this._rotationRod();
      // 添加平移轴
      this._addRod();

      // 创建旋转轴
      this._createSphereAxis();
      // 旋转旋转轴
      this._rotationSphereAxis();
      // 添加旋转轴
      this._addSphereAxis();
      // 添加辅助球
      this._addAuxiliaryBall(this.model.boundingSphere.radius * 2, Cesium.Color.RED.withAlpha(0.2));

      // 添加监听器
      this._addListener();
    }

    // 添加监听器
    _addListener() {
      this.viewer.eventManager.addEventListener(EventConstant.LEFT_DOWN, this._clickListener, true);
      this.viewer.eventManager.addEventListener(EventConstant.LEFT_UP, this._clickUpListener);
      this.viewer.eventManager.addEventListener(EventConstant.MOUSE_MOVE, this._moveListener);
    }

    // 清除操纵杆, 监听器
    destroy() {
      if (!this.primitives || this.primitives.isDestroyed()) return;
      this.primitives.removeAll();
      // this.viewer.dataSourceManager.removePrimitives('TranslationController')
      this._removeListener();
    }

    // 移除监听器
    _removeListener() {
      this.viewer.eventManager.removeEventListener(EventConstant.LEFT_DOWN, this._clickListener);
      this.viewer.eventManager.removeEventListener(EventConstant.LEFT_UP, this._clickUpListener);
      this.viewer.eventManager.removeEventListener(EventConstant.MOUSE_MOVE, this._moveListener);
    }

    // 创建操作杆
    _createRod() {
      const boundingShpere = this.model.boundingSphere;
      const radius = boundingShpere.radius;
      const options = {
        width: radius / 15,
        headWidth: radius / 6,
        length: radius * 5, //坐标轴的长度应该视模型的直径而定
        headLength: radius / 3,
        position: this.position,
      };
      // 向上的向量
      const vectorNormalUp = new Cesium.Cartesian3();
      const vZ = new Cesium.Cartesian3(0, 0, 1);
      Cesium.Cartesian3.normalize(this.position.clone(), vectorNormalUp);

      // 向右的向量
      const vectorNormalRight = new Cesium.Cartesian3();
      // 由z轴向上 地表向上两个向量叉乘, 则可以得出, 向右的向量
      Cesium.Cartesian3.cross(vZ, vectorNormalUp, vectorNormalRight);
      Cesium.Cartesian3.normalize(vectorNormalRight, vectorNormalRight);

      // 向前的向量
      const vectorNormalFront = new Cesium.Cartesian3();
      Cesium.Cartesian3.cross(vectorNormalRight, vectorNormalUp, vectorNormalFront);
      Cesium.Cartesian3.multiplyByScalar(vectorNormalFront, -1, vectorNormalFront);
      Cesium.Cartesian3.normalize(vectorNormalFront, vectorNormalFront);
      this.axisX = new ArrowPolyline({
        id: "axisX",
        color: Cesium.Color.GREEN.withAlpha(0.5),
        direction: vectorNormalRight,
        unit: Cesium.Cartesian3.UNIT_X,
        ...options,
      });
      this.axisZ = new ArrowPolyline({
        id: "axisZ",
        color: Cesium.Color.RED.withAlpha(0.5),
        direction: vectorNormalUp,
        unit: Cesium.Cartesian3.UNIT_Z,
        ...options,
      });
      this.axisY = new ArrowPolyline({
        id: "axisY",
        color: Cesium.Color.BLUE.withAlpha(0.5),
        direction: vectorNormalFront,
        unit: Cesium.Cartesian3.UNIT_Y,
        ...options,
      });
    }

    // 添加操作杆
    _addRod() {
      this.primitives.add(this.axisZ.primitive);
      this.primitives.add(this.axisX.primitive);
      this.primitives.add(this.axisY.primitive);
    }

    // 初始化操作杆
    _rotationRod() {
      const mx = Cesium.Matrix3.fromRotationY(Cesium.Math.toRadians(90));
      const rotationX = Cesium.Matrix4.fromRotationTranslation(mx);
      this.axisX.rotation(rotationX);
      const my = Cesium.Matrix3.fromRotationX(Cesium.Math.toRadians(90));
      const rotationY = Cesium.Matrix4.fromRotationTranslation(my);
      this.axisY.rotation(rotationY);
    }

    // 点击监听
    _clickListener = e => {
      if (this.translationAxisIsSelected() || this.rotationAxisIsSelected()) {
        this.viewer.scene.screenSpaceCameraController.enableRotate = false;
      }
    };

    /**
     * 平移轴被选中
     * @return {boolean}
     */
    translationAxisIsSelected() {
      return this.axisX.selected || this.axisY.selected || this.axisZ.selected;
    }

    /**
     * 旋转轴被选中
     * @return {boolean}
     */
    rotationAxisIsSelected() {
      return this.axisSphereZ.selected || this.axisSphereX.selected || this.axisSphereY.selected;
    }

    _clickUpListener = () => {
      this.axis = null;
      this.viewer.scene.screenSpaceCameraController.enableRotate = true;
      this.auxiliaryBall.show = false;
    };
    // 移动监听
    _moveListener = e => {
      const pick = this.viewer.scene.pick(e.message.endPosition);
      // 如果鼠标左键没有按下
      if (!this.viewer.eventManager.press) {
        this._resetMaterial();
      } else if (this.axis && this.viewer.eventManager.press) {
        if (!pick) return;
        if (this.translationAxisIsSelected()) {
          this._precessTranslation(e, this.axis);
        } else if (this.rotationAxisIsSelected() || (pick && pick.id === "auxiliaryBall") || this.axis.is(pick.id)) {
          this._precessRotation(e, this.axis);
        }
        return;
      }
      if (pick && pick.id) {
        this._resetMaterial();
        let axis = null;
        if (this.axisX.is(pick.id)) {
          axis = this.axisX;
        } else if (this.axisY.is(pick.id)) {
          axis = this.axisY;
        } else if (this.axisZ.is(pick.id)) {
          axis = this.axisZ;
        } else if (this.axisSphereX.is(pick.id)) {
          axis = this.axisSphereX;
        } else if (this.axisSphereY.is(pick.id)) {
          axis = this.axisSphereY;
        } else if (this.axisSphereZ.is(pick.id)) {
          axis = this.axisSphereZ;
        }
        if (axis) {
          this.axis = axis;
          this.axis.select();
          if (this.rotationAxisIsSelected()) {
            this.auxiliaryBall.show = true;
          }
        }
      }
    };

    /**
     * 处理平移
     * @param e
     * @param axis{AxisSphere}
     * @private
     */
    _precessRotation(e, axis) {
      this.auxiliaryBall.show = true;

      // 通过射线, 获取在平面上的位置
      this.viewer.camera.getPickRay(e.message.startPosition, this.pickRay);
      const vtStart = this.getPlaneRotationPosition(this.position, this.viewer.camera.position.clone(), this.pickRay, axis.direction);
      this.viewer.camera.getPickRay(e.message.endPosition, this.pickRay);
      const vtEnd = this.getPlaneRotationPosition(this.position, this.viewer.camera.position.clone(), this.pickRay, axis.direction);

      // 利用叉乘性质判断方向
      const cartesian = Cesium.Cartesian3.cross(vtStart, vtEnd, new Cesium.Cartesian3());
      const angle = Cesium.Math.toDegrees(Cesium.Cartesian3.angleBetween(cartesian, axis.direction));
      let rotateAngleInRadians = Cesium.Cartesian3.angleBetween(vtEnd, vtStart);
      if (angle > 1) {
        rotateAngleInRadians = -rotateAngleInRadians;
      }

      let mx = null;
      if (axis.id === "axisSphereX") {
        mx = Cesium.Matrix3.fromRotationX(rotateAngleInRadians);
      } else if (axis.id === "axisSphereY") {
        mx = Cesium.Matrix3.fromRotationY(rotateAngleInRadians);
      } else if (axis.id === "axisSphereZ") {
        mx = Cesium.Matrix3.fromRotationZ(rotateAngleInRadians);
      }
      const rotationX = Cesium.Matrix4.fromRotationTranslation(mx);
      this.rotation(rotationX, axis, rotateAngleInRadians);
    }

    /**
     * 旋转
     * @param rotationX{Cesium.Matrix4} 旋轉角度
     * @param axis{AxisSphere}
     * @param rotateAngleInRadians
     */
    rotation(rotationX, axis, rotateAngleInRadians) {
      this.axisSphereX.rotationAxis(rotationX);
      this.axisSphereY.rotationAxis(rotationX);
      this.axisSphereZ.rotationAxis(rotationX);
      this.axisX.rotationAxis(rotationX);
      this.axisY.rotationAxis(rotationX);
      this.axisZ.rotationAxis(rotationX);

      this._rotateVectorByAxisForAngle(this.axisX.direction, axis.direction, rotateAngleInRadians);
      this._rotateVectorByAxisForAngle(this.axisY.direction, axis.direction, rotateAngleInRadians);
      this._rotateVectorByAxisForAngle(this.axisZ.direction, axis.direction, rotateAngleInRadians);

      Cesium.Matrix4.multiply(this.model.modelMatrix, rotationX, this.model.modelMatrix);

      const number = Cesium.Math.toDegrees(rotateAngleInRadians);

      axis.updateAngle(number);
    }

    /**
       * 处理选中
       * @param e{
      {message: {startPosition: Cesium.Cartesian2, endPosition: Cesium.Cartesian2}}}
        * @param axis{ArrowPolyline}
        * @private
        */
    _precessTranslation(e, axis) {
      this.auxiliaryBall.show = false;

      // 基于射线, 获取平面上的位置
      this.viewer.camera.getPickRay(e.message.startPosition, this.pickRay);
      const startPosition = this.getPlanePosition(this.position, this.viewer.camera.position.clone(), this.pickRay, axis.direction);
      this.viewer.camera.getPickRay(e.message.endPosition, this.pickRay);
      const endPosition = this.getPlanePosition(this.position, this.viewer.camera.position.clone(), this.pickRay, axis.direction);

      // 获取移动长度, 并对该轴点乘, 获取在该轴实际移动的距离
      const moveVector = new Cesium.Cartesian3();
      Cesium.Cartesian3.subtract(endPosition, startPosition, moveVector);
      const moveLength = Cesium.Cartesian3.dot(axis.direction, moveVector);
      this.translation(moveVector, axis.unit, moveLength);
    }

    /**
     * 平移
     * @param moveVector
     * @param unit
     * @param moveLength
     */
    translation(moveVector, unit, moveLength) {
      this.axisX.translation(moveVector, unit, moveLength);
      this.axisY.translation(moveVector, unit, moveLength);
      this.axisZ.translation(moveVector, unit, moveLength);
      this.axisSphereX.translation(moveVector, unit, moveLength);
      this.axisSphereY.translation(moveVector, unit, moveLength);
      this.axisSphereZ.translation(moveVector, unit, moveLength);

      const matrix4 = this.model.modelMatrix.clone(new Cesium.Matrix4());

      // 更新模型位置
      Cesium.Matrix4.multiplyByTranslation(this.model.modelMatrix, Cesium.Cartesian3.multiplyByScalar(unit, moveLength, new Cesium.Cartesian3()), this.model.modelMatrix);
      Cesium.Matrix4.getTranslation(this.model.modelMatrix, this.position);

      // 辅助球的坐标系为球心坐标, 需要获取本地矩阵移动距离, 修改辅助球位置
      Cesium.Matrix4.subtract(this.model.modelMatrix, matrix4, matrix4);
      const cartesian3 = Cesium.Matrix4.getTranslation(matrix4, new Cesium.Cartesian3());
      Cesium.Matrix4.multiplyByTranslation(this.auxiliaryBall.modelMatrix, cartesian3, this.auxiliaryBall.modelMatrix);
    }

    // 复位所有的材质
    _resetMaterial() {
      this.axisX.rest();
      this.axisY.rest();
      this.axisZ.rest();
      this.axisSphereY.rest();
      this.axisSphereZ.rest();
      this.axisSphereX.rest();
      this.auxiliaryBall.show = false;
    }

    // 创建 旋转轴
    _createSphereAxis() {
      const radius = this.model.boundingSphere.radius * 2;
      this.axisSphereZ = new AxisSphere("axisSphereZ", radius, this.position, Cesium.Color.RED);
      this.axisSphereX = new AxisSphere("axisSphereX", radius, this.position, Cesium.Color.GREEN);
      this.axisSphereY = new AxisSphere("axisSphereY", radius, this.position, Cesium.Color.BLUE);
      this.axisSphereZ.direction = this.axisZ.direction;
      this.axisSphereX.direction = this.axisX.direction;
      this.axisSphereY.direction = this.axisY.direction;
    }

    // 旋转 旋转轴
    _rotationSphereAxis() {
      const mx = Cesium.Matrix3.fromRotationY(Cesium.Math.toRadians(90));
      const rotationX = Cesium.Matrix4.fromRotationTranslation(mx);
      this.axisSphereX.rotation(rotationX);
      const my = Cesium.Matrix3.fromRotationX(Cesium.Math.toRadians(90));
      const rotationY = Cesium.Matrix4.fromRotationTranslation(my);

      this.axisSphereY.rotation(rotationY);
    }

    // 添加旋转轴
    _addSphereAxis() {
      this.primitives.add(this.axisSphereZ.primitive);
      this.primitives.add(this.axisSphereY.primitive);
      this.primitives.add(this.axisSphereX.primitive);
    }

    /**
     * 添加辅助球  *** 选中时高亮 ***
     * @param {number} radius
     * @param {Cesium.Color} color
     */
    _addAuxiliaryBall(radius, color) {
      const cartesian3 = extended(this.position, -radius);
      const modelMatrix = Cesium.Matrix4.multiplyByTranslation(Cesium.Transforms.eastNorthUpToFixedFrame(cartesian3), new Cesium.Cartesian3(0.0, 0.0, radius), new Cesium.Matrix4());

      const sphereGeometry = new Cesium.SphereGeometry({
        vertexFormat: Cesium.PerInstanceColorAppearance.VERTEX_FORMAT,
        radius: radius,
      });
      const sphereInstance = new Cesium.GeometryInstance({
        id: "auxiliaryBall",
        geometry: sphereGeometry,
        modelMatrix: modelMatrix,
        attributes: {
          color: Cesium.ColorGeometryInstanceAttribute.fromColor(color),
        },
      });

      this.auxiliaryBall = this.primitives.add(
        new Cesium.Primitive({
          geometryInstances: sphereInstance,
          appearance: new Cesium.PerInstanceColorAppearance({
            translucent: true,
            closed: true,
          }),
        })
      );
      this.auxiliaryBall.show = false;
    }

    /**
     * 通过轴旋转角度
     * @param vector
     * @param axis
     * @param angle
     */
    _rotateVectorByAxisForAngle(vector, axis, angle) {
      const rotateQuaternion = normalizingQuaternion(Cesium.Quaternion.fromAxisAngle(axis, angle, new Cesium.Quaternion()));
      const quaternion = cartesian3ToQuaternion(vector);
      Cesium.Quaternion.multiply(Cesium.Quaternion.multiply(rotateQuaternion, quaternion, quaternion), Cesium.Quaternion.inverse(rotateQuaternion, new Cesium.Quaternion()), quaternion);
      vector.x = quaternion.x;
      vector.y = quaternion.y;
      vector.z = quaternion.z;
      return quaternion;
    }

    /**
     * 获取平面上的位置
     * @param position{Cesium.Cartesian3} 模型位置
     * @param cameraPosition{Cesium.Cartesian3} 相机位置
     * @param pickRay{Cesium.Ray} 从相机到屏幕的射线
     * @param axisDirection{Cesium.Cartesian3} 轴的向量
     */
    getPlanePosition(position, cameraPosition, pickRay, axisDirection) {
      // 第一步, 获取相机在轴上的投影
      const cartesian3 = Cesium.Cartesian3.subtract(cameraPosition, position, new Cesium.Cartesian3());
      const length = Cesium.Cartesian3.dot(cartesian3, axisDirection);
      // 获取轴上投影的位置, 以相机到这个位置, 为平面法线
      Cesium.Cartesian3.multiplyByScalar(axisDirection, length, cartesian3);
      Cesium.Cartesian3.add(position, cartesian3, cartesian3);
      const pn = Cesium.Cartesian3.subtract(cameraPosition, cartesian3, new Cesium.Cartesian3());
      // 获取单位向量, 射线向投影向量投影
      Cesium.Cartesian3.normalize(pn, cartesian3);
      const number = Cesium.Cartesian3.dot(pickRay.direction, cartesian3);
      // 获取射线与平面相交点
      const number1 = Cesium.Cartesian3.magnitude(pn);
      Cesium.Cartesian3.multiplyByScalar(pickRay.direction, -number1 / number, cartesian3);
      return cartesian3;
    }

    /**
     * 获取平面上的位置
     * @param position{Cesium.Cartesian3} 模型位置
     * @param cameraPosition{Cesium.Cartesian3} 相机位置
     * @param pickRay{Cesium.Ray} 从相机到屏幕的射线
     * @param axisDirection{Cesium.Cartesian3} 轴的向量
     */
    getPlaneRotationPosition(position, cameraPosition, pickRay, axisDirection) {
      const cartesian3 = Cesium.Cartesian3.subtract(cameraPosition, position, new Cesium.Cartesian3());
      const length = Cesium.Cartesian3.dot(cartesian3, axisDirection);
      const number = Cesium.Cartesian3.dot(pickRay.direction, axisDirection);
      Cesium.Cartesian3.multiplyByScalar(pickRay.direction, -length / number, cartesian3);
      Cesium.Cartesian3.add(cameraPosition, cartesian3, cartesian3);
      return Cesium.Cartesian3.subtract(cartesian3, position, new Cesium.Cartesian3());
    }
  }

  const moduloQuaternion = quaternion => {
    // N(q) = |q| = x*x + y*y + z*z + w*w
    return quaternion.x * quaternion.x + quaternion.y * quaternion.y + quaternion.z * quaternion.z + quaternion.w * quaternion.w;
  };

  const cartesian3ToQuaternion = cartesian3 => {
    return new Cesium.Quaternion(cartesian3.x, cartesian3.y, cartesian3.z, 0);
  };

  const normalizingQuaternion = quaternion => {
    // Normalize( q ) = q/ |q| = q / (x*x + y*y + z*z + w*w)
    return Cesium.Quaternion.divideByScalar(quaternion, moduloQuaternion(quaternion), quaternion);
  };

  /**
   * 延长距离
   * @param cartesian{Cesium.Cartesian3}
   * @return{Cesium.Cartesian3}
   */
  const extended = (cartesian, length) => {
    const result = new Cesium.Cartesian3();
    Cesium.Cartesian3.normalize(cartesian, result);
    Cesium.Cartesian3.add(cartesian, Cesium.Cartesian3.multiplyByScalar(result, length, result), result);
    return result;
  };

  const version = "0.0.1";
  let C = {
    expando: "control" + (version + Math.random()).replace(/\D/g, ""),

    MovePrompt,
    NavigationBox,
    MousePositionBox,
    getCameraView,
    getPosition,
    addOverview,
    Editing,
    TranslationController,
  };

  G.extend({
    C,
  });

  if (typeof window.control === "undefined") {
    window.control = G.C;
  }
})(window);
