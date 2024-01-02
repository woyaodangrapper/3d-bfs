/*!
 * Control JavaScript Library v0.0.1
 * Date: 20211025
 */
(function (window) {
  /**
   *  贝塞尔曲线二维转三维  返回一个三维点数组 二阶
   * @param {*} x1 1经度坐标
   * @param {*} y1 1纬度坐标
   * @param {*} x2 2经度坐标
   * @param {*} y2 2纬度坐标
   * @param {*} h 两点经纬度坐标和飞线高度
   * @returns 数组
   */
  function getBSRPoints2(x1, y1, x2, y2, h, num) {
    let point1 = [y1, 0];
    let point2 = [(y2 + y1) / 2, h];
    let point3 = [y2, 0];
    let arr = getBSR(point1, point2, point3, num);
    let arr3d = [];
    for (let i in arr) {
      let x = ((x2 - x1) * (arr[i][0] - y1)) / (y2 - y1) + x1;
      arr3d.push([x, arr[i][0], arr[i][1]]);
    }
    return arr3d;
  }
  /**
   *  贝塞尔曲线二维转三维  返回一个三维点数组 3阶
   * @param {*} h 两点经纬度坐标和飞线高度
   * @returns 数组
   */
  function getBSRPoints3(x1, y1, x2, y2, x3, y3, h, num) {
    let point1 = [y1, 0];
    let point2 = [y2, h];
    let point3 = [y3, 0];
    let arr = getBSR(point1, point2, point3, num);
    let arr3d = [];
    for (let i in arr) {
      let x = ((x3 - x1) * (arr[i][0] - y1)) / (y3 - y1) + x1;
      arr3d.push([x, arr[i][0], arr[i][1]]);
    }
    return arr3d;
  }

  // 生成贝塞尔曲线
  function getBSR(point1, point2, point3, num) {
    var ps = [
      { x: point1[0], y: point1[1] },
      { x: point2[0], y: point2[1] },
      { x: point3[0], y: point3[1] },
    ];
    let guijipoints = CreateBezierPoints(ps, num ?? 100);
    return guijipoints;
  }
  // 贝赛尔曲线算法
  // 参数：
  // anchorpoints: [{ x: 116.30, y: 39.60 }, { x: 37.50, y: 40.25 }, { x: 39.51, y: 36.25 }]
  function CreateBezierPoints(anchorpoints, pointsAmount) {
    var points = [];
    for (var i = 0; i < pointsAmount; i++) {
      var point = MultiPointBezier(anchorpoints, i / pointsAmount);
      points.push([point.x, point.y]);
    }
    return points;
  }

  function MultiPointBezier(points, t) {
    var len = points.length;
    var x = 0,
      y = 0;
    var erxiangshi = function (start, end) {
      var cs = 1,
        bcs = 1;
      while (end > 0) {
        cs *= start;
        bcs *= end;
        start--;
        end--;
      }
      return cs / bcs;
    };
    for (var i = 0; i < len; i++) {
      var point = points[i];
      x += point.x * Math.pow(1 - t, len - 1 - i) * Math.pow(t, i) * erxiangshi(len - 1, i);
      y += point.y * Math.pow(1 - t, len - 1 - i) * Math.pow(t, i) * erxiangshi(len - 1, i);
    }
    return { x: x, y: y };
  }

  /**
   *更新模型矩阵坐标
   * @param params 坐标对象要包含xyzhpr
   */
  function update3dtilesMaxtrix(params) {
    //旋转

    let mx = Cesium.Matrix3.fromRotationX(Cesium.Math.toRadians(params.rx));
    let my = Cesium.Matrix3.fromRotationY(Cesium.Math.toRadians(params.ry));
    let mz = Cesium.Matrix3.fromRotationZ(Cesium.Math.toRadians(params.rz));
    let rotationX = Cesium.Matrix4.fromRotationTranslation(mx);
    let rotationY = Cesium.Matrix4.fromRotationTranslation(my);
    let rotationZ = Cesium.Matrix4.fromRotationTranslation(mz);
    //平移
    let position = Cesium.Cartesian3.fromDegrees(params.tx, params.ty, params.tz);
    let m = Cesium.Transforms.eastNorthUpToFixedFrame(position);

    let scale = Cesium.Matrix4.fromUniformScale(1);
    // //缩放
    Cesium.Matrix4.multiply(m, scale, m);
    //旋转、平移矩阵相乘
    Cesium.Matrix4.multiply(m, rotationX, m);
    Cesium.Matrix4.multiply(m, rotationY, m);
    Cesium.Matrix4.multiply(m, rotationZ, m);
    //赋值给tileset
    return m;
  }

  //计算百分比
  function GetPercent(num, total) {
    /// <summary>
    /// 求百分比
    /// </summary>
    /// <param name="num">当前数</param>
    /// <param name="total">总数</param>
    num = parseFloat(num);
    total = parseFloat(total);
    if (isNaN(num) || isNaN(total)) {
      return "-";
    }
    return total <= 0 ? 0 : Math.round((num / total) * 10000) / 100.0;
  }
  //格式化 数字 小数位数
  function formatNum(num, digits) { 
    return Number(num.toFixed(digits || 0));
  }

  //格式化坐标点为可显示的可理解格式（如：经度x:123.345345、纬度y:31.324324、高度z:123.1）。
  function formatPositon(position) {
    var carto = Cesium.Cartographic.fromCartesian(position);
    var result = {};
    result.y = formatNum(Cesium.Math.toDegrees(carto.latitude), 6);
    result.x = formatNum(Cesium.Math.toDegrees(carto.longitude), 6);
    result.z = formatNum(carto.height, 2);
    return result;
  }

  /**
   * 获取坐标数组中最高高程值
   * @param {Array} positions Array<Cartesian3> 笛卡尔坐标数组
   * @param {Number} defaultVal 默认高程值
   */
  function getMaxHeight(positions, defaultVal) {
    if (defaultVal == null) defaultVal = 0;

    var maxHeight = defaultVal;
    if (positions == null || positions.length == 0) return maxHeight;

    for (var i = 0; i < positions.length; i++) {
      var tempCarto = Cesium.Cartographic.fromCartesian(positions[i]);
      if (tempCarto.height > maxHeight) {
        maxHeight = tempCarto.height;
      }
    }
    return formatNum(maxHeight, 2);
  }

  /**
   * 在坐标基础海拔上增加指定的海拔高度值
   * @param {Array} positions Cartesian3类型的数组
   * @param {Number} height 高度值
   * @return {Array} Cartesian3类型的数组
   */
  function addPositionsHeight(positions, addHeight) {
    addHeight = Number(addHeight) || 0;

    if (positions instanceof Array) {
      var arr = [];
      for (var i = 0, len = positions.length; i < len; i++) {
        var car = Cesium.Cartographic.fromCartesian(positions[i]);
        var point = Cesium.Cartesian3.fromRadians(car.longitude, car.latitude, car.height + addHeight);
        arr.push(point);
      }
      return arr;
    } else {
      var car = Cesium.Cartographic.fromCartesian(positions);
      return Cesium.Cartesian3.fromRadians(car.longitude, car.latitude, car.height + addHeight);
    }
  }

  /**
   * 设置坐标中海拔高度为指定的高度值
   * @param {Array} positions Cartesian3类型的数组
   * @param {Number} height 高度值
   * @return {Array} Cartesian3类型的数组
   */
  function setPositionsHeight(positions, height) {
    height = Number(height) || 0;

    if (positions instanceof Array) {
      var arr = [];
      for (var i = 0, len = positions.length; i < len; i++) {
        var car = Cesium.Cartographic.fromCartesian(positions[i]);
        var point = Cesium.Cartesian3.fromRadians(car.longitude, car.latitude, height);
        arr.push(point);
      }
      return arr;
    } else {
      var car = Cesium.Cartographic.fromCartesian(positions);
      return Cesium.Cartesian3.fromRadians(car.longitude, car.latitude, height);
    }
  }

  /**
   * 设置坐标中海拔高度为贴地或贴模型的高度（sampleHeight需要数据在视域内）
   */
  function updateHeightForClampToGround(position) {
    var carto = Cesium.Cartographic.fromCartesian(position);

    var _heightNew = viewer.scene.sampleHeight(carto);
    if (_heightNew != null && _heightNew > 0) {
      //&&carto.height!=0
      var positionNew = Cesium.Cartesian3.fromRadians(carto.longitude, carto.latitude, _heightNew + 1);
      return positionNew;
    }
    return position;
  }

  /**
   * 获取鼠标当前的屏幕坐标位置的三维Cesium坐标 移动时调用会卡顿
   * @param {Cesium.viewer} viewer
   * @param {Cesium.Cartesian2} position 二维屏幕坐标位置
   */
  function getCurrentMousePosition(viewer, position) {
    var scene = viewer.scene;
    var cartesian;
    //在模型上提取坐标
    var pickedObject = scene.pick(position);
    if (scene.pickPositionSupported && Cesium.defined(pickedObject)) {
      //pickPositionSupported :判断是否支持深度拾取,不支持时无法进行鼠标交互绘制
      var cartesian = scene.pickPosition(position);
      if (Cesium.defined(cartesian)) {
        //不是entity时，支持3dtiles地下
        if (!Cesium.defined(pickedObject.id)) return cartesian;
      }
    }
    return cartesian;
  }

  //计算两点直接多少米
  function disTance(satrt, end) {
    satrt = Cesium.Cartographic.fromCartesian(satrt);
    end = Cesium.Cartographic.fromCartesian(end);
    var geodesic = new Cesium.EllipsoidGeodesic();
    geodesic.setEndPoints(satrt, end);
    var s = geodesic.surfaceDistance;
    s = Math.sqrt(Math.pow(s, 2) + Math.pow(end.height - satrt.height, 2));
    return s.toFixed(2);
  }
  //计算多边形面积
  var earthRadiusMeters = 6371000.0;
  var radiansPerDegree = Math.PI / 180.0; //反
  var degreesPerRadian = 180.0 / Math.PI; //弧度转化为角度
  function getArea(points) {
    var totalAngle = 0;
    for (var i = 0; i < points.length; i++) {
      var j = (i + 1) % points.length;
      var k = (i + 2) % points.length;
      totalAngle += Angle(points[i], points[j], points[k]);
    }
    var planarTotalAngle = (points.length - 2) * 180.0;
    var sphericalExcess = totalAngle - planarTotalAngle;
    if (sphericalExcess > 420.0) {
      totalAngle = points.length * 360.0 - totalAngle;
      sphericalExcess = totalAngle - planarTotalAngle;
    } else if (sphericalExcess > 300.0 && sphericalExcess < 420.0) {
      sphericalExcess = Math.abs(360.0 - sphericalExcess);
    }
    return (sphericalExcess * radiansPerDegree * earthRadiusMeters * earthRadiusMeters) / 1000000.0;
  }
  /*角度*/
  function Angle(p1, p2, p3) {
    var bearing21 = Bearing(p2, p1);
    var bearing23 = Bearing(p2, p3);
    var angle = bearing21 - bearing23;
    if (angle < 0) {
      angle += 360;
    }
    return angle;
  }
  /*方向*/
  function Bearing(from, to) {
    var lat1 = from.lat * radiansPerDegree;
    var lon1 = from.lon * radiansPerDegree;
    var lat2 = to.lat * radiansPerDegree;
    var lon2 = to.lon * radiansPerDegree;
    var angle = -Math.atan2(Math.sin(lon1 - lon2) * Math.cos(lat2), Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(lon1 - lon2));
    if (angle < 0) {
      angle += Math.PI * 2.0;
    }
    angle = angle * degreesPerRadian; //角度
    return angle;
  }

  /**
   * 矩阵逆推
   */
  function UaternionInverse(modelMatrix) {
    //模型欧拉角：
    var m = modelMatrix;
    // 2. 根据矩阵求方位角
    // 我们就用上面得到的矩阵 m 来做测试
    // 计算中心处的变换矩阵
    var m1 = Cesium.Transforms.eastNorthUpToFixedFrame(Cesium.Matrix4.getTranslation(m, new Cesium.Cartesian3()), Cesium.Ellipsoid.WGS84, new Cesium.Matrix4());
    // 矩阵相除
    var m3 = Cesium.Matrix4.multiply(Cesium.Matrix4.inverse(m1, new Cesium.Matrix4()), m, new Cesium.Matrix4());
    // 得到旋转矩阵
    var mat3 = Cesium.Matrix4.getMatrix3(m3, new Cesium.Matrix3());
    // 计算四元数
    var q = Cesium.Quaternion.fromRotationMatrix(mat3);
    // 计算旋转角(弧度)
    var hpr = Cesium.HeadingPitchRoll.fromQuaternion(q);

    //模型缩放比例：
    var scale = Cesium.Matrix4.getScale(m, new Cesium.Cartesian3());

    //模型位置：
    var position = Cesium.Matrix4.getTranslation(m, new Cesium.Cartesian3());

    var heading = Cesium.Math.toDegrees(hpr.heading);
    var pitch = Cesium.Math.toDegrees(hpr.pitch);
    var roll = Cesium.Math.toDegrees(hpr.roll);
    return {
      scale,
      position,
      heading,
      pitch,
      roll,
    };
  }

  //空间两点距离计算函数
  function getSpaceDistance(positions) {
    var distance = 0;
    for (var i = 0; i < positions.length - 1; i++) {
      var point1cartographic = Cesium.Cartographic.fromCartesian(positions[i]);
      var point2cartographic = Cesium.Cartographic.fromCartesian(positions[i + 1]);
      /**根据经纬度计算出距离**/
      var geodesic = new Cesium.EllipsoidGeodesic();
      geodesic.setEndPoints(point1cartographic, point2cartographic);
      var s = geodesic.surfaceDistance;
      //console.log(Math.sqrt(Math.pow(distance, 2) + Math.pow(endheight, 2)));
      //返回两点之间的距离
      s = Math.sqrt(Math.pow(s, 2) + Math.pow(point2cartographic.height - point1cartographic.height, 2));
      distance = distance + s;
    }
    return distance.toFixed(2);
  }

  //计算夹角
  // lat,lng为弧度表示的经纬度，r为地球半径，由于是算夹角，r是多少不重要
  function ball2xyz(lat, lng, r = 6400) {
    return {
      x: r * Math.cos(lat) * Math.cos(lng),
      y: r * Math.cos(lat) * Math.sin(lng),
      z: r * Math.sin(lat),
    };
  }
  //计算两条线的交叉点
  function segmentsIntr(a, b, c, d) {
    /** 1 解线性方程组, 求线段交点. **/
    // 如果分母为0 则平行或共线, 不相交
    var denominator = (b.y - a.y) * (d.x - c.x) - (a.x - b.x) * (c.y - d.y);
    if (denominator == 0) {
      return false;
    }

    // 线段所在直线的交点坐标 (x , y)
    var x = ((b.x - a.x) * (d.x - c.x) * (c.y - a.y) + (b.y - a.y) * (d.x - c.x) * a.x - (d.y - c.y) * (b.x - a.x) * c.x) / denominator;
    var y = -((b.y - a.y) * (d.y - c.y) * (c.x - a.x) + (b.x - a.x) * (d.y - c.y) * a.y - (d.x - c.x) * (b.y - a.y) * c.y) / denominator;

    /** 2 判断交点是否在两条线段上 **/
    if (
      // 交点在线段1上
      (x - a.x) * (x - b.x) <= 0 &&
      (y - a.y) * (y - b.y) <= 0 &&
      // 且交点也在线段2上
      (x - c.x) * (x - d.x) <= 0 &&
      (y - c.y) * (y - d.y) <= 0
    ) {
      // 返回交点p
      return {
        x: x,
        y: y,
      };
    }
    //否则不相交
    return false;
  }
  /**
   * 根据一个经纬度及距离角度，算出另外一个经纬度
   * @param {*} lon 经度 113.3960698
   * @param {*} lat 纬度 22.941386
   * @param {*} brng 方位角 45 ---- 正北方：000°或360° 正东方：090° 正南方：180° 正西方：270°
   * @param {*} dist 90000距离(米)
   */
  function getLonAndLat(lon, lat, brng, dist) {
    function rad(d) {
      return (d * Math.PI) / 180.0;
    }
    function deg(d) {
      return (d * 180) / Math.PI;
    }
    //大地坐标系资料WGS-84 极坐标长半径a=6378137 极坐标短半径b=6356752.3142 扁率f=1/298.2572236
    var a = 6378137;
    var b = 6356752.3142;
    var f = 1 / 298.257223563;
    var lon1 = lon * 1;
    var lat1 = lat * 1;
    var s = dist;
    var alpha1 = rad(brng);
    var sinAlpha1 = Math.sin(alpha1);
    var cosAlpha1 = Math.cos(alpha1);
    var tanU1 = (1 - f) * Math.tan(rad(lat1));
    var cosU1 = 1 / Math.sqrt(1 + tanU1 * tanU1),
      sinU1 = tanU1 * cosU1;
    var sigma1 = Math.atan2(tanU1, cosAlpha1);
    var sinAlpha = cosU1 * sinAlpha1;
    var cosSqAlpha = 1 - sinAlpha * sinAlpha;
    var uSq = (cosSqAlpha * (a * a - b * b)) / (b * b);
    var A = 1 + (uSq / 16384) * (4096 + uSq * (-768 + uSq * (320 - 175 * uSq)));
    var B = (uSq / 1024) * (256 + uSq * (-128 + uSq * (74 - 47 * uSq)));
    var sigma = s / (b * A),
      sigmaP = 2 * Math.PI;
    while (Math.abs(sigma - sigmaP) > 1e-12) {
      var cos2SigmaM = Math.cos(2 * sigma1 + sigma);
      var sinSigma = Math.sin(sigma);
      var cosSigma = Math.cos(sigma);
      var deltaSigma = B * sinSigma * (cos2SigmaM + (B / 4) * (cosSigma * (-1 + 2 * cos2SigmaM * cos2SigmaM) - (B / 6) * cos2SigmaM * (-3 + 4 * sinSigma * sinSigma) * (-3 + 4 * cos2SigmaM * cos2SigmaM)));
      sigmaP = sigma;
      sigma = s / (b * A) + deltaSigma;
    }
    var tmp = sinU1 * sinSigma - cosU1 * cosSigma * cosAlpha1;
    var lat2 = Math.atan2(sinU1 * cosSigma + cosU1 * sinSigma * cosAlpha1, (1 - f) * Math.sqrt(sinAlpha * sinAlpha + tmp * tmp));
    var lambda = Math.atan2(sinSigma * sinAlpha1, cosU1 * cosSigma - sinU1 * sinSigma * cosAlpha1);
    var C = (f / 16) * cosSqAlpha * (4 + f * (4 - 3 * cosSqAlpha));
    var L = lambda - (1 - C) * f * sinAlpha * (sigma + C * sinSigma * (cos2SigmaM + C * cosSigma * (-1 + 2 * cos2SigmaM * cos2SigmaM)));
    var revAz = Math.atan2(sinAlpha, -tmp); // final bearing
    var lonLatObj = {
      lon: lon1 + deg(L),
      lat: deg(lat2),
    };

    return lonLatObj;
  }

  // 将地理经纬度转换成笛卡尔坐标系
  function geo2xyz({ x, y }) {
    console.log({ x, y });
    let thera = (Math.PI * x) / 180;
    let fie = (Math.PI * y) / 180;
    return this.ball2xyz(thera, fie);
  }

  // 计算3个地理坐标点之间的夹角
  function angleOflocation(l1, l2, l3) {
    let p1 = this.geo2xyz(l1);
    let p2 = this.geo2xyz(l2);
    let p3 = this.geo2xyz(l3);

    let { x: x1, y: y1, z: z1 } = p1;
    let { x: x2, y: y2, z: z2 } = p2;
    let { x: x3, y: y3, z: z3 } = p3;

    // 计算向量 P2P1 和 P2P3 的夹角 https://www.zybang.com/question/3379a30c0dd3041b3ef966803f0bf758.html
    let _P1P2 = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2 + (z2 - z1) ** 2);
    let _P2P3 = Math.sqrt((x3 - x2) ** 2 + (y3 - y2) ** 2 + (z3 - z2) ** 2);

    let P = (x1 - x2) * (x3 - x2) + (y1 - y2) * (y3 - y2) + (z1 - z2) * (z3 - z2); //P2P1*P2P3

    return (Math.acos(P / (_P1P2 * _P2P3)) / Math.PI) * 180;
  }

  // 计算3个地理坐标点之间的夹角
  function angleOflocation_x(viewer, l1, l2, l3) {
    function aac(Coordinates) {
      var ellipsoid = viewer.scene.globe.ellipsoid;
      var cartographic = Cesium.Cartographic.fromDegrees(Coordinates.x, Coordinates.y, Coordinates.z);
      var cartesian3 = ellipsoid.cartographicToCartesian(cartographic);
      return cartesian3;
    }
    let C = Cesium.SceneTransforms.wgs84ToWindowCoordinates(viewer.scene, aac({ x: l1.x, y: l1.y, z: l1.z }));
    let B = Cesium.SceneTransforms.wgs84ToWindowCoordinates(viewer.scene, aac({ x: l2.x, y: l2.y, z: l1.z }));
    let A = Cesium.SceneTransforms.wgs84ToWindowCoordinates(viewer.scene, aac({ x: l3.x, y: l3.y, z: l3.z }));
    // let C = l1//Cesium.SceneTransforms.wgs84ToWindowCoordinates(viewer.scene, aa( {x:DrawingLine[0].x + 0.001,y:DrawingLine[0].y,z:0}))
    // let B = l2//Cesium.SceneTransforms.wgs84ToWindowCoordinates(viewer.scene, aa( {x:DrawingLine[1].x ,y:DrawingLine[1].y,z:0}))
    // let A = l3//Cesium.SceneTransforms.wgs84ToWindowCoordinates(viewer.scene, aa( {x:DrawingLine[0].x,y:DrawingLine[0].y,z:0}))
    console.log(A, B, C);
    var AB = Math.sqrt(Math.pow(A.x - B.x, 2) + Math.pow(A.y - B.y, 2));
    var AC = Math.sqrt(Math.pow(A.x - C.x, 2) + Math.pow(A.y - C.y, 2));
    var BC = Math.sqrt(Math.pow(B.x - C.x, 2) + Math.pow(B.y - C.y, 2));
    var cosA = (Math.pow(AB, 2) + Math.pow(AC, 2) - Math.pow(BC, 2)) / (2 * AB * AC);
    var angleA = (Math.acos(cosA) * 180) / Math.PI;

    if (angleA > 90) {
      //angleA = -angleA
      console.log("偏差角度> 90：", angleA - 90);
    } else if (angleA < 90) {
      console.log("偏差角度< 90：", 90 - angleA);
    } else if (angleA == 90) {
      console.log("偏差角度：", 0);
    } else {
      console.log("当前计算角度异常！不可继续... 严重描述：严重", l1, l2, l3);
    }
    console.log("angleA", angleA);
    // 得到angleA角度：45°
    /*
            AB      = 开根( (A.X-B.X)² + (A.Y-B.Y)² ）
            AC      =       A.X-C.X      A.Y-C.Y
            BC      =       B.X-C.X      B.Y-C.Y
            consA   = (AB²+AC²-BC²) / (2*AB*AC)
            angleA  = Math.acos(cosA)*180/Math.PI
        */

    return angleA;
  }
  //Cesium空间中AB两点A绕B点的地面法向量旋转任意角度后新的A点坐标(A’)
  function rotationAngle(viewer, A, B, angle) {
    var A = A; //new Cesium.Cartesian3(675679.994355399, 4532763.148054989, 4426298.210847025);
    var B = B; //new Cesium.Cartesian3(675520.4303984543, 4532803.837842555, 4425994.113846752);

    // 计算B的地面法向量
    var chicB = Cesium.Cartographic.fromCartesian(B);
    chicB.height = 0;
    var dB = Cesium.Cartographic.toCartesian(chicB);
    var normaB = Cesium.Cartesian3.normalize(Cesium.Cartesian3.subtract(dB, B, new Cesium.Cartesian3()), new Cesium.Cartesian3());

    // 构造基于B的法向量旋转90度的矩阵
    var Q = Cesium.Quaternion.fromAxisAngle(normaB, Cesium.Math.toRadians(angle));
    var m3 = Cesium.Matrix3.fromQuaternion(Q);
    var m4 = Cesium.Matrix4.fromRotationTranslation(m3);

    // 计算A点相对B点的坐标A1
    var A1 = Cesium.Cartesian3.subtract(A, B, new Cesium.Cartesian3());

    //对A1应用旋转矩阵
    var p = Cesium.Matrix4.multiplyByPoint(m4, A1, new Cesium.Cartesian3());
    // 新的A的坐标
    var p2 = Cesium.Cartesian3.add(p, B, new Cesium.Cartesian3());

    viewer.entities.add({
      polyline: {
        positions: [B, A],
        width: 1,
        material: Cesium.Color.RED,
      },
    });

    viewer.entities.add({
      polyline: {
        positions: [B, p2],
        width: 1,
        material: Cesium.Color.BLUE,
      },
    });
    return [B, p2];
  }

  //获取屏幕中心的三维Cesium坐标
  function pickCenterPoint(scene) {
    var canvas = scene.canvas;
    var center = new Cesium.Cartesian2(canvas.clientWidth / 2, canvas.clientHeight / 2);

    var ray = scene.camera.getPickRay(center);
    var target = scene.globe.pick(ray, scene);
    return target || scene.camera.pickEllipsoid(center);
  }

  const version = "0.0.1";
  let P = {
    expando: "positionHandler" + (version + Math.random()).replace(/\D/g, ""),

    getSpaceDistance,
    ball2xyz,
    segmentsIntr,
    getLonAndLat,
    geo2xyz,
    angleOflocation,
    angleOflocation_x,
    rotationAngle,
    formatPositon,
    getMaxHeight,
    addPositionsHeight,
    setPositionsHeight,
    updateHeightForClampToGround,
    getCurrentMousePosition,
    pickCenterPoint,
    GetPercent,
    update3dtilesMaxtrix,
    UaternionInverse,
    getBSRPoints2,
    getBSRPoints3,
    disTance,
    getArea,
  };

  Object.defineProperties(P, {
    Map: {
      get: function () {
        return 0;
      },
      set: function (e) {},
    },
  });

  G.extend({
    P,
  });

  if (typeof window.U === "undefined") {
    window.util = G.P;
  }
})(window);
