'use strict';
/**
 * Visualization map spatial data service R&D 绘制类
 * @author Oran
 * @version 1.1
 * @time 2021/3/25
 */
 (function () {
    var shapeDic = {};
    /**
     * 画折线类
     */
    class PolylineDrawer {
        constructor(viewer, options) {

            this.viewer = viewer;
            this.type = options.type;//判断是否为测量
            this.layerId = 'dl';
            this.dragIcon = options.dragIcon || '/assets/images/spot.png';
            this.dragIconLight = options.dragIconLight || '/assets/images/spot.png';

            this.dragIcon = options.dragIcon || '/assets/images/spot.png';
            this.dragIconLight = options.dragIconLight || '/assets/images/spot.png';
            this.markers = {};
            this.tooltip = new G.U.Tooltip(this.viewer);
            this.tempPositions = [];
            this.positions = [];
            this.ellipsoid = this.viewer.scene.globe.ellipsoid;
            this.okHandler = null;
            this.options = options;
        }
        startDrawPolyline(okHandler) {
            var _this = this;
            var viewer = _this.viewer;
            var style = _this.options._style;

            var floatingPoint = null;
            _this.drawHandler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);

            viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
            _this.drawHandler.setInputAction(function (event) {
                var position = event.position;
                if (!Cesium.defined(position)) { return; }
                var ray = viewer.scene.camera.getPickRay(position);
                if (!Cesium.defined(ray)) { return; }
                var cartesian = viewer.scene.globe.pick(ray, viewer.scene);
                if (!Cesium.defined(cartesian)) { return; }
                var num = _this.positions.length;
                if (num == 0) {
                    _this.positions.push(cartesian);
                    floatingPoint = _this.createPoint(cartesian, 0);
                    _this.showPolyline2Map();//绘制
                }
                _this.positions.push(cartesian);
                var oid = _this.positions.length - 1;
                _this.createPoint(cartesian, oid);
                if(_this.type == "测量"){
                    var num = _this.positions.length;
                    if(num > 2){
                        //坐标转换
                        // var cartographic = Cesium.Cartographic.fromCartesian(_this.positions[_this.positions.length - 1]);
                        _this.viewer.entities.add({
                            name: 'PolylineLabel',
                            position: _this.positions[_this.positions.length - 1],
                            label: {
                                scale: 1,
                                font: '16px Helvetica',
                                text: G.P.disTance( _this.positions[_this.positions.length - 2], _this.positions[_this.positions.length - 3]) + "米",
                                fillColor: style != null ? Cesium.Color.fromCssColorString(style.fillColor).withAlpha(style.labelTransparency / 100) : Cesium.Color.fromCssColorString('#00f').withAlpha(0.9),//绘制时 线条的颜色
                                style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                                translucencyByDistance: new Cesium.NearFarScalar(15, 1, 5000, 10),
                                outlineWidth: style != null ? style.borderWitch : 3,
                                outlineColor: style != null ? Cesium.Color.fromCssColorString(style.outlineColor).withAlpha(style.labelTransparency / 100) : Cesium.Color.fromCssColorString('#00f').withAlpha(0.9),//绘制时 边框的颜色
                                horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
                                showBackground: true,
                                backgroundColor: style != null ? Cesium.Color.fromCssColorString(style.backgroundColor).withAlpha(style.labelTransparency / 100) : Cesium.Color.fromCssColorString('#00226e').withAlpha(0.9),//绘制时 边框的颜色 new Cesium.Color.fromCssColorString("#00226e").withAlpha(30 / 100),
                                disableDepthTestDistance: Number.POSITIVE_INFINITY,
                                // backgroundColor: new Cesium.Color.fromCssColorString("#00226e").withAlpha(50 / 100),
                            }
                        });
                    }else{
                        
                        _this.viewer.entities.add({
                            name: 'PolylineLabel',
                            position: _this.positions[_this.positions.length - 1],
                            label: {
                                scale: 1,
                                font: '16px Helvetica',
                                text: "起点",
                                fillColor: style != null ? Cesium.Color.fromCssColorString(style.fillColor).withAlpha(style.labelTransparency / 100) : Cesium.Color.fromCssColorString('#00f').withAlpha(0.9),//绘制时 线条的颜色
                                style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                                translucencyByDistance: new Cesium.NearFarScalar(15, 1, 5000, 10),
                                outlineWidth: style != null ? style.borderWitch : 3,
                                outlineColor: style != null ? Cesium.Color.fromCssColorString(style.outlineColor).withAlpha(style.labelTransparency / 100) : Cesium.Color.fromCssColorString('#00f').withAlpha(0.9),//绘制时 边框的颜色
                                disableDepthTestDistance: Number.POSITIVE_INFINITY,
                                // backgroundColor: new Cesium.Color.fromCssColorString("#00226e").withAlpha(50 / 100),
                            }
                        });
    
                    }

                }

            }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

            _this.drawHandler.setInputAction(function (event) {
                var position = event.endPosition;
                if (!Cesium.defined(position)) {
                    return;
                }
                if (_this.positions.length < 1) {
                    _this.tooltip.showAt(position, "选择起点");
                    return;
                }
               
                _this.tooltip.showAt(position, tip);
                switch (_this.type) {
                    case "测量":
                        var num = _this.positions.length;
                        if(num > 1){
                            _this.tooltip.showAt(position,G.P.disTance( _this.positions[_this.positions.length - 2], _this.positions[_this.positions.length - 1]) + "米");
                        }
                       
                        break;
                    default:
                        var num = _this.positions.length;
                        var tip = "点击添加下一个点 ";
                        if (num > 2) {
                            tip += "右键结束绘制";
                        }
                        _this.tooltip.showAt(position, tip);
                        break;
                }

                var ray = viewer.scene.camera.getPickRay(position);
                if (!Cesium.defined(ray)) { return; }
                var cartesian = viewer.scene.globe.pick(ray, viewer.scene);
                if (!Cesium.defined(cartesian)) { return; }
                if (floatingPoint) {
                    floatingPoint.position.setValue(cartesian);
                }

                _this.positions.pop();
                _this.positions.push(cartesian);

            }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

            _this.drawHandler.setInputAction(function (event) {
                if (_this.positions.length < 3) {
                    return;
                }
                // console.log('结束')
                _this.positions.pop();
                 _this.viewer.entities.remove(floatingPoint);
                _this.tooltip.setVisible(false);
                var positions = _this.getPositionsWithSid();//结束绘制
                _this.clear();
                // console.log(_this.entity.id,_this.layerId)
                if (okHandler) { okHandler(positions); }
            }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
        }
        showPolyline2Map() {
            var _this = this;
            var style = _this.options._style;
            if (_this.material == null) {
                _this.material = new Cesium.PolylineOutlineMaterialProperty({//PolylineGlowMaterialProperty 发光
                    // glowPower: 0.25,
                    // color: style != null ? Cesium.Color.fromCssColorString(style.borderColor).withAlpha(style.borderTransparency / 100) : Cesium.Color.fromCssColorString('#00f').withAlpha(0.9)//绘制时 线条的颜色
                    // // glowPower : 0.3,
                    color: style != null ? Cesium.Color.fromCssColorString(style.PolylineColor).withAlpha(style.borderTransparency / 100) : Cesium.Color.fromCssColorString('#00f').withAlpha(0.9),//绘制时 线条的颜色
                    outlineWidth: style != null ? style.borderWitch : 3,
                    outlineColor: style != null ? Cesium.Color.fromCssColorString(style.borderColor).withAlpha(style.borderTransparency / 100) : Cesium.Color.fromCssColorString('#00f').withAlpha(0.9)//绘制时 边框的颜色
                    // color : Cesium.Color.PALEGOLDENROD
                });
            }
            var dynamicPositions = new Cesium.CallbackProperty(function () {
                return _this.positions;
            }, false);

            var bData = {
                layerId: _this.layerId,
                polyline: {
                    positions: dynamicPositions,
                    clampToGround: true,
                    width: style != null ? style.PolylineWitch : 8,
                    material: _this.material,

                }
            };
          
            _this.entity = _this.viewer.entities.add(bData);

        }
        showModifyPolyline2Map(objId, oldPositions) {
            var _this = this;
            var style = _this.options._style;

            _this.positions = oldPositions;
            _this.objId = objId;

            _this.startModify();
            _this.computeTempPositions();

            var dynamicPositions = new Cesium.CallbackProperty(function () {
                return _this.tempPositions;
            }, false);

            if (_this.material == null) {
                 _this.material = new Cesium.PolylineOutlineMaterialProperty({//PolylineGlowMaterialProperty 发光
                    // glowPower: 0.25,
                    // color: style != null ? Cesium.Color.fromCssColorString(style.borderColor).withAlpha(style.borderTransparency / 100) : Cesium.Color.fromCssColorString('#00f').withAlpha(0.9)//绘制时 线条的颜色
                    // // glowPower : 0.3,
                    color: style != null ? Cesium.Color.fromCssColorString(style.PolylineColor).withAlpha(style.borderTransparency / 100) : Cesium.Color.fromCssColorString('#00f').withAlpha(0.9),//绘制时 线条的颜色
                    outlineWidth: style != null ? style.borderWitch : 3,
                    outlineColor: style != null ? Cesium.Color.fromCssColorString(style.borderColor).withAlpha(style.borderTransparency / 100) : Cesium.Color.fromCssColorString('#00f').withAlpha(0.9)//绘制时 边框的颜色
                    // color : Cesium.Color.PALEGOLDENROD
                });
            }
            var bData = {
                layerId: _this.layerId,
                shapeType: "Polyline",
                polyline: {
                    positions: dynamicPositions,
                    clampToGround: true,
                    width: style != null ? style.PolylineWitch : 4,
                    material: _this.material
                }
            };
            _this.entity = _this.viewer.entities.add(bData);
            
            var positions = _this.tempPositions;
            for (var i = 0; i < positions.length; i++) {
                var ys = i % 2;
                if (ys == 0) {
                    _this.createPoint(positions[i], i);
                } else {
                    _this.createMidPoint(positions[i], i);
                }
            }
        }
        startModify() {
            var _this = this;
            var isMoving = false;
            var pickedAnchor = null;
            if (_this.drawHandler) {
                _this.drawHandler.destroy();
                _this.drawHandler = null;
            }
            _this.modifyHandler = new Cesium.ScreenSpaceEventHandler(_this.viewer.scene.canvas);

            _this.modifyHandler.setInputAction(function (event) {
                var position = event.position;
                if (!Cesium.defined(position)) {
                    return;
                }
                var ray = _this.viewer.scene.camera.getPickRay(position);
                if (!Cesium.defined(ray)) {
                    return;
                }
                var cartesian = _this.viewer.scene.globe.pick(ray, _this.viewer.scene);
                if (!Cesium.defined(cartesian)) {
                    return;
                }
                if (isMoving) {
                    isMoving = false;
                    pickedAnchor.position.setValue(cartesian);
                    var oid = pickedAnchor.oid;
                    _this.tempPositions[oid] = cartesian;
                    _this.tooltip.setVisible(false);
                    if (pickedAnchor.flag == "mid_anchor") {
                        _this.updateModifyAnchors(oid);
                    }
                } else {
                    var pickedObject = _this.viewer.scene.pick(position);
                    if (!Cesium.defined(pickedObject)) {
                        return;
                    }
                    if (!Cesium.defined(pickedObject.id)) {
                        return;
                    }
                    var entity = pickedObject.id;
                    if (entity.layerId != _this.layerId) {
                        return;
                    }
                    if (entity.flag != "anchor" && entity.flag != "mid_anchor") {
                        return;
                    }
                    pickedAnchor = entity;
                    isMoving = true;
                    if (entity.flag == "anchor") {
                        _this.tooltip.showAt(position, "移动控制点 \n点击右键结束编辑");
                    }
                    if (entity.flag == "mid_anchor") {
                        _this.tooltip.showAt(position, "移动创建新的控制点 \n点击右键结束编辑");
                    }
                }

                shapeDic[_this.objId] = _this.tempPositions;

            }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

            _this.modifyHandler.setInputAction(function (event) {
                if (!isMoving) {
                    return;
                }
                var position = event.endPosition;
                if (!Cesium.defined(position)) {
                    return;
                }
                _this.tooltip.showAt(position, "移动控制点 \n点击右键结束编辑");

                var ray = _this.viewer.scene.camera.getPickRay(position);
                if (!Cesium.defined(ray)) {
                    return;
                }
                var cartesian = _this.viewer.scene.globe.pick(ray, _this.viewer.scene);
                if (!Cesium.defined(cartesian)) {
                    return;
                }
                var oid = pickedAnchor.oid;
                if (pickedAnchor.flag == "anchor") {
                    pickedAnchor.position.setValue(cartesian);
                    _this.tempPositions[oid] = cartesian;
                    //左右两个中点
                    _this.updateNewMidAnchors(oid);
                } else if (pickedAnchor.flag == "mid_anchor") {
                    pickedAnchor.position.setValue(cartesian);
                    _this.tempPositions[oid] = cartesian;
                }
            }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

            _this.modifyHandler.setInputAction(function (movement) {
                if (_this.modifyHandler) {
                    _this.modifyHandler.destroy();
                    _this.modifyHandler = null;
                }

                _this.clear();
            }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
        }
        clear() {
            var _this = this;
            if (_this.drawHandler) {
                _this.drawHandler.destroy();
                _this.drawHandler = null;
            }
            if (_this.modifyHandler) {
                _this.modifyHandler.destroy();
                _this.modifyHandler = null;
            }
            _this.clearMarkers(_this.layerId);
            _this.tooltip.setVisible(false);
        }
        clearMarkers(layerId) {
            var _this = this;
            var viewer = _this.viewer;
            var entityList = viewer.entities.values;
            if (entityList == null || entityList.length < 1) { return; }
            for (var i = 0; i < entityList.length; i++) {
                var entity = entityList[i];
                if (entity.layerId == layerId) {
                    viewer.entities.remove(entity);
                    i--;
                }
            }
        }
        clearAnchors() {
            var _this = this;
            for (var key in _this.markers) {
                var m = _this.markers[key];
                _this.viewer.entities.remove(m);
            }
            _this.markers = {};
        }
        updateModifyAnchors(oid) {
            var _this = this;
            var num = _this.tempPositions.length;
            if (oid == 0 || oid == num - 1) {
                return;
            }
            //重新计算tempPositions
            var p = _this.tempPositions[oid];
            var p1 = _this.tempPositions[oid - 1];
            var p2 = _this.tempPositions[oid + 1];

            //计算中心
            var cp1 = _this.computeCenterPotition(p1, p);
            var cp2 = _this.computeCenterPotition(p, p2);

            //插入点
            var arr = [cp1, p, cp2];
            _this.tempPositions.splice(oid, 1, cp1, p, cp2);

            //重新加载锚点
            _this.clearAnchors(_this.layerId);
            var positions = _this.tempPositions;
            for (var i = 0; i < positions.length; i++) {
                var ys = i % 2;
                if (ys == 0) {
                    _this.createPoint(positions[i], i);
                } else {
                    _this.createMidPoint(positions[i], i);
                }
            }
        }
        updateNewMidAnchors(oid) {
            var _this = this;
            if (oid == null || oid == undefined) {
                return;
            }
            //左边两个中点，oid2为临时中间点
            var oid1 = null;
            var oid2 = null;
            //右边两个中点，oid3为临时中间点
            var oid3 = null;
            var oid4 = null;

            var num = _this.tempPositions.length;
            if (oid == 0) {
                oid1 = num - 2;
                oid2 = num - 1;
                oid3 = oid + 1;
                oid4 = oid + 2;
            } else if (oid == num - 2) {
                oid1 = oid - 2;
                oid2 = oid - 1;
                oid3 = num - 1;
                oid4 = 0;
            } else {
                oid1 = oid - 2;
                oid2 = oid - 1;
                oid3 = oid + 1;
                oid4 = oid + 2;
            }

            var c1 = _this.tempPositions[oid1];
            var c = _this.tempPositions[oid];
            var c4 = _this.tempPositions[oid4];

            if (oid == 0) {
                var c3 = _this.computeCenterPotition(c4, c);
                _this.tempPositions[oid3] = c3;
                _this.markers[oid3].position.setValue(c3);
            } else if (oid == num - 1) {
                var c2 = _this.computeCenterPotition(c1, c);
                _this.tempPositions[oid2] = c2;
                _this.markers[oid2].position.setValue(c2);
            } else {
                var c2 = _this.computeCenterPotition(c1, c);
                var c3 = _this.computeCenterPotition(c4, c);
                _this.tempPositions[oid2] = c2;
                _this.tempPositions[oid3] = c3;
                _this.markers[oid2].position.setValue(c2);
                _this.markers[oid3].position.setValue(c3);
            }
        }
        computeTempPositions() {
            var _this = this;

            var pnts = [].concat(_this.positions);
            var num = pnts.length;
            _this.tempPositions = [];
            for (var i = 1; i < num; i++) {
                var p1 = pnts[i - 1];
                var p2 = pnts[i];
                p1.sid = i - 1;
                p2.sid = i;
                var cp = _this.computeCenterPotition(p1, p2);
                _this.tempPositions.push(p1);
                _this.tempPositions.push(cp);
            }
            var last = pnts[num - 1];
            _this.tempPositions.push(last);
        }
        computeCenterPotition(p1, p2) {
            var _this = this;
            var c1 = _this.ellipsoid.cartesianToCartographic(p1);
            var c2 = _this.ellipsoid.cartesianToCartographic(p2);
            var cm = new Cesium.EllipsoidGeodesic(c1, c2).interpolateUsingFraction(0.5);
            var cp = _this.ellipsoid.cartographicToCartesian(cm);
            return cp;
        }
        createPoint(cartesian, oid) {
            var _this = this;
            var point = _this.viewer.entities.add({
                position: cartesian,
                billboard: {
                    image: _this.dragIconLight,
                    // eyeOffset: new Cesium.ConstantProperty(new Cesium.Cartesian3(0, 0, -10)),
                    heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
                    disableDepthTestDistance: Number.POSITIVE_INFINITY
                    
                }
            });
            point.oid = oid;
            point.sid = cartesian.sid; //记录原始序号
            point.layerId = _this.layerId;
            point.flag = "anchor";
            _this.markers[oid] = point;
            return point;
        }
        createMidPoint(cartesian, oid) {
            var _this = this;
            var point = _this.viewer.entities.add({
                position: cartesian,
                billboard: {
                    image: _this.dragIcon,
                    // eyeOffset: new Cesium.ConstantProperty(new Cesium.Cartesian3(0, 0, -10)),
                    heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
                    disableDepthTestDistance: Number.POSITIVE_INFINITY
                }
            });
            point.oid = oid;
            point.layerId = _this.layerId;
            point.flag = "mid_anchor";
            _this.markers[oid] = point;
            return point;
        }
        getPositionsWithSid() {
            var _this = this;
            var viewer = _this.viewer;
            var rlt = [];
            var entityList = viewer.entities.values;
            if (entityList == null || entityList.length < 1) {
                return rlt;
            }
            for (var i = 0; i < entityList.length; i++) {
                var entity = entityList[i];
                if (entity.layerId != _this.layerId) {
                    continue;
                }
                if (entity.flag != "anchor") {
                    continue;
                }
                var p = entity.position.getValue(new Date().getTime());
                p.sid = entity.sid;
                p.oid = entity.oid;
                rlt.push(p);
            }
            //排序
            rlt.sort(function (obj1, obj2) {
                if (obj1.oid > obj2.oid) {
                    return 1;
                }
                else if (obj1.oid == obj2.oid) {
                    return 0;
                }
                else {
                    return -1;
                }
            });
            return rlt;
        }
        getLonLats(positions) {
            var _this = this;
            var arr = [];
            for (var i = 0; i < positions.length; i++) {
                var c = positions[i];
                var p = _this.getLonLat(c);
                p.sid = c.sid;
                p.oid = c.oid;
                arr.push(p);
            }
            return arr;
        }
        getLonLat(cartesian) {
            var _this = this;
            console.log(cartesian)
            var cartographic = _this.ellipsoid.cartesianToCartographic(cartesian);
            cartographic.height = _this.viewer.scene.globe.getHeight(cartographic);
            var pos = {
                lon: cartographic.longitude,
                lat: cartographic.latitude,
                alt: cartographic.height,
                height: cartographic.height
            };
            pos.lon = Cesium.Math.toDegrees(pos.lon);
            pos.lat = Cesium.Math.toDegrees(pos.lat);
            return pos;
        }
    }

    /**
     * 画面类
     */
    class PolygonDrawer {
        constructor(viewer, options) {
            this.viewer = viewer;
            this.type = options.type;//判断是否为测量
            this.layerId = 'pd';
            this.dragIcon = options.dragIcon || '/assets/images/spot.png';
            this.dragIconLight = options.dragIconLight || '/assets/images/spot.png';
            this.markers = {};
            this.tooltip =  new G.U.Tooltip(this.viewer);
            this.tempPositions = [];
            this.positions = [];
            this.ellipsoid = this.viewer.scene.globe.ellipsoid;
            this.okHandler = null;
            this.options = options;
        }
        startDrawPolygon(okHandler) {
            var _this = this;
            var viewer = _this.viewer;
            var floatingPoint = null;
            _this.drawHandler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);

            var style = _this.options._style;
            
            viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
            _this.drawHandler.setInputAction(function (event) {

                var position = event.position;
                if (!Cesium.defined(position)) { return; }
                var ray = viewer.scene.camera.getPickRay(position);
                if (!Cesium.defined(ray)) { return; }
                var cartesian = viewer.scene.globe.pick(ray, viewer.scene);
                if (!Cesium.defined(cartesian)) { return; }
                var num = _this.positions.length;
                if (num == 0) {
                    _this.positions.push(cartesian);
                    floatingPoint = _this.createPoint(cartesian, -1);
                    _this.showRegion2Map();
                }
                _this.positions.push(cartesian);
                var oid = _this.positions.length - 2;
                _this.createPoint(cartesian, oid);

                if(_this.type == "测量"){
                    var num = _this.positions.length;
                    if(num > 3){
                    }else{
                        
                        _this.viewer.entities.add({
                            name: 'PolygonLabel',
                            position: _this.positions[0],
                            label: {
                                scale: 1,
                                font: '16px Helvetica',
                                text: "起点",
                                fillColor: style != null ? Cesium.Color.fromCssColorString(style.fillColor).withAlpha(style.labelTransparency / 100) : Cesium.Color.fromCssColorString('#00f').withAlpha(0.9),//绘制时 线条的颜色
                                style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                                translucencyByDistance: new Cesium.NearFarScalar(15, 1, 5000, 10),
                                outlineWidth: style != null ? style.borderWitch : 3,
                                outlineColor: style != null ? Cesium.Color.fromCssColorString(style.outlineColor).withAlpha(style.labelTransparency / 100) : Cesium.Color.fromCssColorString('#00f').withAlpha(0.9),//绘制时 边框的颜色
                                disableDepthTestDistance: Number.POSITIVE_INFINITY,
                                // backgroundColor: new Cesium.Color.fromCssColorString("#00226e").withAlpha(50 / 100),
                            }
                        });
    
                    }

                }

            }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

            _this.drawHandler.setInputAction(function (event) {

                var position = event.endPosition;
                if (!Cesium.defined(position)) {
                    return;
                }
                if (_this.positions.length < 1) {
                    _this.tooltip.showAt(position, "选择起点");
                    return;
                }
                switch (_this.type) {
                    case "测量":
                        var num = _this.positions.length;
                        if(num > 2){
                            var tempPoints = [];
                            _this.positions.forEach(element => {
                                var cartographic = Cesium.Cartographic.fromCartesian(element);
                                var longitudeString = Cesium.Math.toDegrees(cartographic.longitude);
                                var latitudeString = Cesium.Math.toDegrees(cartographic.latitude);
                                var heightString = cartographic.height;
                                tempPoints.push({ lon: longitudeString, lat: latitudeString ,hei:heightString});
                            });
                            var textArea = G.P.getArea(tempPoints).toFixed(5) + "平方公里";
                            _this.tooltip.showAt(position,textArea);
                        }
                        break;
                }

                var ray = viewer.scene.camera.getPickRay(position);
                if (!Cesium.defined(ray)) { return; }
                var cartesian = viewer.scene.globe.pick(ray, viewer.scene);
                if (!Cesium.defined(cartesian)) { return; }
                floatingPoint.position.setValue(cartesian);
                _this.positions.pop();
                _this.positions.push(cartesian);
            }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

            _this.drawHandler.setInputAction(function (event) {
                if (_this.positions.length < 4) {
                    return;
                }

                

                _this.positions.pop();
                _this.viewer.entities.remove(floatingPoint);
                _this.tooltip.setVisible(false);

                var positions = _this.getPositionsWithSid();

                if(_this.type == "测量"){
                    var tempPoints = [];
                    _this.positions.forEach(element => {
                        var cartographic = Cesium.Cartographic.fromCartesian(element);
                        var longitudeString = Cesium.Math.toDegrees(cartographic.longitude);
                        var latitudeString = Cesium.Math.toDegrees(cartographic.latitude);
                        var heightString = cartographic.height;
                        tempPoints.push({ lon: longitudeString, lat: latitudeString ,hei:heightString});
                    });
                    var textArea = G.P.getArea(tempPoints).toFixed(5) + "平方公里";
                    _this.viewer.entities.add({
                        name: 'PolygonLabel',
                        position:  _this.positions[_this.positions.length - 1],
                        label: {
                            scale: 1,
                            font: '16px Helvetica',
                            text:  textArea,
                            fillColor: style != null ? Cesium.Color.fromCssColorString(style.fillColor).withAlpha(style.labelTransparency / 100) : Cesium.Color.fromCssColorString('#00f').withAlpha(0.9),//绘制时 线条的颜色
                            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                            translucencyByDistance: new Cesium.NearFarScalar(15, 1, 5000, 10),
                            outlineWidth: style != null ? style.borderWitch : 3,
                            horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
                            showBackground: true,
                            outlineColor: style != null ? Cesium.Color.fromCssColorString(style.outlineColor).withAlpha(style.labelTransparency / 100) : Cesium.Color.fromCssColorString('#00f').withAlpha(0.9),//绘制时 边框的颜色
                            backgroundColor:  style != null ? Cesium.Color.fromCssColorString(style.backgroundColor).withAlpha(style.labelTransparency / 100) : Cesium.Color.fromCssColorString('#00226e').withAlpha(0.9),//绘制时 边框的颜色 new Cesium.Color.fromCssColorString("#00226e").withAlpha(30 / 100),
                            disableDepthTestDistance: Number.POSITIVE_INFINITY,
                            // backgroundColor: new Cesium.Color.fromCssColorString("#00226e").withAlpha(50 / 100),
                        }
                    });
                }

                _this.clear();
                if (okHandler) { okHandler(positions); }

            }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
        }
        showRegion2Map() {
            var _this = this;
            var style = _this.options._style;
            if (_this.material == null) {
                _this.material = style != null ? Cesium.Color.fromCssColorString(style.shapeColor).withAlpha(style.shapeTransparency / 100) : Cesium.Color.fromCssColorString('#00f').withAlpha(0.5);//绘制时的面的颜色
            }
            if (_this.outlineMaterial == null) {
                _this.outlineMaterial = new Cesium.PolylineOutlineMaterialProperty({//PolylineGlowMaterialProperty 发光
                    color: style != null ? Cesium.Color.fromCssColorString(style.borderColor).withAlpha(style.borderTransparency / 100) : Cesium.Color.fromCssColorString('#00f').withAlpha(0.9),//绘制时 线条的颜色
                    outlineColor: style != null ? Cesium.Color.fromCssColorString(style.borderColor).withAlpha(style.borderTransparency / 100) : Cesium.Color.fromCssColorString('#00f').withAlpha(0.9)//绘制时 边框的颜色
                });
            }
            var dynamicPositions = new Cesium.CallbackProperty(function () {
                return new Cesium.PolygonHierarchy(_this.positions);
            }, false);

            var outlineDynamicPositions = new Cesium.CallbackProperty(function () {
                if (_this.positions.length > 1) {
                    var arr = [].concat(_this.positions);
                    var first = _this.positions[0];
                    arr.push(first);
                    return arr;
                } else {
                    return null;
                }
            }, false);
            var bData = {
                layerId: _this.layerId,
                polygon: new Cesium.PolygonGraphics({
                    hierarchy: dynamicPositions,
                    material: _this.material,
                    show: _this.fill
                }),
                polyline: {
                    positions: outlineDynamicPositions,
                    clampToGround: true,
                    width: style != null ? style.borderWitch : 3,
                    material: _this.outlineMaterial,
                    show: _this.outline
                }
            };
            if (_this.extrudedHeight > 0) {
                bData.polygon.extrudedHeight = _this.extrudedHeight;
                bData.polygon.extrudedHeightReference = Cesium.HeightReference.RELATIVE_TO_GROUND;
                bData.polygon.closeTop = true;
                bData.polygon.closeBottom = true;
            }
            _this.entity = _this.viewer.entities.add(bData);
        }
        showModifyRegion2Map(objId, oldPositions, positionList) {
            var _this = this;

            _this.positions = oldPositions;
            if (_this.positions == null) {
                _this.positions = positionList;
            }
            _this.objId = objId;

            _this.startModify();
            _this.computeTempPositions(positionList);

            var style = _this.options._style;
            if (_this.material == null) {
                _this.material = style != null ? Cesium.Color.fromCssColorString(style.shapeColor).withAlpha(style.shapeTransparency / 100) : Cesium.Color.fromCssColorString('#00f').withAlpha(0.5);//绘制时的面的颜色
            }
            if (_this.outlineMaterial == null) {
                _this.outlineMaterial = new Cesium.PolylineOutlineMaterialProperty({//PolylineGlowMaterialProperty 发光
                    color: style != null ? Cesium.Color.fromCssColorString(style.borderColor).withAlpha(style.borderTransparency / 100) : Cesium.Color.fromCssColorString('#00f').withAlpha(0.9),//绘制时 线条的颜色
                    outlineColor: style != null ? Cesium.Color.fromCssColorString(style.borderColor).withAlpha(style.borderTransparency / 100) : Cesium.Color.fromCssColorString('#00f').withAlpha(0.9)//绘制时 边框的颜色
                });
            }

            var dynamicPositions = new Cesium.CallbackProperty(function () {
                var hierarchy = new Cesium.PolygonHierarchy(_this.tempPositions);
                return hierarchy;
            }, false);



            var outlineDynamicPositions = new Cesium.CallbackProperty(function () {
                if (_this.tempPositions.length > 1) {
                    var arr = [].concat(_this.tempPositions);
                    var first = _this.tempPositions[0];
                    arr.push(first);
                    return arr;
                } else {
                    return null;
                }
            }, false);
            var bData = {
                layerId: _this.layerId,
                polygon: new Cesium.PolygonGraphics({
                    hierarchy: dynamicPositions,
                    material: _this.material,
                    show: _this.fill
                }),
                polyline: {
                    positions: outlineDynamicPositions,
                    clampToGround: true,
                    width: _this.outlineWidth,
                    material: _this.outlineMaterial,
                    show: _this.outline
                }
            };
            if (_this.extrudedHeight > 0) {
                bData.polygon.extrudedHeight = _this.extrudedHeight;
                bData.polygon.extrudedHeightReference = Cesium.HeightReference.RELATIVE_TO_GROUND;
                bData.polygon.closeTop = true;
                bData.polygon.closeBottom = true;
            }
            _this.entity = _this.viewer.entities.add(bData);

            var positions = _this.tempPositions;
            for (var i = 0; i < positions.length; i++) {
                var ys = i % 2;
                if (ys == 0) {
                    _this.createPoint(positions[i], i);
                } else {
                    _this.createMidPoint(positions[i], i);
                }
            }
        }
        startModify() {
            var _this = this;
            var isMoving = false;
            var pickedAnchor = null;
            if (_this.drawHandler) {
                _this.drawHandler.destroy();
                _this.drawHandler = null;
            }
            _this.modifyHandler = new Cesium.ScreenSpaceEventHandler(_this.viewer.scene.canvas);

            _this.modifyHandler.setInputAction(function (event) {
                var position = event.position;
                if (!Cesium.defined(position)) {
                    return;
                }
                var ray = _this.viewer.scene.camera.getPickRay(position);
                if (!Cesium.defined(ray)) {
                    return;
                }
                var cartesian = _this.viewer.scene.globe.pick(ray, _this.viewer.scene);
                if (!Cesium.defined(cartesian)) {
                    return;
                }
                if (isMoving) {
                    isMoving = false;
                    pickedAnchor.position.setValue(cartesian);
                    var oid = pickedAnchor.oid;
                    _this.tempPositions[oid] = cartesian;
                    _this.tooltip.setVisible(false);
                    if (pickedAnchor.flag == "mid_anchor") {
                        _this.updateModifyAnchors(oid);
                    }
                } else {
                    var pickedObject = _this.viewer.scene.pick(position);
                    if (!Cesium.defined(pickedObject)) {
                        return;
                    }
                    if (!Cesium.defined(pickedObject.id)) {
                        return;
                    }
                    var entity = pickedObject.id;
                    if (entity.layerId != _this.layerId) {
                        return;
                    }
                    if (entity.flag != "anchor" && entity.flag != "mid_anchor") {
                        return;
                    }
                    pickedAnchor = entity;
                    isMoving = true;
                    if (entity.flag == "anchor") {
                        _this.tooltip.showAt(position, "移动控制点 \n点击右键结束编辑");
                    }
                    if (entity.flag == "mid_anchor") {
                        _this.tooltip.showAt(position, "移动创建新的控制点 \n点击右键结束编辑");
                    }
                }

                shapeDic[_this.objId] = _this.tempPositions;

            }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

            _this.modifyHandler.setInputAction(function (event) {
                if (!isMoving) {
                    return;
                }
                var position = event.endPosition;
                if (!Cesium.defined(position)) {
                    return;
                }
                _this.tooltip.showAt(position, "移动控制点 \n点击右键结束编辑");

                var ray = _this.viewer.scene.camera.getPickRay(position);
                if (!Cesium.defined(ray)) {
                    return;
                }
                var cartesian = _this.viewer.scene.globe.pick(ray, _this.viewer.scene);
                if (!Cesium.defined(cartesian)) {
                    return;
                }
                var oid = pickedAnchor.oid;
                if (pickedAnchor.flag == "anchor") {
                    pickedAnchor.position.setValue(cartesian);
                    _this.tempPositions[oid] = cartesian;
                    //左右两个中点
                    _this.updateNewMidAnchors(oid);
                } else if (pickedAnchor.flag == "mid_anchor") {
                    pickedAnchor.position.setValue(cartesian);
                    _this.tempPositions[oid] = cartesian;
                }
            }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

            _this.modifyHandler.setInputAction(function (movement) {
                if (_this.modifyHandler) {
                    _this.modifyHandler.destroy();
                    _this.modifyHandler = null;
                }

                _this.clear();
            }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
        }
        clear() {
            var _this = this;
            if (_this.drawHandler) {
                _this.drawHandler.destroy();
                _this.drawHandler = null;
            }
            if (_this.modifyHandler) {
                _this.modifyHandler.destroy();
                _this.modifyHandler = null;
            }
            _this.clearMarkers(_this.layerId);
            _this.tooltip.setVisible(false);
        }
        clearMarkers(layerId) {
            var _this = this;
            var viewer = _this.viewer;
            var entityList = viewer.entities.values;
            if (entityList == null || entityList.length < 1) { return; }
            for (var i = 0; i < entityList.length; i++) {
                var entity = entityList[i];
                if (entity.layerId == layerId) {
                    viewer.entities.remove(entity);
                    i--;
                }
            }
        }
        clearAnchors() {
            var _this = this;
            for (var key in _this.markers) {
                var m = _this.markers[key];
                _this.viewer.entities.remove(m);
            }
            _this.markers = {};
        }
        updateModifyAnchors(oid) {
            var _this = this;
            var num = _this.tempPositions.length;
            if (oid == 0 || oid == num - 1) {
                return;
            }
            //重新计算tempPositions
            var p = _this.tempPositions[oid];
            var p1 = _this.tempPositions[oid - 1];
            var p2 = _this.tempPositions[oid + 1];

            //计算中心
            var cp1 = _this.computeCenterPotition(p1, p);
            var cp2 = _this.computeCenterPotition(p, p2);

            //插入点
            var arr = [cp1, p, cp2];
            _this.tempPositions.splice(oid, 1, cp1, p, cp2);

            //重新加载锚点
            _this.clearAnchors(_this.layerId);
            var positions = _this.tempPositions;
            for (var i = 0; i < positions.length; i++) {
                var ys = i % 2;
                if (ys == 0) {
                    _this.createPoint(positions[i], i);
                } else {
                    _this.createMidPoint(positions[i], i);
                }
            }
        }
        updateNewMidAnchors(oid) {
            var _this = this;
            if (oid == null || oid == undefined) {
                return;
            }
            //左边两个中点，oid2为临时中间点
            var oid1 = null;
            var oid2 = null;
            //右边两个中点，oid3为临时中间点
            var oid3 = null;
            var oid4 = null;

            var num = _this.tempPositions.length;
            if (oid == 0) {
                oid1 = num - 2;
                oid2 = num - 1;
                oid3 = oid + 1;
                oid4 = oid + 2;
            } else if (oid == num - 2) {
                oid1 = oid - 2;
                oid2 = oid - 1;
                oid3 = num - 1;
                oid4 = 0;
            } else {
                oid1 = oid - 2;
                oid2 = oid - 1;
                oid3 = oid + 1;
                oid4 = oid + 2;
            }

            var c1 = _this.tempPositions[oid1];
            var c = _this.tempPositions[oid];
            var c4 = _this.tempPositions[oid4];

            if (oid == 0) {
                var c3 = _this.computeCenterPotition(c4, c);
                _this.tempPositions[oid3] = c3;
                _this.markers[oid3].position.setValue(c3);
            } else if (oid == num - 1) {
                var c2 = _this.computeCenterPotition(c1, c);
                _this.tempPositions[oid2] = c2;
                _this.markers[oid2].position.setValue(c2);
            } else {
                var c2 = _this.computeCenterPotition(c1, c);
                var c3 = _this.computeCenterPotition(c4, c);
                _this.tempPositions[oid2] = c2;
                _this.tempPositions[oid3] = c3;
                _this.markers[oid2].position.setValue(c2);
                _this.markers[oid3].position.setValue(c3);
            }
        }
        computeTempPositions(positionList) {
            var _this = this;

            var pnts = [].concat(_this.positions == null ? positionList : _this.positions);
            console.log(_this.positions)
            var num = pnts.length;
            var first = pnts[0];
            var last = pnts[num - 1];
            console.log(last)
            if (_this.isSimpleXYZ(first, last) == false) {
                pnts.push(first);
                num += 1;
            }
            _this.tempPositions = [];
            for (var i = 1; i < num; i++) {
                var p1 = pnts[i - 1];
                var p2 = pnts[i];
                var cp = _this.computeCenterPotition(p1, p2);
                _this.tempPositions.push(p1);
                _this.tempPositions.push(cp);
            }
        }
        computeCenterPotition(p1, p2) {
            var _this = this;
            var c1 = _this.ellipsoid.cartesianToCartographic(p1);
            var c2 = _this.ellipsoid.cartesianToCartographic(p2);
            var cm = new Cesium.EllipsoidGeodesic(c1, c2).interpolateUsingFraction(0.5);
            var cp = _this.ellipsoid.cartographicToCartesian(cm);
            return cp;
        }
        createPoint(cartesian, oid) {
            var _this = this;
            var point = _this.viewer.entities.add({
                position: cartesian,
                billboard: {
                    image: _this.dragIconLight,
                    //eyeOffset: new Cesium.ConstantProperty(new Cesium.Cartesian3(0, 0, -500)),
                    heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
                    disableDepthTestDistance: Number.POSITIVE_INFINITY
                }
            });
            point.oid = oid;
            point.sid = cartesian.sid; //记录原始序号
            point.layerId = _this.layerId;
            point.flag = "anchor";
            _this.markers[oid] = point;
            return point;
        }
        createMidPoint(cartesian, oid) {
            var _this = this;
            var point = _this.viewer.entities.add({
                position: cartesian,
                billboard: {
                    image: _this.dragIcon,
                    //eyeOffset: new Cesium.ConstantProperty(new Cesium.Cartesian3(0, 0, -500)),
                    heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
                    disableDepthTestDistance: Number.POSITIVE_INFINITY
                }
            });
            point.oid = oid;
            point.layerId = _this.layerId;
            point.flag = "mid_anchor";
            _this.markers[oid] = point;
            return point;
        }
        getPositionsWithSid() {
            var _this = this;
            var viewer = _this.viewer;
            var rlt = [];
            var entityList = viewer.entities.values;
            if (entityList == null || entityList.length < 1) {
                return rlt;
            }
            for (var i = 0; i < entityList.length; i++) {
                var entity = entityList[i];
                if (entity.layerId != _this.layerId) {
                    continue;
                }
                if (entity.flag != "anchor") {
                    continue;
                }
                var p = entity.position.getValue(new Date().getTime());
                p.sid = entity.sid;
                p.oid = entity.oid;
                rlt.push(p);
            }
            //排序
            rlt.sort(function (obj1, obj2) {
                if (obj1.oid > obj2.oid) {
                    return 1;
                }
                else if (obj1.oid == obj2.oid) {
                    return 0;
                }
                else {
                    return -1;
                }
            });
            return rlt;
        }
        getLonLats(positions) {
            var _this = this;
            var arr = [];
            for (var i = 0; i < positions.length; i++) {
                var c = positions[i];
                var p = _this.getLonLat(c);
                p.sid = c.sid;
                p.oid = c.oid;
                arr.push(p);
            }
            return arr;
        }
        getLonLat(cartesian) {
            var _this = this;
            var cartographic = _this.ellipsoid.cartesianToCartographic(cartesian);
            cartographic.height = _this.viewer.scene.globe.getHeight(cartographic);
            var pos = {
                lon: cartographic.longitude,
                lat: cartographic.latitude,
                alt: cartographic.height,
                height: cartographic.height
            };
            pos.lon = Cesium.Math.toDegrees(pos.lon);
            pos.lat = Cesium.Math.toDegrees(pos.lat);
            return pos;
        }
        isSimpleXYZ(p1, p2) {
            if (p1.x == p2.x && p1.y == p2.y && p1.z == p2.z) {
                return true;
            }
            return false;
        }
    }

    /**
     * 画矩形类
     */
    class RectangleDrawer {
        constructor(viewer, options) {
            this.viewer = viewer;
            this.layerId = 'rd';
            this.dragIcon = options.dragIcon || '/assets/images/spot.png';
            this.dragIconLight = options.dragIconLight || '/assets/images/spot.png';

            this.markers = {};
            this.tooltip =  new G.U.Tooltip(this.viewer);
            this.tempPositions = [];
            this.positions = [];
            this.ellipsoid = this.viewer.scene.globe.ellipsoid;
            this.okHandler = null;
            this.options = options;
        }
        startDrawRectangle(okHandler) {
            var _this = this;
            var viewer = _this.viewer;

            var floatingPoint = null;
            _this.drawHandler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);

            viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
            _this.drawHandler.setInputAction(function (event) {

                var position = event.position;
                if (!Cesium.defined(position)) { return; }
                var ray = viewer.scene.camera.getPickRay(position);
                if (!Cesium.defined(ray)) { return; }
                var cartesian = viewer.scene.globe.pick(ray, viewer.scene);
                if (!Cesium.defined(cartesian)) { return; }
                var num = _this.positions.length;
                if (num == 0) {
                    _this.positions.push(cartesian);
                    floatingPoint = _this.createPoint(cartesian, -1);
                    _this.showRegion2Map();
                }
                _this.positions.push(cartesian);
                var oid = _this.positions.length - 2;
                _this.createPoint(cartesian, oid);
                if (num > 1) {
                    _this.positions.pop();
                    _this.viewer.entities.remove(floatingPoint);
                    _this.tooltip.setVisible(false);

                    var positions = _this.positions;
                    _this.clear();

                    if (okHandler) { okHandler(positions); }
                }
            }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

            _this.drawHandler.setInputAction(function (event) {

                var position = event.endPosition;
                if (!Cesium.defined(position)) {
                    return;
                }
                if (_this.positions.length < 1) {
                    _this.tooltip.showAt(position, "选择起点");
                    return;
                }

                _this.tooltip.showAt(position, "选择终点");

                var ray = viewer.scene.camera.getPickRay(position);
                if (!Cesium.defined(ray)) { return; }
                var cartesian = viewer.scene.globe.pick(ray, viewer.scene);
                if (!Cesium.defined(cartesian)) { return; }
                floatingPoint.position.setValue(cartesian);
                _this.positions.pop();
                _this.positions.push(cartesian);
            }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

        }
        showRegion2Map() {
            var _this = this;
            if (_this.material == null) {
                _this.material = Cesium.Color.fromCssColorString('#fff').withAlpha(0.5);
            }
            if (_this.outlineMaterial == null) {
                _this.outlineMaterial = new Cesium.PolylineDashMaterialProperty({
                    dashLength: 16,
                    color: Cesium.Color.fromCssColorString('#fff').withAlpha(0.7)
                });
            }

            var dynamicPositions = new Cesium.CallbackProperty(function () {
                if (_this.positions.length > 1) {
                    var rect = Cesium.Rectangle.fromCartesianArray(_this.positions);
                    return rect;
                } else {
                    return null;
                }
            }, false);

            var outlineDynamicPositions = new Cesium.CallbackProperty(function () {
                if (_this.positions.length > 1) {
                    var rect = Cesium.Rectangle.fromCartesianArray(_this.positions);
                    var arr = [rect.west, rect.north, rect.east, rect.north, rect.east, rect.south, rect.west, rect.south, rect.west, rect.north];
                    var positions = Cesium.Cartesian3.fromRadiansArray(arr);
                    return positions;
                } else {
                    return null;
                }
            }, false);
            var bData = {
                layerId: _this.layerId,
                rectangle: {
                    coordinates: dynamicPositions,
                    material: _this.material,
                    show: _this.fill
                },
                polyline: {
                    positions: outlineDynamicPositions,
                    clampToGround: true,
                    width: _this.outlineWidth,
                    material: _this.outlineMaterial,
                    show: _this.outline
                }
            };
            if (_this.extrudedHeight > 0) {
                bData.rectangle.extrudedHeight = _this.extrudedHeight;
                bData.rectangle.extrudedHeightReference = Cesium.HeightReference.RELATIVE_TO_GROUND;
                bData.rectangle.closeTop = true;
                bData.rectangle.closeBottom = true;
                bData.rectangle.outline = false;
                bData.rectangle.outlineWidth = 0;
            }
            _this.entity = _this.viewer.entities.add(bData);
        }
        showModifyRegion2Map(objId, oldPositions) {
            var _this = this;

            _this.positions = oldPositions;
            _this.objId = objId;

            _this.startModify();

            if (_this.material == null) {
                _this.material = Cesium.Color.fromCssColorString('#fff').withAlpha(0.5);
            }
            if (_this.outlineMaterial == null) {
                _this.outlineMaterial = new Cesium.PolylineDashMaterialProperty({
                    dashLength: 16,
                    color: Cesium.Color.fromCssColorString('#fff').withAlpha(0.7)
                });
            }

            var dynamicPositions = new Cesium.CallbackProperty(function () {
                if (_this.positions.length > 1) {
                    var rect = Cesium.Rectangle.fromCartesianArray(_this.positions);
                    return rect;
                } else {
                    return null;
                }
            }, false);

            var outlineDynamicPositions = new Cesium.CallbackProperty(function () {
                if (_this.positions.length > 1) {
                    var rect = Cesium.Rectangle.fromCartesianArray(_this.positions);
                    var arr = [rect.west, rect.north, rect.east, rect.north, rect.east, rect.south, rect.west, rect.south, rect.west, rect.north];
                    var positions = Cesium.Cartesian3.fromRadiansArray(arr);
                    return positions;
                } else {
                    return null;
                }
            }, false);
            var bData = {
                layerId: _this.layerId,
                rectangle: {
                    coordinates: dynamicPositions,
                    material: _this.material,
                    show: _this.fill
                },
                polyline: {
                    positions: outlineDynamicPositions,
                    clampToGround: true,
                    width: _this.outlineWidth,
                    material: _this.outlineMaterial,
                    show: _this.outline
                }
            };
            if (_this.extrudedHeight > 0) {
                bData.rectangle.extrudedHeight = _this.extrudedHeight;
                bData.rectangle.extrudedHeightReference = Cesium.HeightReference.RELATIVE_TO_GROUND;
                bData.rectangle.closeTop = true;
                bData.rectangle.closeBottom = true;
                bData.rectangle.outline = false;
                bData.rectangle.outlineWidth = 0;
            }
            _this.entity = _this.viewer.entities.add(bData);

            var positions = _this.positions;
            for (var i = 0; i < positions.length; i++) {
                _this.createPoint(positions[i], i);
            }
        }
        startModify() {
            var _this = this;
            var isMoving = false;
            var pickedAnchor = null;
            if (_this.drawHandler) {
                _this.drawHandler.destroy();
                _this.drawHandler = null;
            }
            _this.modifyHandler = new Cesium.ScreenSpaceEventHandler(_this.viewer.scene.canvas);

            _this.modifyHandler.setInputAction(function (event) {
                var position = event.position;
                if (!Cesium.defined(position)) {
                    return;
                }
                var ray = _this.viewer.scene.camera.getPickRay(position);
                if (!Cesium.defined(ray)) {
                    return;
                }
                var cartesian = _this.viewer.scene.globe.pick(ray, _this.viewer.scene);
                if (!Cesium.defined(cartesian)) {
                    return;
                }
                if (isMoving) {
                    isMoving = false;
                    pickedAnchor.position.setValue(cartesian);
                    var oid = pickedAnchor.oid;
                    _this.positions[oid] = cartesian;
                    _this.tooltip.setVisible(false);
                } else {
                    var pickedObject = _this.viewer.scene.pick(position);
                    if (!Cesium.defined(pickedObject)) {
                        return;
                    }
                    if (!Cesium.defined(pickedObject.id)) {
                        return;
                    }
                    var entity = pickedObject.id;
                    if (entity.layerId != _this.layerId || entity.flag != "anchor") {
                        return;
                    }

                    pickedAnchor = entity;
                    isMoving = true;
                    _this.tooltip.showAt(position, "移动控制点");
                }

                shapeDic[_this.objId] = _this.positions;

            }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

            _this.modifyHandler.setInputAction(function (event) {
                if (!isMoving) {
                    return;
                }
                var position = event.endPosition;
                if (!Cesium.defined(position)) {
                    return;
                }
                _this.tooltip.showAt(position, "移动控制点");

                var ray = _this.viewer.scene.camera.getPickRay(position);
                if (!Cesium.defined(ray)) {
                    return;
                }
                var cartesian = _this.viewer.scene.globe.pick(ray, _this.viewer.scene);
                if (!Cesium.defined(cartesian)) {
                    return;
                }
                var oid = pickedAnchor.oid;
                pickedAnchor.position.setValue(cartesian);
                _this.positions[oid] = cartesian;
            }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

            _this.modifyHandler.setInputAction(function (movement) {
                if (_this.modifyHandler) {
                    _this.modifyHandler.destroy();
                    _this.modifyHandler = null;
                }

                _this.clear();
            }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
        }
        clear() {
            var _this = this;
            if (_this.drawHandler) {
                _this.drawHandler.destroy();
                _this.drawHandler = null;
            }
            if (_this.modifyHandler) {
                _this.modifyHandler.destroy();
                _this.modifyHandler = null;
            }
            _this.clearMarkers(_this.layerId);
            _this.tooltip.setVisible(false);
        }
        clearMarkers(layerId) {
            var _this = this;
            var viewer = _this.viewer;
            var entityList = viewer.entities.values;
            if (entityList == null || entityList.length < 1) { return; }
            for (var i = 0; i < entityList.length; i++) {
                var entity = entityList[i];
                if (entity.layerId == layerId) {
                    viewer.entities.remove(entity);
                    i--;
                }
            }
        }
        createPoint(cartesian, oid) {
            var _this = this;
            var point = _this.viewer.entities.add({
                position: cartesian,
                billboard: {
                    image: _this.dragIconLight,
                    //eyeOffset: new Cesium.ConstantProperty(new Cesium.Cartesian3(0, 0, -500)),
                    heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
                    disableDepthTestDistance: Number.POSITIVE_INFINITY
                }
            });
            point.oid = oid;
            point.layerId = _this.layerId;
            point.flag = "anchor";
            return point;
        }
        isSimpleXYZ(p1, p2) {
            if (p1.x == p2.x && p1.y == p2.y && p1.z == p2.z) {
                return true;
            }
            return false;
        }
    }

    /**
     * 画圆类
     */
    class CircleDrawer {
        constructor(viewer, options) {
            this.viewer = viewer;
            this.layerId = 'cd';
            this.dragIcon = options.dragIcon || '/assets/images/spot.png';
            this.dragIconLight = options.dragIconLight || '/assets/images/spot.png';
            this.markers = {};
            this.tooltip =  new G.U.Tooltip(this.viewer);
            this.tempPositions = [];
            this.positions = [];
            this.ellipsoid = this.viewer.scene.globe.ellipsoid;
            this.okHandler = null;
            this.options = options;
        }
        startDrawCircle(okHandler) {
            var _this = this;
            var viewer = _this.viewer;

            var floatingPoint = null;
            _this.drawHandler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);

            viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
            _this.drawHandler.setInputAction(function (event) {

                var position = event.position;
                if (!Cesium.defined(position)) { return; }
                var ray = viewer.scene.camera.getPickRay(position);
                if (!Cesium.defined(ray)) { return; }
                var cartesian = viewer.scene.globe.pick(ray, viewer.scene);
                if (!Cesium.defined(cartesian)) { return; }
                var num = _this.positions.length;
                if (num == 0) {
                    _this.positions.push(cartesian);
                    _this.createCenter(cartesian, 0);
                    floatingPoint = _this.createPoint(cartesian, -1);
                    _this.showRegion2Map();
                    _this.showCircleOutline2Map();
                }
                _this.positions.push(cartesian);
                var oid = _this.positions.length - 2;
                _this.createPoint(cartesian, oid);
                if (num > 1) {
                    _this.positions.pop();
                    _this.viewer.entities.remove(floatingPoint);
                    _this.tooltip.setVisible(false);

                    var positions = _this.positions;
                    _this.clear();

                    if (okHandler) { okHandler(positions); }
                }
            }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

            _this.drawHandler.setInputAction(function (event) {

                var position = event.endPosition;
                if (!Cesium.defined(position)) {
                    return;
                }
                if (_this.positions.length < 1) {
                    _this.tooltip.showAt(position, "选择起点");
                    return;
                }

                _this.tooltip.showAt(position, "选择终点");

                var ray = viewer.scene.camera.getPickRay(position);
                if (!Cesium.defined(ray)) { return; }
                var cartesian = viewer.scene.globe.pick(ray, viewer.scene);
                if (!Cesium.defined(cartesian)) { return; }
                floatingPoint.position.setValue(cartesian);
                _this.positions.pop();
                _this.positions.push(cartesian);
            }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

        }
        showRegion2Map() {
            var _this = this;
            if (_this.material == null) {
                _this.material = Cesium.Color.fromCssColorString('#fff').withAlpha(0.5);
            }
            if (_this.radiusLineMaterial == null) {
                _this.radiusLineMaterial = new Cesium.PolylineDashMaterialProperty({
                    dashLength: 16,
                    color: Cesium.Color.fromCssColorString('#fff').withAlpha(0.7)
                });
            }
            var dynamicPositions = new Cesium.CallbackProperty(function () {
                if (_this.positions.length > 1) {
                    var dis = _this.computeCircleRadius3D(_this.positions);
                    dis = (dis / 1000).toFixed(3);
                    _this.entity.label.text = dis + "km";
                    var pnts = _this.computeCirclePolygon(_this.positions);
                    var hierarchy = new Cesium.PolygonHierarchy(pnts);
                    return hierarchy;
                } else {
                    return null;
                }
            }, false);
            var lineDynamicPositions = new Cesium.CallbackProperty(function () {
                if (_this.positions.length > 1) {
                    return _this.positions;
                } else {
                    return null;
                }
            }, false);
            var labelDynamicPosition = new Cesium.CallbackProperty(function () {
                if (_this.positions.length > 1) {
                    var p1 = _this.positions[0];
                    var p2 = _this.positions[1];
                    var cp = _this.computeCenterPotition(p1, p2);
                    return cp;
                } else {
                    return null;
                }
            }, false);
            var bData = {
                layerId: _this.layerId,
                position: labelDynamicPosition,
                label: {
                    text: "",
                    font: '18px Helvetica',
                    fillColor: Cesium.Color.SKYBLUE,
                    outlineColor: Cesium.Color.BLACK,
                    outlineWidth: 1,
                    style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                    eyeOffset: new Cesium.Cartesian3(0, 0, -10)
                    // pixelOffset: new Cesium.Cartesian2(16, 16)
                },
                polygon: new Cesium.PolygonGraphics({
                    hierarchy: dynamicPositions,
                    material: _this.material,
                    fill: _this.fill,
                    outline: _this.outline,
                    outlineWidth: _this.outlineWidth,
                    outlineColor: _this.outlineColor
                }),
                polyline: {
                    positions: lineDynamicPositions,
                    clampToGround: true,
                    width: 2,
                    material: _this.radiusLineMaterial
                }
            };
            if (_this.extrudedHeight > 0) {
                bData.polygon.extrudedHeight = _this.extrudedHeight;
                bData.polygon.extrudedHeightReference = Cesium.HeightReference.RELATIVE_TO_GROUND;
                bData.polygon.closeTop = true;
                bData.polygon.closeBottom = true;
            }
            _this.entity = _this.viewer.entities.add(bData);
        }
        showCircleOutline2Map() {
            var _this = this;
            if (_this.outlineMaterial == null) {
                _this.outlineMaterial = new Cesium.PolylineDashMaterialProperty({
                    dashLength: 16,
                    color: Cesium.Color.fromCssColorString('#fff').withAlpha(0.7)
                });
            }
            var outelinePositions = new Cesium.CallbackProperty(function () {
                var pnts = _this.computeCirclePolygon(_this.positions);
                return pnts;
            }, false);
            var bData = {
                polyline: {
                    positions: outelinePositions,
                    clampToGround: true,
                    width: _this.outlineWidth,
                    material: _this.outlineMaterial
                }
            };
            _this.outlineEntity = _this.viewer.entities.add(bData);
            _this.outlineEntity.layerId = _this.layerId;
        }
        showModifyRegion2Map(objId, oldPositions) {
            var _this = this;

            _this.positions = oldPositions;
            _this.objId = objId;

            _this.startModify();

            if (_this.material == null) {
                _this.material = Cesium.Color.fromCssColorString('#fff').withAlpha(0.5);
            }
            if (_this.radiusLineMaterial == null) {
                _this.radiusLineMaterial = new Cesium.PolylineDashMaterialProperty({
                    dashLength: 16,
                    color: Cesium.Color.fromCssColorString('#fff').withAlpha(0.7)
                });
            }
            var dynamicPositions = new Cesium.CallbackProperty(function () {
                var dis = _this.computeCircleRadius3D(_this.positions);
                dis = (dis / 1000).toFixed(3);
                _this.entity.label.text = dis + "km";
                var pnts = _this.computeCirclePolygon(_this.positions);
                var hierarchy = new Cesium.PolygonHierarchy(pnts);
                return hierarchy;
            }, false);
            var lineDynamicPositions = new Cesium.CallbackProperty(function () {
                if (_this.positions.length > 1) {
                    return _this.positions;
                } else {
                    return null;
                }
            }, false);
            var labelDynamicPosition = new Cesium.CallbackProperty(function () {
                if (_this.positions.length > 1) {
                    var p1 = _this.positions[0];
                    var p2 = _this.positions[1];
                    var cp = _this.computeCenterPotition(p1, p2);
                    return cp;
                } else {
                    return null;
                }
            }, false);
           
            var dis = _this.computeCircleRadius3D(_this.positions);
            dis = (dis / 1000).toFixed(3) + "km";
            var bData = {
                layerId: _this.layerId,
                position: labelDynamicPosition,
                label: {
                    text: dis,
                    font: '18px Helvetica',
                    fillColor: Cesium.Color.SKYBLUE,
                    outlineColor: Cesium.Color.BLACK,
                    outlineWidth: 1,
                    style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                    eyeOffset: new Cesium.Cartesian3(0, 0, -10)
                    // pixelOffset: new Cesium.Cartesian2(16, 16)
                },
                polygon: new Cesium.PolygonGraphics({
                    hierarchy: dynamicPositions,
                    material: _this.material,
                    fill: _this.fill,
                    outline: _this.outline,
                    outlineWidth: _this.outlineWidth,
                    outlineColor: _this.outlineColor
                }),
                polyline: {
                    positions: lineDynamicPositions,
                    clampToGround: true,
                    width: 2,
                    material: _this.radiusLineMaterial
                }
            };
            if (_this.extrudedHeight > 0) {
                bData.polygon.extrudedHeight = _this.extrudedHeight;
                bData.polygon.extrudedHeightReference = Cesium.HeightReference.RELATIVE_TO_GROUND;
                bData.polygon.closeTop = true;
                bData.polygon.closeBottom = true;
            }
            _this.entity = _this.viewer.entities.add(bData);
            _this.createCenter(_this.positions[0], 0);
            _this.createPoint(_this.positions[1], 1);
        }
        startModify() {
            var _this = this;
            var isMoving = false;
            var pickedAnchor = null;
            if (_this.drawHandler) {
                _this.drawHandler.destroy();
                _this.drawHandler = null;
            }
            _this.modifyHandler = new Cesium.ScreenSpaceEventHandler(_this.viewer.scene.canvas);

            _this.modifyHandler.setInputAction(function (event) {
                var position = event.position;
                if (!Cesium.defined(position)) {
                    return;
                }
                var ray = _this.viewer.scene.camera.getPickRay(position);
                if (!Cesium.defined(ray)) {
                    return;
                }
                var cartesian = _this.viewer.scene.globe.pick(ray, _this.viewer.scene);
                if (!Cesium.defined(cartesian)) {
                    return;
                }
                if (isMoving) {
                    isMoving = false;
                    pickedAnchor.position.setValue(cartesian);
                    var oid = pickedAnchor.oid;
                    _this.positions[oid] = cartesian;
                    _this.tooltip.setVisible(false);
                } else {
                    var pickedObject = _this.viewer.scene.pick(position);
                    if (!Cesium.defined(pickedObject)) {
                        return;
                    }
                    if (!Cesium.defined(pickedObject.id)) {
                        return;
                    }
                    var entity = pickedObject.id;
                    if (entity.layerId != _this.layerId || entity.flag != "anchor") {
                        return;
                    }

                    pickedAnchor = entity;
                    isMoving = true;
                    _this.tooltip.showAt(position, "移动控制点");
                }

                shapeDic[_this.objId] = _this.positions;

            }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

            _this.modifyHandler.setInputAction(function (event) {
                if (!isMoving) {
                    return;
                }
                var position = event.endPosition;
                if (!Cesium.defined(position)) {
                    return;
                }
                _this.tooltip.showAt(position, "移动控制点");

                var ray = _this.viewer.scene.camera.getPickRay(position);
                if (!Cesium.defined(ray)) {
                    return;
                }
                var cartesian = _this.viewer.scene.globe.pick(ray, _this.viewer.scene);
                if (!Cesium.defined(cartesian)) {
                    return;
                }
                var oid = pickedAnchor.oid;
                pickedAnchor.position.setValue(cartesian);
                _this.positions[oid] = cartesian;
            }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

            _this.modifyHandler.setInputAction(function (movement) {
                if (_this.modifyHandler) {
                    _this.modifyHandler.destroy();
                    _this.modifyHandler = null;
                }

                _this.clear();
            }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
        }
        clear() {
            var _this = this;
            if (_this.drawHandler) {
                _this.drawHandler.destroy();
                _this.drawHandler = null;
            }
            if (_this.modifyHandler) {
                _this.modifyHandler.destroy();
                _this.modifyHandler = null;
            }
            _this.clearMarkers(_this.layerId);
            _this.tooltip.setVisible(false);
        }
        clearMarkers(layerId) {
            var _this = this;
            var viewer = _this.viewer;
            var entityList = viewer.entities.values;
            if (entityList == null || entityList.length < 1) { return; }
            for (var i = 0; i < entityList.length; i++) {
                var entity = entityList[i];
                if (entity.layerId == layerId) {
                    viewer.entities.remove(entity);
                    i--;
                }
            }
        }
        createPoint(cartesian, oid) {
            var _this = this;
            var point = _this.viewer.entities.add({
                position: cartesian,
                billboard: {
                    image: _this.dragIconLight,
                    //eyeOffset: new Cesium.ConstantProperty(new Cesium.Cartesian3(0, 0, -500)),
                    heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
                    disableDepthTestDistance: Number.POSITIVE_INFINITY
                }
            });
            point.oid = oid;
            point.layerId = _this.layerId;
            point.flag = "anchor";
            return point;
        }
        createCenter(cartesian, oid) {
            var _this = this;
            var point = _this.viewer.entities.add({
                position: cartesian,
                billboard: {
                    image: _this.dragIcon,
                    //eyeOffset: new Cesium.ConstantProperty(new Cesium.Cartesian3(0, 0, -500)),
                    heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
                    disableDepthTestDistance: Number.POSITIVE_INFINITY
                }
            });
            point.oid = oid;
            point.layerId = _this.layerId;
            point.flag = "anchor";
            return point;
        }
        computeCirclePolygon(positions) {
            var _this = this;

            try {
                if (!positions || positions.length < 2) {
                    return null;
                }
                var cp = positions[0];
                var r = _this.computeCircleRadius3D(positions);
                var pnts = _this.computeCirclePolygon2(cp, r);
                return pnts;
            } catch (err) {
                return null;
            }
        }
        computeCirclePolygon2(center, radius) {
            try {
                if (!center || radius <= 0) {
                    return null;
                }
                var cep = Cesium.EllipseGeometryLibrary.computeEllipsePositions({
                    center: center,
                    semiMajorAxis: radius,
                    semiMinorAxis: radius,
                    rotation: 0,
                    granularity: 0.005
                }, false, true);
                if (!cep || !cep.outerPositions) {
                    return null;
                }
                var pnts = Cesium.Cartesian3.unpackArray(cep.outerPositions);
                var first = pnts[0];
                pnts[pnts.length] = first;
                return pnts;
            } catch (err) {
                return null;
            }
        }
        computeCirclePolygon3(center, semiMajorAxis, semiMinorAxis, rotation) {
            try {
                if (!center || semiMajorAxis <= 0 || semiMinorAxis <= 0) {
                    return null;
                }
                var cep = Cesium.EllipseGeometryLibrary.computeEllipsePositions({
                    center: center,
                    semiMajorAxis: semiMajorAxis,
                    semiMinorAxis: semiMinorAxis,
                    rotation: rotation,
                    granularity: 0.005
                }, false, true);
                if (!cep || !cep.outerPositions) {
                    return null;
                }
                var pnts = Cesium.Cartesian3.unpackArray(cep.outerPositions);
                var first = pnts[0];
                pnts[pnts.length] = first;
                return pnts;
            } catch (err) {
                return null;
            }
        }
        computeCirclePolygonForDegree(positions) {
            var _this = this;
            var cp = _this.ellipsoid.cartesianToCartographic(positions[0]);
            var rp = _this.ellipsoid.cartesianToCartographic(positions[1]);
            var x0 = cp.longitude;
            var y0 = cp.latitude;
            var xr = rp.longitude;
            var yr = rp.latitude;
            var r = Math.sqrt(Math.pow((x0 - xr), 2) + Math.pow((y0 - yr), 2));

            var pnts = [];
            for (var i = 0; i < 360; i++) {
                var x1 = x0 + r * Math.cos(i * Math.PI / 180);
                var y1 = y0 + r * Math.sin(i * Math.PI / 180);
                var p1 = Cesium.Cartesian3.fromRadians(x1, y1);
                pnts.push(p1);
            }
            return pnts;
        }
        computeCircleRadius3D(positions) {
            var distance = 0;
            var c1 = positions[0];
            var c2 = positions[1];
            var x = Math.pow(c1.x - c2.x, 2);
            var y = Math.pow(c1.y - c2.y, 2);
            var z = Math.pow(c1.z - c2.z, 2);
            var dis = Math.sqrt(x + y + z);
            return dis;
        }
        computeCenterPotition(p1, p2) {
            var _this = this;
            var c1 = _this.ellipsoid.cartesianToCartographic(p1);
            var c2 = _this.ellipsoid.cartesianToCartographic(p2);
            var cm = new Cesium.EllipsoidGeodesic(c1, c2).interpolateUsingFraction(0.5);
            var cp = _this.ellipsoid.cartographicToCartesian(cm);
            return cp;
        }
    }

    /**
     * 动态绘制类
     */
    class DynamicDrawer {
        constructor(viewer, options) {
            this.viewer = viewer;
            this.options = options;
            this.editHandler = null;
            this.flag = 0;
            this.shapeDic = {};
            this.editObj = null;
            this.polylineDrawer = new PolylineDrawer(viewer, options);
            this.polygonDrawer = new PolygonDrawer(viewer, options);
            this.rectangleDrawer = new RectangleDrawer(viewer, options);
            this.circleDrawer = new CircleDrawer(viewer, options);
        }
        drawPolyline(okHandler) {
            var _this = this;
            if (okHandler) {
                _this.polylineDrawer.startDrawPolyline(function (positions) {
                    var objId = (new Date()).getTime();
                    
                    shapeDic[objId] = positions;
                    _this.showPolyline(objId);
                    
                    for (var i = 0; i < G.Query_X( _this.viewer, {name:'PolylineLabel'}).length; i++) {
                        var entity = G.Query_X( _this.viewer, {name:'PolylineLabel'})[i];
                        entity.name = objId;
                        i--;
                    }
                
                    okHandler(positions);
                });

            } else {
                _this.polylineDrawer.startDrawPolyline(function (positions) {
                    var objId = (new Date()).getTime();
                    shapeDic[objId] = positions;
                    _this.showPolyline(objId);
                });
            }
        }
        showPolyline(objId) {
            var _this = this;
            var style = _this.options._style;
            var positions = shapeDic[objId];
            var layerId = _this.options.layerId || 'drawerLayer';

            var material = new Cesium.PolylineOutlineMaterialProperty({//PolylineGlowMaterialProperty 发光
                // glowPower: 0.25,
                // color: style != null ? Cesium.Color.fromCssColorString(style.borderColor).withAlpha(style.borderTransparency / 100) : Cesium.Color.fromCssColorString('#00f').withAlpha(0.9)//绘制时 线条的颜色
                // // glowPower : 0.3,
                color: style != null ? Cesium.Color.fromCssColorString(style.PolylineColor).withAlpha(style.borderTransparency / 100) : Cesium.Color.fromCssColorString('#00f').withAlpha(0.9),//绘制时 线条的颜色
                outlineWidth: style != null ? style.borderWitch : 3,
                outlineColor: style != null ? Cesium.Color.fromCssColorString(style.borderColor).withAlpha(style.borderTransparency / 100) : Cesium.Color.fromCssColorString('#00f').withAlpha(0.9)//绘制时 边框的颜色
                // color : Cesium.Color.PALEGOLDENROD
            });

            var bData = {
                layerId: layerId,
                objId: objId,
                shapeType: "Polyline",
                polyline: {
                    positions: positions,
                    clampToGround: true,
                    width: style != null ? style.PolylineWitch : 8,
                    material: material
                }
            };
            var entity = _this.viewer.entities.add(bData);
            var points = [];
            for (let index = 0; index < positions.length; index++) {
                var cartographic = Cesium.Cartographic.fromCartesian(positions[index]);
                var point = {};
                point.x = Cesium.Math.toDegrees(cartographic.longitude).toFixed(6);
                point.y = Cesium.Math.toDegrees(cartographic.latitude).toFixed(6);
                point.z = cartographic.height.toFixed(1);
                points.push(point)
            }
        }
        editPolyline(objId) {
            var _this = this;
            var oldPositions = shapeDic[objId];

            //先移除entity
            _this.clearEntityById(objId);

            // 进入编辑状态  
            _this.polylineDrawer.showModifyPolyline2Map(objId, oldPositions);
        }
        drawPolygon(okHandler) {
            var _this = this;

            if (okHandler) {
                _this.polygonDrawer.startDrawPolygon(function (positions) {
                    var objId = (new Date()).getTime();
                    shapeDic[objId] = positions;
                    _this.showPolygon(objId);
                 
                    for (var i = 0; i <  G.Query_X( _this.viewer, {name:'PolygonLabel'}).length; i++) {
                        var entity = G.Query_X( _this.viewer, {name:'PolygonLabel'})[i];
                        entity.name = objId;
                        i--;
                    }

                    okHandler(positions);
                });

            } else {
                _this.polygonDrawer.startDrawPolygon(function (positions) {
                    var objId = (new Date()).getTime();
                    shapeDic[objId] = positions;
                    _this.showPolygon(objId);
                });
            }
        }

        showPolygon(objId) {

            var _this = this;
            var positions = shapeDic[objId];
            var layerId = _this.options.layerId || 'drawerLayer';

            var style = _this.options._style;

            var material = style != null ? Cesium.Color.fromCssColorString(style.shapeColor).withAlpha(style.shapeTransparency / 100) : Cesium.Color.fromCssColorString('#00f').withAlpha(0.5);//多边形绘制完成时的颜色

            var outlineMaterial = new Cesium.PolylineOutlineMaterialProperty({//PolylineGlowMaterialProperty 发光
                color: style != null ? Cesium.Color.fromCssColorString(style.borderColor).withAlpha(style.borderTransparency / 100) : Cesium.Color.fromCssColorString('#00f').withAlpha(0.9),//绘制时 线条的颜色
                //outlineWidth : style != null ? style.borderWitch : 3,
                outlineColor: style != null ? Cesium.Color.fromCssColorString(style.borderColor).withAlpha(style.borderTransparency / 100) : Cesium.Color.fromCssColorString('#00f').withAlpha(0.9)//绘制时 边框的颜色
            });

            var outlinePositions = [].concat(positions);
            outlinePositions.push(positions[0]);

            var hierachy = new Cesium.PolygonHierarchy(positions);

            var bData = {
                layerId: layerId,
                objId: objId,
                shapeType: "Polygon",
                polyline: {
                    positions: outlinePositions,
                    clampToGround: true,
                    width: style != null ? style.borderWitch : 3,
                    material: outlineMaterial
                },
                polygon: new Cesium.PolygonGraphics({
                    hierarchy: hierachy,
                    asynchronous: false,
                    material: material
                })
            };//
            var entity = _this.viewer.entities.add(bData);

            var points = [];
            for (let index = 0; index < positions.length; index++) {
                var cartographic = Cesium.Cartographic.fromCartesian(positions[index]);
                var point = {};
                point.x = Cesium.Math.toDegrees(cartographic.longitude).toFixed(6);
                point.y = Cesium.Math.toDegrees(cartographic.latitude).toFixed(6);
                point.z = cartographic.height.toFixed(1);
                points.push(point)
            }
           
            if (_this.options.deletePolygon == true) {
                // eval('deletePolygon(' + JSON.stringify(entity.id) + ')');
            }

        }
        editPolygon(objId, positionList) {
            var _this = this;
            var oldPositions = shapeDic[objId];
            //console.log(oldPositions)
            //先移除entity
            _this.clearEntityById(objId);

            // 进入编辑状态  
            _this.polygonDrawer.showModifyRegion2Map(objId, oldPositions, positionList);
        }
        drawRectangle(okHandler) {
            var _this = this;

            if (okHandler) {
                _this.rectangleDrawer.startDrawRectangle(function (positions) {
                    var objId = (new Date()).getTime();
                    shapeDic[objId] = positions;
                    _this.showRectangle(objId);
                    okHandler(positions);
                });

            } else {
                _this.rectangleDrawer.startDrawRectangle(function (positions) {
                    var objId = (new Date()).getTime();
                    shapeDic[objId] = positions;
                    _this.showRectangle(objId);
                });
            }
        }
        showRectangle(objId) {
            var _this = this;
            var positions = shapeDic[objId];
            var layerId = _this.options.layerId || 'drawerLayer';
            var material = Cesium.Color.fromCssColorString('#fff').withAlpha(0.5);
            var outlineMaterial = new Cesium.PolylineDashMaterialProperty({
                dashLength: 16,
                color: Cesium.Color.fromCssColorString('#fff').withAlpha(0.7)
            });
            var rect = Cesium.Rectangle.fromCartesianArray(positions);
            var arr = [rect.west, rect.north, rect.east, rect.north, rect.east, rect.south, rect.west, rect.south, rect.west, rect.north];
            var outlinePositions = Cesium.Cartesian3.fromRadiansArray(arr);
            var bData = {
                layerId: layerId,
                objId: objId,
                shapeType: "Rectangle",
                polyline: {
                    positions: outlinePositions,
                    clampToGround: true,
                    width: 2,
                    material: outlineMaterial
                },
                rectangle: {
                    coordinates: rect,
                    material: material
                }
            };
            var entity = _this.viewer.entities.add(bData);
        }
        editRectangle(objId) {
            var _this = this;
            var oldPositions = shapeDic[objId];

            //先移除entity
            _this.clearEntityById(objId);

            // 进入编辑状态  
            _this.rectangleDrawer.showModifyRegion2Map(objId, oldPositions);
        }
        drawCircle(okHandler) {
            var _this = this;

            if (okHandler) {
                _this.circleDrawer.startDrawCircle(function (positions) {
                    var objId = (new Date()).getTime();
                    shapeDic[objId] = positions;
                    _this.showCircle(objId);
                    okHandler(positions);
                });

            } else {
                _this.circleDrawer.startDrawCircle(function (positions) {
                    var objId = (new Date()).getTime();
                    shapeDic[objId] = positions;
                    _this.showCircle(objId);
                });
            }
        }
        showCircle(objId) {
            var _this = this;
            var positions = shapeDic[objId];
            var layerId = _this.options.layerId || 'drawerLayer';

            var material = Cesium.Color.fromCssColorString('#fff').withAlpha(0.5);
            var outlineMaterial = new Cesium.PolylineDashMaterialProperty({
                dashLength: 16,
                color: Cesium.Color.fromCssColorString('#fff').withAlpha(0.7)
            });
            var radiusMaterial = new Cesium.PolylineDashMaterialProperty({
                dashLength: 16,
                color: Cesium.Color.fromCssColorString('#fff').withAlpha(0.7)
            });
            var pnts = _this.circleDrawer.computeCirclePolygon(positions);
            var hierarchy = new Cesium.PolygonHierarchy(pnts);
            var dis = _this.circleDrawer.computeCircleRadius3D(positions);
            dis = (dis / 1000).toFixed(3);
            var text = dis + "km";
            var bData = {
                layerId: layerId,
                objId: objId,
                shapeType: "Circle",
                position: positions[0],
                // billboard: {
                //     image: "../src/images/circle_center.png",
                //     //eyeOffset: new Cesium.ConstantProperty(new Cesium.Cartesian3(0, 0, -500)),
                //     heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
                // },
                polyline: {
                    positions: pnts,
                    clampToGround: true,
                    width: 2,
                    material: outlineMaterial
                },
                polygon: new Cesium.PolygonGraphics({
                    hierarchy: hierarchy,
                    asynchronous: false,
                    material: material
                })
            };
            var entity = _this.viewer.entities.add(bData);

        }
        editCircle(objId) {
            var _this = this;
            var oldPositions = shapeDic[objId];

            //先移除entity
            _this.clearEntityById(objId);

            // 进入编辑状态  
            _this.circleDrawer.showModifyRegion2Map(objId, oldPositions);
        }
        clearEntityById(objId) {
            var _this = this;
            var layerId = _this.options.layerId || 'drawerLayer';
            var entityList = _this.viewer.entities.values;
            if (entityList == null || entityList.length < 1) {
                return;
            }
            for (var i = 0; i < entityList.length; i++) {
                var entity = entityList[i];
                if (entity.layerId == layerId && entity.objId == objId) {
                    _this.viewer.entities.remove(entity);
                    i--;
                }
            }
            for (var i = 0; i < G.Query_X( _this.viewer, {name:objId}).length; i++) {
                var entity = G.Query_X( _this.viewer, {name:objId})[i];
                _this.viewer.entities.remove(entity);
                i--;
            }
          
        }
        setMode(flag, positionList) {
            var _this = this;
            _this.flag = flag;
            _this.editHandler = new Cesium.ScreenSpaceEventHandler(_this.viewer.scene.canvas);
            _this.editHandler.setInputAction(function (movement) {
                var pick = _this.viewer.scene.pick(movement.position);
                if (!pick) {
                    return;
                }
                var obj = pick.id;
                if (!obj || !obj.layerId || _this.flag == 0) {
                    return;
                }

                var objId = obj.objId;
                _this.editObj = obj;
                //flag为编辑或删除标识,1为编辑，2为删除
                if (_this.flag == 1) {
                    switch (obj.shapeType) {
                        case "Polyline":
                            _this.flag = 0;
                            _this.editPolyline(objId);
                            break;
                        case "Polygon":
                            _this.flag = 0;
                            _this.editPolygon(objId, positionList);
                            break;
                        case "Rectangle":
                            _this.flag = 0;
                            _this.editRectangle(objId);
                            break;
                        case "Circle":
                            _this.flag = 0;
                            _this.editCircle(objId);
                            break;
                        default:
                            break;
                    }
                } else if (_this.flag == 2) {
                    _this.clearEntityById(objId);
                }
            }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
            _this.editHandler.setInputAction(function (movement) {
                if (_this.editHandler) {
                    _this.editHandler.destroy();
                    _this.editHandler = null;
                }
                if (_this.flag == 0) {
                    var obj = _this.editObj;
                    switch (obj.shapeType) {
                        case "Polyline":
                            // _this.polylineDrawer.clear();
                            _this.showPolyline(_this.editObj.objId);
                            break;
                        case "Polygon":
                            _this.showPolygon(_this.editObj.objId);
                            break;
                        case "Rectangle":
                            _this.showRectangle(_this.editObj.objId);
                            break;
                        case "Circle":
                            _this.showCircle(_this.editObj.objId);
                            break;
                        default:
                            break;
                    }
                }
            }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
        }
    }

  
    const version = "0.0.1"
    const draw = {
      expando: "DRAW" + ( version + Math.random() ).replace( /\D/g, "" ),
      DynamicDrawer,
      shapeDic
    }
    G.extend({
      D:draw
    });
    if ( typeof window.draw === "undefined" ) {
      window.draw = G.D;
    }


})();
