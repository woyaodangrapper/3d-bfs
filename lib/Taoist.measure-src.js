"use strict";
/**
 * Visualization map spatial data service R&D 计算类
 * @author Oran
 * @version 1.1
 * @time 2021/3/25
 */
(function (window) {
  /*
    绘制曲线 贝塞尔曲线（三阶）
    */
  class DrawCurve {
    //拉伸曲线
    constructor(arg, viewer) {
      this.viewer = viewer;
      this.Cesium = arg;
      this.floatingPoint = null; //标识点
      this._curveline = null; //活动曲线
      this._curvelineLast = null; //最后一条曲线
      this._positions = []; //活动点
      this._entities_point = []; //脏数据
      this._entities_line = []; //脏数据
      this._curvelineData = null; //用于构造曲线数据
    }

    //返回最后活动曲线
    get curveline() {
      return this._curvelineLast;
    }

    //返回线数据用于加载线
    getData() {
      return this._curvelineData;
    }

    //加载曲线  右键后最终确定的曲线，其实跟创建曲线是一样的 只不过是数据的拷贝问题
    loadCurveline(data) {
      var $this = this;
      var points = $this.fineBezier(data); // 定义的贝塞尔方法处理数据

      // 绘制曲线
      var polyline = this.viewer.entities.add({
        polyline: {
          positions: points,
          show: true,
          material: $this.Cesium.Color.RED,
          width: 3,
          clampToGround: true,
        },
      });
      return polyline;
    }

    //开始创建
    startCreate() {
      var $this = this;

      this.handler = new this.Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);

      this.handler.setInputAction(function (evt) {
        //单机开始绘制

        //屏幕坐标转地形上坐标
        var cartesian = $this.getCatesian3FromPX(evt.position);

        if ($this._positions.length == 0) {
          $this._positions.push(cartesian.clone()); // ?不明白为什么要深拷贝

          $this.floatingPoint = $this.createPoint(cartesian); //创建标识点

          $this.createPoint(cartesian); // 绘制点
        }

        $this._positions.push(cartesian); //点集合添加该点数据
      }, $this.Cesium.ScreenSpaceEventType.LEFT_CLICK);

      this.handler.setInputAction(function (evt) {
        //移动时绘制线

        if ($this._positions.length < 4) return; //不明白为什么要控制在3个点，第四个点才触发

        var cartesian = $this.getCatesian3FromPX(evt.endPosition); //获取最后一个点坐标，转换成世界坐标

        if (!$this.Cesium.defined($this._curveline)) {
          //cesium.defined 如果定义了对象，则返回true，否则返回false。
          // 如果曲线对象不存在
          $this._curveline = $this.createCurveline(); //赋值entity
        }

        $this.floatingPoint.position.setValue(cartesian); //标识点

        if ($this._curveline) {
          //如果存在
          $this._positions.pop(); //pop() 方法用于删除并返回数组的最后一个元素。
          $this._positions.push(cartesian); //positions删除之前的点记录，以上一个点为起始点，并记录现在点的位置
        }
      }, $this.Cesium.ScreenSpaceEventType.MOUSE_MOVE);

      this.handler.setInputAction(function (evt) {
        if (!$this._curveline) return; //如果曲线没有绘制点击右键，不执行此方法

        var cartesian = $this.getCatesian3FromPX(evt.position); //获取右击该点的世界坐标

        $this._positions.pop(); //删除数组，并留下最后一个点坐标数据

        $this._positions.push(cartesian); //添加右击该点数据

        $this.createPoint(cartesian); // 绘制点

        //concat() 方法用于连接两个或多个数组。
        // 该方法不会改变现有的数组，而仅仅会返回被连接数组的一个副本。
        $this._curvelineData = $this._positions.concat();

        $this.viewer.entities.remove($this._curveline); //移除
        // 到此为止，逻辑：右击，获取点坐标，删除数组，并把存有最近一个点的数据和右击点数据的数组浅拷贝给一个新变量，然后从entity里面去掉这段数据

        $this._curveline = null; //曲线数据赋空

        $this._positions = []; //点数据数组赋空

        $this.floatingPoint.position.setValue(cartesian); // ？？？

        var line = $this.loadCurveline($this._curvelineData); //加载曲线

        $this._entities_line.push(line);

        $this._curvelineLast = line;
      }, $this.Cesium.ScreenSpaceEventType.RIGHT_CLICK);
    }

    //创建点
    createPoint(cartesian) {
      var $this = this;
      var point = this.viewer.entities.add({
        position: cartesian,
        point: {
          pixelSize: 10,
          color: $this.Cesium.Color.YELLOW,
        },
      });
      $this._entities_point.push(point);
      return point;
    }

    //创建曲线 ，返回一段曲线数据； 每段曲线只创建一次，然后存储数据加载
    createCurveline() {
      var $this = this;

      var polyline = this.viewer.entities.add({
        polyline: {
          //使用cesium的peoperty
          positions: new $this.Cesium.CallbackProperty(function () {
            console.log($this._positions);
            return $this.fineBezier($this._positions);
          }, false),
          show: true,
          material: $this.Cesium.Color.RED,
          width: 3,
          clampToGround: true,
        },
      });
      $this._entities_line.push(polyline); //存储一段曲线数据
      return polyline;
    }

    //销毁 销毁鼠标事件
    destroy() {
      if (this.handler) {
        this.handler.destroy(); //cesium方法
        this.handler = null; //赋空
      }
    }

    //清空实体对象  用于删除已绘制的图形
    clear() {
      // 删除点
      for (var i = 0; i < this._entities_point.length; i++) {
        this.viewer.entities.remove(this._entities_point[i]);
      }
      // 删除曲线
      for (var i = 0; i < this._entities_line.length; i++) {
        this.viewer.entities.remove(this._entities_line[i]);
      }
      // 全部值赋空
      this.floatingPoint = null; //标识点
      this._curveline = null; //活动曲线
      this._curvelineLast = null; //最后一条曲线
      this._positions = []; //活动点
      this._entities_point = []; //脏数据
      this._entities_line = []; //脏数据
      this._curvelineData = null; //用于构造曲线数据
    }
    // 屏幕拾取坐标转换成世界坐标
    getCatesian3FromPX(px) {
      var cartesian;
      var ray = this.viewer.camera.getPickRay(px);
      if (!ray) return null;
      cartesian = this.viewer.scene.globe.pick(ray, this.viewer.scene);
      return cartesian;
    }

    // 世界坐标转换成经纬度坐标，返回一组经纬度数组
    cartesianToLatlng(cartesian) {
      var latlng = this.viewer.scene.globe.ellipsoid.cartesianToCartographic(cartesian);
      var lat = this.Cesium.Math.toDegrees(latlng.latitude);
      var lng = this.Cesium.Math.toDegrees(latlng.longitude);
      return [lng, lat];
    }

    //贝塞尔曲线实现//
    fineBezier(points, num) {
      //返回贝塞尔曲线各点数据数组
      var $this = this;
      var pointNUM = num == null ? 360 : num; //个点 呼叫者必须分配足夠的记忆点以供输出结果
      var poins2D = [];
      var d = [];
      for (var i = 0; i < points.length; i++) {
        // 经纬度数据
        var res = $this.cartesianToLatlng(points[i]);

        var point = new Object();

        point.x = res[0];

        point.y = res[1];

        poins2D.push(point); //数组添加point对象
      }
      var cbs = $this.ComputeBezier(poins2D, pointNUM); //计算贝塞尔曲线

      for (var j = 0; j < cbs.length; j++) {
        d.push(cbs[j].x);
        d.push(cbs[j].y);
      }
      return $this.Cesium.Cartesian3.fromDegreesArray(d); //把贝塞尔曲线返回的经纬度数据存到新数组，转换成世界坐标
    }

    /*
        cp在此是四个元素的阵列:
        cp[0]为起始点，或上图中的P0
        cp[1]为第一个控制点，或上图中的P1
        cp[2]为第二个控制点，或上图中的P2
        cp[3]为结束点，或上图中的P3
        t为参數值，0 <= t <= 1
        */
    PointOnCubicBezier(cp, t) {
      var ax, bx, cx;
      var ay, by, cy;
      var tSquared, tCubed;

      var result = new Object();

      var length = cp.length;

      var inteval = Math.floor(length / 4); // 向下取整 找下标

      /*计算多项式系数  三次贝塞尔的计算公式*/
      cx = 3.0 * (cp[inteval].x - cp[0].x);

      bx = 3.0 * (cp[2 * inteval].x - cp[inteval].x) - cx;

      ax = cp[length - 1].x - cp[0].x - cx - bx;

      cy = 3.0 * (cp[inteval].y - cp[0].y);

      by = 3.0 * (cp[2 * inteval].y - cp[inteval].y) - cy;

      ay = cp[length - 1].y - cp[0].y - cy - by;

      /*计算位于参数值t的曲线点*/
      tSquared = t * t; //t^2
      tCubed = tSquared * t; //t^3

      result.x = ax * tCubed + bx * tSquared + cx * t + cp[0].x;

      result.y = ay * tCubed + by * tSquared + cy * t + cp[0].y;

      return result;
    }

    /*
            ComputeBezier以控制点cp所产生的曲线点，填入Point2D结构的阵列。
            呼叫者必须分配足夠的记忆点以供输出结果，其为<sizeof(Point2D) numberOfPoints>
        */
    ComputeBezier(cp, numberOfPoints) {
      //点的经纬度数组，点数
      var $this = this;

      var dt;

      var i;

      var curve = [];

      dt = 1.0 / (numberOfPoints - 1);

      for (i = 0; i < numberOfPoints; i++) {
        curve[i] = $this.PointOnCubicBezier(cp, i * dt); //曲线上的每个记忆点都对应一个t t的范围在[0-1]
      }
      return curve;
    }
  }

  //****************************高度测量 第一个点的经纬度，第二个点的高度，两点水平距离为半径************************************************//
  var measureHeight = function (viewer) {
    var handler = new Cesium.ScreenSpaceEventHandler(viewer.scene._imageryLayerCollection);
    var positions = [];
    var poly = null;
    var tooltip = new G.U.Tooltip(viewer);
    var height = 0;
    var cartesian = null;
    var floatingPoint;

    handler.setInputAction(function (movement) {
      tooltip.showAt(movement.endPosition, "单击开始，双击结束");
      cartesian = viewer.scene.pickPosition(movement.endPosition);

      if (cartesian) {
        if (positions.length >= 2) {
          if (!Cesium.defined(poly)) {
            poly = new PolyLinePrimitive(positions, function () {
              try {
                var cartographic = Cesium.Cartographic.fromCartesian(cartesian);
                var height = cartographic.height;
                return height;
              } catch (error) {
                return 0;
              }
            });
          } else {
            positions.pop();
            positions.push(cartesian);
          }
          height = getHeight(positions);
        }
      }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    handler.setInputAction(function (movement) {
      cartesian = GetMousePosition(viewer, movement.position);

      if (positions.length == 0) {
        positions.push(cartesian.clone());
        positions.push(cartesian);

        floatingPoint = viewer.entities.add({
          name: "初始高度",
          position: positions[0],
          point: {
            pixelSize: 5,
            color: Cesium.Color.RED,
            outlineColor: Cesium.Color.WHITE,
            outlineWidth: 2,
            heightReference: Cesium.HeightReference.none,
            disableDepthTestDistance: Number.POSITIVE_INFINITY, //防止被遮挡
          },
          label: {
            text: "0米",
            font: "16px sans-serif",
            fillColor: Cesium.Color.fromCssColorString("#fff").withAlpha(100 / 100), //绘制时 线条的颜色
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            translucencyByDistance: new Cesium.NearFarScalar(15, 1, 5000, 10),
            outlineWidth: 2,
            outlineColor: Cesium.Color.fromCssColorString("#3462d0").withAlpha(100 / 100), //绘制时 边框的颜色
            horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
            showBackground: true,
            backgroundColor: new Cesium.Color.fromCssColorString("#00226e").withAlpha(30 / 100),
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
          },
        });
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    handler.setInputAction(function (movement) {
      handler.destroy();
      tooltip.setVisible(false);
      var textDisance = height + "米";
      var point1cartographic = Cesium.Cartographic.fromCartesian(positions[0]);
      var point2cartographic = Cesium.Cartographic.fromCartesian(positions[1]);
      var point_temp = Cesium.Cartesian3.fromDegrees(Cesium.Math.toDegrees(point1cartographic.longitude), Cesium.Math.toDegrees(point1cartographic.latitude), point2cartographic.height);

      viewer.entities.add({
        name: "直线距离",
        position: point_temp,
        point: {
          pixelSize: 5,
          color: Cesium.Color.RED,
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 2,
          heightReference: Cesium.HeightReference.none,
          disableDepthTestDistance: Number.POSITIVE_INFINITY, //防止被遮挡
        },
        label: {
          text: textDisance,
          font: "16px sans-serif",
          fillColor: Cesium.Color.fromCssColorString("#fff").withAlpha(100 / 100), //绘制时 线条的颜色
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          translucencyByDistance: new Cesium.NearFarScalar(15, 1, 5000, 10),
          outlineWidth: 2,
          outlineColor: Cesium.Color.fromCssColorString("#3462d0").withAlpha(100 / 100), //绘制时 边框的颜色
          horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
          showBackground: true,
          backgroundColor: new Cesium.Color.fromCssColorString("#00226e").withAlpha(30 / 100),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
      });

      var point = {};
      point.x = Cesium.Math.toDegrees(Cesium.Cartographic.fromCartesian(positions[0]).longitude).toFixed(6);
      point.y = Cesium.Math.toDegrees(Cesium.Cartographic.fromCartesian(positions[0]).latitude).toFixed(6);
      point.z = Cesium.Cartographic.fromCartesian(positions[0]).height.toFixed(1);

      // var _options = {positions: [
      //   { longitude: point.x, dimension: point.y, height: point2cartographic.height},
      //   { longitude: point.x, dimension: point.y, height: point.z }
      // ]}

      console.log(entity);
      // G.Query_X(viewer,{name:'测量直线'}).forEach(element => {
      //     viewer.entities.remove(element);
      // });
    }, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);

    function getHeight(_positions) {
      var cartographic = Cesium.Cartographic.fromCartesian(_positions[0]);
      var cartographic1 = Cesium.Cartographic.fromCartesian(_positions[1]);
      var height_temp = cartographic1.height - cartographic.height;
      return height_temp.toFixed(2);
    }

    var PolyLinePrimitive = (function () {
      function _(positions, height) {
        this.options = {
          //parent:measure_entities,
          name: "测量直线",
          polyline: {
            show: true,
            positions: [],
            material: Cesium.Color.fromCssColorString("#fff").withAlpha(50 / 100),
            width: 2,
          },
          ellipse: {
            show: true,
            // semiMinorAxis : 30.0,
            // semiMajorAxis : 30.0,
            // height: 20.0,
            material: Cesium.Color.fromCssColorString("#fff").withAlpha(0.5),
            outline: true, // height must be set for outline to display
          },
        };
        this.positions = positions;
        this._height = height;
        this._init();
      }

      _.prototype._init = function () {
        var _self = this;
        var _update = function () {
          var temp_position = [];
          temp_position.push(_self.positions[0]);
          var point1cartographic = Cesium.Cartographic.fromCartesian(_self.positions[0]);
          var point2cartographic = Cesium.Cartographic.fromCartesian(_self.positions[1]);
          var point_temp = Cesium.Cartesian3.fromDegrees(Cesium.Math.toDegrees(point1cartographic.longitude), Cesium.Math.toDegrees(point1cartographic.latitude), point2cartographic.height);
          temp_position.push(point_temp);
          return temp_position;
        };
        var _update_ellipse = function () {
          return _self.positions[0];
        };
        var _semiMinorAxis = function () {
          var point1cartographic = Cesium.Cartographic.fromCartesian(_self.positions[0]);
          var point2cartographic = Cesium.Cartographic.fromCartesian(_self.positions[1]);
          /**根据经纬度计算出距离**/
          var geodesic = new Cesium.EllipsoidGeodesic();
          geodesic.setEndPoints(point1cartographic, point2cartographic);
          var s = geodesic.surfaceDistance;
          return s;
        };

        //实时更新polyline.positions
        this.options.polyline.positions = new Cesium.CallbackProperty(_update, false);
        this.options.position = new Cesium.CallbackProperty(_update_ellipse, false);
        this.options.ellipse.semiMinorAxis = new Cesium.CallbackProperty(_semiMinorAxis, false);
        this.options.ellipse.semiMajorAxis = new Cesium.CallbackProperty(_semiMinorAxis, false);
        this.options.ellipse.height = new Cesium.CallbackProperty(_self._height, false);
        viewer.entities.add(this.options);
      };

      return _;
    })();
  };
  /**
   * 根据xy 获取地形高度
   * @param {*} scene
   * @param {*} position
   */
  function GetMousePosition(viewer, position) {
    var cartesian;
    var scene = viewer.scene;
    //在模型上提取坐标
    var pickedObject = scene.pick(position);
    console.log(pickedObject);
    if (scene.pickPositionSupported && Cesium.defined(pickedObject)) {
      var cartesian = scene.pickPosition(position);
      if (Cesium.defined(cartesian)) {
        var cartographic = Cesium.Cartographic.fromCartesian(cartesian);
        var height = cartographic.height; //模型高度
        if (height >= 0) return cartesian;

        //不是entity时，支持3dtiles地下
        if (!Cesium.defined(pickedObject.id) && height >= -500) return cartesian;
      }
    }
    if (scene.mode === Cesium.SceneMode.SCENE3D) {
      //三维模式下
      var pickRay = scene.camera.getPickRay(position);
      cartesian = scene.globe.pick(pickRay, scene);
    } else {
      //二维模式下
      cartesian = scene.camera.pickEllipsoid(position, scene.globe.ellipsoid);
    }
    return cartesian;
  }

  const version = "1.0.0";
  let M = {
    expando: "measure" + (version + Math.random()).replace(/\D/g, ""),

    DrawCurve,
    measureHeight,
  };

  Object.defineProperties(M, {
    map: {
      get: function () {
        return 0;
      },
      set: function (e) {},
    },
  });

  G.extend({
    M,
  });

  if (typeof window.measure === "undefined") {
    window.measure = G.M;
  }
})(window);
