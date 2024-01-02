"use strict";
/**
 * Visualization map spatial data service R&D 特效类
 * @author Oran
 * @version 1.1
 * @time 2021/3/25
 */
(function (window) {
  /**
   * 全局发光
   */
  function bright(viewer) {
    var viewModel = {
      show: true,
      glowOnly: false,
      contrast: 128,
      brightness: 0.1,
      delta: 1.2,
      sigma: 4.78,
      stepSize: 3.0,
    };

    var bloom = viewer.scene.postProcessStages.bloom;
    bloom.enabled = Boolean(viewModel.show);
    bloom.uniforms.glowOnly = Boolean(viewModel.glowOnly);
    bloom.uniforms.contrast = Number(viewModel.contrast);
    bloom.uniforms.brightness = Number(viewModel.brightness);
    bloom.uniforms.delta = Number(viewModel.delta);
    bloom.uniforms.sigma = Number(viewModel.sigma);
    bloom.uniforms.stepSize = Number(viewModel.stepSize);
  }
  /**
   * 日照分析
   */
  function runshineAnalysis() {
    function stratPlay(viewer) {
      viewer.shadows = true;
      viewer.terrainShadows = true ? Cesium.ShadowMode.ENABLED : Cesium.ShadowMode.DISABLED;

      var shadowMap = viewer.shadowMap;
      shadowMap.maximumDistance = 10000.0;
      shadowMap.size = 10000;
      // shadowMap.softShadows = true
      var entities = viewer.entities.values;
      var entityShadows = true ? Cesium.ShadowMode.ENABLED : Cesium.ShadowMode.DISABLED;
      var entitiesLength = entities.length;

      console.log(entitiesLength);
      for (let i = 0; i < entitiesLength; i++) {
        var entity = entities[i];
        var visual = entity.model || entity.box || entity.ellipsoid;
        if (visual) visual.shadows = entityShadows;
      }
    }
    function stopPlay(viewer) {
      var shadowMap = viewer.shadowMap;
      shadowMap.maximumDistance = 10000.0;
      shadowMap.size = 2048;
      shadowMap.softShadows = false;
      viewer.shadows = false;

      viewer.terrainShadows = false ? Cesium.ShadowMode.ENABLED : Cesium.ShadowMode.DISABLED;

      var entities = viewer.entities.values;
      var entityShadows = false ? Cesium.ShadowMode.ENABLED : Cesium.ShadowMode.DISABLED;
      var entitiesLength = entities.length;
      for (let i = 0; i < entitiesLength; i++) {
        var entity = entities[i];
        var visual = entity.model || entity.box || entity.ellipsoid;
        if (visual) visual.shadows = entityShadows;
      }
    }
    function setvisible(viewer, value) {
      switch (value) {
        case "play":
          stratPlay(viewer);
          break;
        case "stop":
          stopPlay(viewer);
          break;
      }
    }
    return setvisible;
  }
  /**
   * 大气特效 日照耀斑
   */
  function AtmosphericEffects(viewer) {
    var scene = viewer.scene;
    var globe = scene.globe;
    globe.enableLighting = true;

    globe.lightingFadeOutDistance = 10000000;
    globe.lightingFadeInDistance = 20000000;
    globe.nightFadeOutDistance = 10000000;
    globe.nightFadeInDistance = 2.7e7;
    viewer.terrainProvider = new Cesium.EllipsoidTerrainProvider();

    var viewModel = {
      show: true,
      intensity: 2.0,
      distortion: 10.0,
      dispersion: 0.4,
      haloWidth: 0.4,
      dirtAmount: 0.4,
    };
    var lensFlare = viewer.scene.postProcessStages.add(Cesium.PostProcessStageLibrary.createLensFlareStage());
    function updatePostProcess() {
      lensFlare.enabled = Boolean(viewModel.show);
      lensFlare.uniforms.intensity = Number(viewModel.intensity);
      lensFlare.uniforms.distortion = Number(viewModel.distortion);
      lensFlare.uniforms.ghostDispersal = Number(viewModel.dispersion);
      lensFlare.uniforms.haloWidth = Number(viewModel.haloWidth);
      lensFlare.uniforms.dirtAmount = Number(viewModel.dirtAmount);
      lensFlare.uniforms.earthRadius = Cesium.Ellipsoid.WGS84.maximumRadius;
    }
    updatePostProcess();
  }

  /**
   * 着色器天气
   * @param {*} viewer
   */
  class Effect {
    constructor(viewer, options) {
      if (!viewer) throw new Error("no viewer object!");
      options = options || {};
      this.visibility = Cesium.defaultValue(options.visibility, 0.1);
      this.color = Cesium.defaultValue(options.color, new Cesium.Color(0.8, 0.8, 0.8, 0.5));
      this._show = Cesium.defaultValue(options.show, !0);
      this.viewer = viewer;
      this.type = options.type;
      this.init();
    }

    init() {
      var fragmentShader;
      switch (this.type) {
        case "y":
          fragmentShader = this.yShaders();
          break;
        case "x":
          fragmentShader = this.xShaders();
          break;
        case "w":
          fragmentShader = this.wShaders();
          break;
        default:
          fragmentShader = this.yShaders();
          break;
      }
      this.Stage = new Cesium.PostProcessStage({
        name: Number(Math.random().toString().substr(3, length) + Date.now()).toString(36),
        fragmentShader: fragmentShader,
        uniforms: {
          visibility: () => {
            return this.visibility;
          },
          fogColor: () => {
            return this.color;
          },
        },
      });
      this.viewer.scene.postProcessStages.add(this.Stage);
    }

    destroy() {
      if (!this.viewer || !this.Stage) return;
      this.viewer.scene.postProcessStages.remove(this.Stage);
      this.Stage.destroy();
      delete this.visibility;
      delete this.color;
    }

    show(visible) {
      this._show = Cesium.defaultValue(visible, !0);
      this.Stage.enabled = this._show;
    }

    wShaders() {
      return "uniform sampler2D colorTexture;\n\
             uniform sampler2D depthTexture;\n\
             uniform float visibility;\n\
             uniform vec4 fogColor;\n\
             varying vec2 v_textureCoordinates; \n\
             void main(void) \n\
             { \n\
                vec4 origcolor = texture2D(colorTexture, v_textureCoordinates); \n\
                float depth = czm_readDepth(depthTexture, v_textureCoordinates); \n\
                vec4 depthcolor = texture2D(depthTexture, v_textureCoordinates); \n\
                float f = visibility * (depthcolor.r - 0.3) / 0.2; \n\
                if (f < 0.0) f = 0.0; \n\
                else if (f > 1.0) f = 1.0; \n\
                gl_FragColor = mix(origcolor, fogColor, f); \n\
             }\n";
    }
    xShaders() {
      return "uniform sampler2D colorTexture;\n\
            varying vec2 v_textureCoordinates;\n\
        \n\
            float snow(vec2 uv,float scale)\n\
            {\n\
                float time = czm_frameNumber / 60.0;\n\
                float w=smoothstep(1.,0.,-uv.y*(scale/10.));if(w<.1)return 0.;\n\
                uv+=time/scale;uv.y+=time*2./scale;uv.x+=sin(uv.y+time*.5)/scale;\n\
                uv*=scale;vec2 s=floor(uv),f=fract(uv),p;float k=3.,d;\n\
                p=.5+.35*sin(11.*fract(sin((s+p+scale)*mat2(7,3,6,5))*5.))-f;d=length(p);k=min(d,k);\n\
                k=smoothstep(0.,k,sin(f.x+f.y)*0.01);\n\
                return k*w;\n\
            }\n\
        \n\
            void main(void){\n\
                vec2 resolution = czm_viewport.zw;\n\
                vec2 uv=(gl_FragCoord.xy*2.-resolution.xy)/min(resolution.x,resolution.y);\n\
                vec3 finalColor=vec3(0);\n\
                float c = 0.0;\n\
                c+=snow(uv,30.)*.0;\n\
                c+=snow(uv,20.)*.0;\n\
                c+=snow(uv,15.)*.0;\n\
                c+=snow(uv,10.);\n\
                c+=snow(uv,8.);\n\
            c+=snow(uv,6.);\n\
                c+=snow(uv,5.);\n\
                finalColor=(vec3(c)); \n\
                gl_FragColor = mix(texture2D(colorTexture, v_textureCoordinates), vec4(finalColor,1), 0.5); \n\
        \n\
            }\n\
        ";
    }

    yShaders() {
      return "uniform sampler2D colorTexture;\n\
                    varying vec2 v_textureCoordinates;\n\
                \n\
                    float hash(float x){\n\
                        return fract(sin(x*133.3)*13.13);\n\
                }\n\
                \n\
                void main(void){\n\
                \n\
                    float time = czm_frameNumber / 60.0;\n\
                vec2 resolution = czm_viewport.zw;\n\
                \n\
                vec2 uv=(gl_FragCoord.xy*2.-resolution.xy)/min(resolution.x,resolution.y);\n\
                vec3 c=vec3(.6,.7,.8);\n\
                \n\
                float a=-.4;\n\
                float si=sin(a),co=cos(a);\n\
                uv*=mat2(co,-si,si,co);\n\
                uv*=length(uv+vec2(0,4.9))*.3+1.;\n\
                \n\
                float v=1.-sin(hash(floor(uv.x*100.))*2.);\n\
                float b=clamp(abs(sin(20.*time*v+uv.y*(5./(2.+v))))-.95,0.,1.)*20.;\n\
                c*=v*b; \n\
                \n\
                gl_FragColor = mix(texture2D(colorTexture, v_textureCoordinates), vec4(c,1), 0.5);  \n\
                }\n\
            ";
    }
  }
  /**
   * 电子围栏
   * @param {*} type
   */
  function SolidWall(viewer, type, list) {
    switch (type) {
      case "呼吸":
        var alp = 1;
        var num = 0;
        //绘制墙
        viewer.entities.add({
          name: "动态立体墙",
          wall: {
            show: true,
            positions: Cesium.Cartesian3.fromDegreesArrayHeights(list),
            material: new Cesium.ImageMaterialProperty({
              image: Cesium.buildModuleUrl("../../core/images/waterNormals.png"),
              transparent: true,
              color: new Cesium.CallbackProperty(function () {
                if (num % 2 === 0) {
                  alp -= 0.005;
                } else {
                  alp += 0.005;
                }

                if (alp <= 0.3) {
                  num++;
                } else if (alp >= 1) {
                  num++;
                }
                return Cesium.Color.WHITE.withAlpha(alp);
                //entity的颜色透明 并不影响材质，并且 entity也会透明
              }, false),
            }),
          },
        });

        break;
      case "着色器1":
        /*
                流动纹理线
                color 颜色
                duration 持续时间 毫秒
                */
        function PolylineTrailLinkMaterialProperty(color, duration) {
          this._definitionChanged = new Cesium.Event();
          this._color = undefined;
          this._colorSubscription = undefined;
          this.color = color;
          this.duration = duration;
          this._time = new Date().getTime();
        }
        Object.defineProperties(PolylineTrailLinkMaterialProperty.prototype, {
          isConstant: {
            get: function () {
              return false;
            },
          },
          definitionChanged: {
            get: function () {
              return this._definitionChanged;
            },
          },
          color: Cesium.createPropertyDescriptor("color"),
        });
        PolylineTrailLinkMaterialProperty.prototype.getType = function (time) {
          return "PolylineTrailLink";
        };
        PolylineTrailLinkMaterialProperty.prototype.getValue = function (time, result) {
          if (!Cesium.defined(result)) {
            result = {};
          }
          result.color = Cesium.Property.getValueOrClonedDefault(this._color, time, Cesium.Color.WHITE, result.color);
          result.image = Cesium.Material.PolylineTrailLinkImage;
          result.time = ((new Date().getTime() - this._time) % this.duration) / this.duration;
          return result;
        };
        PolylineTrailLinkMaterialProperty.prototype.equals = function (other) {
          return this === other || (other instanceof PolylineTrailLinkMaterialProperty && Property.equals(this._color, other._color));
        };
        Cesium.PolylineTrailLinkMaterialProperty = PolylineTrailLinkMaterialProperty;
        Cesium.Material.PolylineTrailLinkType = "PolylineTrailLink";
        (Cesium.Material.PolylineTrailLinkImage = Cesium.buildModuleUrl("../../core/images/colors.png")),
          (Cesium.Material.PolylineTrailLinkSource =
            "czm_material czm_getMaterial(czm_materialInput materialInput)\n\
                {\n\
                    czm_material material = czm_getDefaultMaterial(materialInput);\n\
                    vec2 st = materialInput.st;\n\
                    vec4 colorImage = texture2D(image, vec2(fract(-(st.t + time)), st.t));\n\
                    material.alpha = colorImage.a * color.a;\n\
                    material.diffuse = (colorImage.rgb+color.rgb)/2.0;\n\
                    return material;\n\
                }");
        Cesium.Material.Source =
          "czm_material czm_getMaterial(czm_materialInput materialInput)\n\
                {\n\
                    czm_material material = czm_getDefaultMaterial(materialInput);\n\
                    vec2 st = materialInput.st;\n\
                    vec4 colorImage = texture2D(image, vec2(fract(-(st.t + time)), st.t));\n\
                    material.alpha = colorImage.a * color.a;\n\
                    material.diffuse = (colorImage.rgb+color.rgb)/2.0;\n\
                    return material;\n\
                }";
        Cesium.Material._materialCache.addMaterial(Cesium.Material.PolylineTrailLinkType, {
          fabric: {
            type: Cesium.Material.PolylineTrailLinkType,
            uniforms: {
              color: new Cesium.Color(1.0, 0.0, 0.0, 0.5),
              image: Cesium.Material.PolylineTrailLinkImage,
              time: 0,
            },
            source: Cesium.Material.PolylineTrailLinkSource,
          },
          translucent: function (material) {
            return true;
          },
        });

        viewer.entities.add({
          name: "动态立体墙",
          wall: {
            positions: Cesium.Cartesian3.fromDegreesArray(list),
            maximumHeights: [50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50],
            minimumHeights: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            material: new Cesium.PolylineTrailLinkMaterialProperty(Cesium.Color.fromCssColorString("#ff0f00").withAlpha(1), 3000),
          },
        });
        break;
      default:
        break;
    }
  }
  /**
   * 动态线
   */
  function DynamicLine(viewer, list) {
    /*
        流动纹理线
        color 颜色
        duration 持续时间 毫秒
        */
    function PolylineTrailLinkMaterialProperty(color, duration) {
      this._definitionChanged = new Cesium.Event();
      this._color = undefined;
      this._colorSubscription = undefined;
      this.color = color;
      this.duration = duration;
      this._time = new Date().getTime();
    }
    Object.defineProperties(PolylineTrailLinkMaterialProperty.prototype, {
      isConstant: {
        get: function () {
          return false;
        },
      },
      definitionChanged: {
        get: function () {
          return this._definitionChanged;
        },
      },
      color: Cesium.createPropertyDescriptor("color"),
    });
    PolylineTrailLinkMaterialProperty.prototype.getType = function (time) {
      return "PolylineTrailLink";
    };
    PolylineTrailLinkMaterialProperty.prototype.getValue = function (time, result) {
      if (!Cesium.defined(result)) {
        result = {};
      }
      result.color = Cesium.Property.getValueOrClonedDefault(this._color, time, Cesium.Color.WHITE, result.color);
      result.image = Cesium.Material.PolylineTrailLinkImage;
      result.time = ((new Date().getTime() - this._time) % this.duration) / this.duration / 2;
      return result;
    };
    PolylineTrailLinkMaterialProperty.prototype.equals = function (other) {
      return this === other || (other instanceof PolylineTrailLinkMaterialProperty && Property.equals(this._color, other._color));
    };
    Cesium.PolylineTrailLinkMaterialProperty = PolylineTrailLinkMaterialProperty;
    Cesium.Material.PolylineTrailLinkType = "PolylineTrailLink";
    Cesium.Material.PolylineTrailLinkImage = Cesium.buildModuleUrl("../../assets/images/line.png");
    Cesium.Material.PolylineTrailLinkSource =
      "czm_material czm_getMaterial(czm_materialInput materialInput)\n\
                                                    {\n\
                                                        czm_material material = czm_getDefaultMaterial(materialInput);\n\
                                                        vec2 st = materialInput.st;\n\
                                                        vec4 colorImage = texture2D(image, vec2(fract(st.s - time), st.t));\n\
                                                        material.alpha = colorImage.a * color.a;\n\
                                                        material.diffuse = (colorImage.rgb+color.rgb)/2.0;\n\
                                                        return material;\n\
                                                    }";
    Cesium.Material._materialCache.addMaterial(Cesium.Material.PolylineTrailLinkType, {
      fabric: {
        type: Cesium.Material.PolylineTrailLinkType,
        uniforms: {
          color: new Cesium.Color(1.0, 0.0, 0.0, 0.5),
          image: Cesium.Material.PolylineTrailLinkImage,
          time: 0,
        },
        source: Cesium.Material.PolylineTrailLinkSource,
      },
      translucent: function (material) {
        return true;
      },
    });

    var entities = viewer.entities.add({
      name: "动态立体墙",
      polyline: {
        positions: Cesium.Cartesian3.fromDegreesArray(list),
        zIndex: 2,
        clampToGround: true,
        width: 5,
        maximumHeights: [600, 600, 600, 600, 600, 600, 600, 600, 600, 600, 600, 600, 600, 600],
        minimumHeights: [43.9, 49.4, 38.7, 40, 54, 51, 66.7, 44.6, 41.2, 31.2, 50.1, 53.8, 46.9, 43.9],
        material: new Cesium.PolylineTrailLinkMaterialProperty(Cesium.Color.fromCssColorString("#0000FF"), 3000),
      },
    });

    return entities;
  }
  /**
   * 动态波纹
   */
  function Spread(viewer, options) {
    const DynamicCircle = `
            uniform sampler2D colorTexture;    //颜色纹理
            uniform sampler2D depthTexture;    //深度纹理
            varying vec2 v_textureCoordinates; //纹理坐标
            uniform vec4 u_scanCenterEC;       //扫描中心
            uniform vec3 u_scanPlaneNormalEC;  //扫描平面法向量
            uniform float u_radius;            //扫描半径
            uniform vec4 u_scanColor;          //扫描颜色

            // 根据二维向量和深度值 计算距离camera的向量
            vec4 toEye(in vec2 uv, in float depth) {
                vec2 xy = vec2((uv.x * 2.0 - 1.0), (uv.y * 2.0 - 1.0));
                // 看看源码中关于此函数的解释是，cesium系统自动生成的4*4的反投影变换矩阵
                // 从clip坐标转为眼睛坐标，clip坐标是指顶点着色器的坐标系统gl_position输出的
                vec4 posInCamera = czm_inverseProjection * vec4(xy, depth, 1.0);
                posInCamera = posInCamera / posInCamera.w; //将视角坐标除深度分量
                return posInCamera;
            }

            // 点在平面上的投影，输入参数为 平面法向量，平面起始点，测试点
            vec3 pointProjectOnPlane(in vec3 planeNormal, in vec3 planeOrigin, in vec3 point) {
                // 计算测试点与平面起始点的向量
                vec3 v01 = point - planeOrigin;
                // 平面法向量与 测试点与平面上的点 点积  点积的几何意义，b在a上的投影长度，
                // 即v01在平面法向量上的长度
                float d = dot(planeNormal, v01);
                // planeNormal * d 即为v01在平面法向量上的投影向量
                // 根据三角形向量相加为0的原则 即可得点在平面上的投影
                return (point - planeNormal * d);
            }

            // 获取深度值，根据纹理坐标获取深度值
            float getDepth(in vec4 depth) {
                float z_window = czm_unpackDepth(depth);  //源码解释将一个vec4向量还原到0，1内的一个数
                z_window = czm_reverseLogDepth(z_window); // czm_reverseLogDepth解开深度
                float n_range = czm_depthRange.near;      //
                float f_range = czm_depthRange.far;
                return (2.0 * z_window - n_range - f_range) / (f_range - n_range);
            }

            void main() {
                gl_FragColor = texture2D(colorTexture, v_textureCoordinates);          //片元颜色
                float depth = getDepth(texture2D(depthTexture, v_textureCoordinates)); //根据纹理获取深度值
                vec4 viewPos = toEye(v_textureCoordinates, depth);                     //根据纹理坐标和深度值获取视点坐标
                // 点在平面上的投影，平面法向量，平面中心，视点坐标
                vec3 prjOnPlane = pointProjectOnPlane(u_scanPlaneNormalEC.xyz, u_scanCenterEC.xyz, viewPos.xyz);
                // 计算投影坐标到视点中心的距离
                float dis = length(prjOnPlane.xyz - u_scanCenterEC.xyz);
                // 如果在扫描半径内，则重新赋值片元颜色
                if (dis < u_radius) {
                    // 计算与扫描中心的距离并归一化
                    float f = dis / u_radius;
                    // 原博客如下，实际上可简化为上式子
                    // float f = 1.0 -abs(u_radius - dis) / u_radius;
                    // 四次方
                    f = pow(f, 2.0);
                    // mix(x, y, a): x, y的线性混叠， x(1-a)  y*a;,
                    // 效果解释：在越接近扫描中心时，f越小，则片元的颜色越接近原来的，相反则越红
                    gl_FragColor = mix(gl_FragColor, u_scanColor, f);
                }
            }
            `;

    function createDynamicCircleStage(viewer, Cesium, cartographicCenter, maxRadius, scanColor, duration) {
      // 中心点
      var _Cartesian3Center = Cesium.Cartographic.toCartesian(cartographicCenter);
      var _Cartesian4Center = new Cesium.Cartesian4(_Cartesian3Center.x, _Cartesian3Center.y, _Cartesian3Center.z, 1);

      // 中心点垂直高度上升500m的坐标点，目的是为了计算平面的法向量
      var _CartographicCenter1 = new Cesium.Cartographic(cartographicCenter.longitude, cartographicCenter.latitude, cartographicCenter.height + 500);
      var _Cartesian3Center1 = Cesium.Cartographic.toCartesian(_CartographicCenter1);
      var _Cartesian4Center1 = new Cesium.Cartesian4(_Cartesian3Center1.x, _Cartesian3Center1.y, _Cartesian3Center1.z, 1);

      // 当前时间
      var _time = new Date().getTime();

      // 转换成相机参考系后的中心点，上升高度后的中心点以及平面法向量
      var _scratchCartesian4Center = new Cesium.Cartesian4();
      var _scratchCartesian4Center1 = new Cesium.Cartesian4();
      var _scratchCartesian3Normal = new Cesium.Cartesian3();

      // 自定义PostProcessStage
      var dynamicCircle = new Cesium.PostProcessStage({
        fragmentShader: DynamicCircle,
        uniforms: {
          // 将中心点坐标转化到相机参考系
          u_scanCenterEC: function () {
            return Cesium.Matrix4.multiplyByVector(viewer.camera._viewMatrix, _Cartesian4Center, _scratchCartesian4Center);
          },
          // 计算相机参考系下的平面法向量
          u_scanPlaneNormalEC: function () {
            var temp = Cesium.Matrix4.multiplyByVector(viewer.camera._viewMatrix, _Cartesian4Center, _scratchCartesian4Center);
            var temp1 = Cesium.Matrix4.multiplyByVector(viewer.camera._viewMatrix, _Cartesian4Center1, _scratchCartesian4Center1);
            _scratchCartesian3Normal.x = temp1.x - temp.x;
            _scratchCartesian3Normal.y = temp1.y - temp.y;
            _scratchCartesian3Normal.z = temp1.z - temp.z;

            Cesium.Cartesian3.normalize(_scratchCartesian3Normal, _scratchCartesian3Normal);
            return _scratchCartesian3Normal;
          },
          // 动态半径
          u_radius: function () {
            return (maxRadius * ((new Date().getTime() - _time) % duration)) / duration;
          },
          u_scanColor: scanColor,
        },
      });
      return dynamicCircle;
    }
    var lng = options.x;
    var lat = options.y;
    var cartographicCenter = new Cesium.Cartographic(Cesium.Math.toRadians(lng), Cesium.Math.toRadians(lat), 0);
    var scanColor = new Cesium.Color(1.0, 0.0, 0.0, 1);
    // 创建自定义的 PostProcessStage
    var dynamicCircle = createDynamicCircleStage(viewer, Cesium, cartographicCenter, options.size == null ? 15 : options.size, scanColor, 4000);
    // 添加进场景
    viewer.scene.postProcessStages.add(dynamicCircle);

    return dynamicCircle;
  }

  function parseDefines(shader) {
    let defines = [];
    for (const key in shader.defines) {
      if (shader.defines.hasOwnProperty(key)) {
        const val = shader.defines[key];
        defines.push("#define " + key + " " + val);
      }
    }
    defines = defines.join("\n") + "\n";
    if (shader.fragmentShader) {
      shader.fragmentShader = defines + shader.fragmentShader;
    }
    if (shader.vertexShader) {
      shader.vertexShader = defines + shader.vertexShader;
    }
    return shader;
  }

  const _shadersLuminosityHighPass =
    "\n\
      uniform sampler2D colorTexture;\n\
      uniform vec3 defaultColor;\n\
      uniform float defaultOpacity;\n\
      uniform float luminosityThreshold;\n\
      uniform float smoothWidth;\n\
      \n\
      varying vec2 v_textureCoordinates;\n\
      void main() {\n\
        vec4 texel = texture2D( colorTexture, v_textureCoordinates );\n\
          \n\
        #ifdef CZM_SELECTED_FEATURE\n\
            if (!czm_selected()) {\n\
                texel = vec4(0.);\n\
            }\n\
        #endif\n\
        \n\
        vec3 luma = vec3( 0.299, 0.587, 0.114 );\n\
        float v = dot( texel.xyz, luma );\n\
        vec4 outputColor = vec4( defaultColor.rgb, defaultOpacity );\n\
        float alpha = smoothstep( luminosityThreshold, luminosityThreshold + smoothWidth, v );\n\
        gl_FragColor = mix( outputColor, texel, alpha );\n\
      }\n\
      ";
  function createLuminosityHighPass(name) {
    const _Cesium = Cesium;

    var highPass = new _Cesium.PostProcessStage({
      name: name + "_bright",
      fragmentShader: _shadersLuminosityHighPass,
      uniforms: {
        luminosityThreshold: 0.0,
        smoothWidth: 0.01,
        defaultColor: new _Cesium.Color.fromRgba(0x000000),
        defaultOpacity: 1,
      },
    });

    return highPass;
  }

  const _shadersSeparableBlur =
    "\n\
      varying vec2 v_textureCoordinates;\n\
      uniform sampler2D colorTexture;\n\
      uniform vec2 colorTextureDimensions;\n\
      uniform vec2 texSize;\n\
      uniform vec2 direction;\n\
      \n\
      float gaussianPdf(in float x, in float sigma) {\n\
          return 0.39894 * exp( -0.5 * x * x/( sigma * sigma))/sigma;\n\
      }\n\
      void main() {\n\
          \n\
          vec2 invSize = 1.0 / colorTextureDimensions;\n\
          float fSigma = float(SIGMA);\n\
          float weightSum = gaussianPdf(0.0, fSigma);\n\
          vec3 diffuseSum = texture2D( colorTexture, v_textureCoordinates).rgb * weightSum;\n\
          for( int i = 1; i < KERNEL_RADIUS; i ++ ) {\n\
              float x = float(i);\n\
              float w = gaussianPdf(x, fSigma);\n\
              vec2 uvOffset = direction * invSize * x;\n\
              vec3 sample1 = texture2D( colorTexture, v_textureCoordinates + uvOffset).rgb;\n\
              vec3 sample2 = texture2D( colorTexture, v_textureCoordinates - uvOffset).rgb;\n\
              diffuseSum += (sample1 + sample2) * w;\n\
              weightSum += 2.0 * w;\n\
          }\n\
          gl_FragColor = vec4(diffuseSum/weightSum, 1.0);\n\
      }";
  function createSeparableBlur(name, kernelRadius, textureScale) {
    const { Cartesian2, PostProcessStage, PostProcessStageComposite, PostProcessStageSampleMode } = Cesium;

    let blurDirectionX = new Cartesian2(1.0, 0.0);
    let blurDirectionY = new Cartesian2(0.0, 1.0);

    let separableBlurShader = {
      defines: {
        KERNEL_RADIUS: kernelRadius,
        SIGMA: kernelRadius,
      },
      fragmentShader: _shadersSeparableBlur,
    };
    parseDefines(separableBlurShader);

    let blurX = new PostProcessStage({
      name: name + "_x_direction",
      fragmentShader: separableBlurShader.fragmentShader,
      textureScale: textureScale,
      forcePowerOfTwo: true,
      uniforms: {
        direction: blurDirectionX,
      },
      sampleMode: PostProcessStageSampleMode.LINEAR,
    });

    let blurY = new PostProcessStage({
      name: name + "_y_direction",
      fragmentShader: separableBlurShader.fragmentShader,
      textureScale: textureScale,
      forcePowerOfTwo: true,
      uniforms: {
        direction: blurDirectionY,
      },
      sampleMode: PostProcessStageSampleMode.LINEAR,
    });

    let separableBlur = new PostProcessStageComposite({
      name: name,
      stages: [blurX, blurY],
      inputPreviousStageTexture: true,
    });
    return separableBlur;
  }

  const _shadersUnrealBloomComposite =
    "\n\
      varying vec2 v_textureCoordinates;\n\
      uniform sampler2D blurTexture1;\n\
      uniform sampler2D blurTexture2;\n\
      uniform sampler2D blurTexture3;\n\
      uniform sampler2D blurTexture4;\n\
      uniform sampler2D blurTexture5;\n\
      uniform sampler2D colorTexture;\n\
      uniform float bloomStrength;\n\
      uniform float bloomRadius;\n\
      uniform float bloomFactors[NUM_MIPS];\n\
      uniform vec3 bloomTintColors[NUM_MIPS];\n\
      uniform float selectedBloomFactor;\n\
      uniform bool glowOnly;\n\
      \n\
      float lerpBloomFactor(const in float factor) { \n\
          float mirrorFactor = 1.2 - factor;\n\
          return mix(factor, mirrorFactor, bloomRadius);\n\
      }\n\
      \n\
      void main() {\n\
          \n\
          vec4 color=texture2D(colorTexture, v_textureCoordinates);\n\
          vec4 bloomColor= bloomStrength * ( lerpBloomFactor(bloomFactors[0]) * vec4(bloomTintColors[0], 1.) * texture2D(blurTexture1, v_textureCoordinates) + \
                                          lerpBloomFactor(bloomFactors[1]) * vec4(bloomTintColors[1], 1.) * texture2D(blurTexture2, v_textureCoordinates) + \
                                          lerpBloomFactor(bloomFactors[2]) * vec4(bloomTintColors[2], 1.) * texture2D(blurTexture3, v_textureCoordinates) + \
                                          lerpBloomFactor(bloomFactors[3]) * vec4(bloomTintColors[3], 1.) * texture2D(blurTexture4, v_textureCoordinates) + \
                                          lerpBloomFactor(bloomFactors[4]) * vec4(bloomTintColors[4], 1.) * texture2D(blurTexture5, v_textureCoordinates) );\n\
          \n\
          #ifdef CZM_SELECTED_FEATURE\n\
              if (czm_selected()) {\n\
                  gl_FragColor =glowOnly?bloomColor*selectedBloomFactor: color+ bloomColor*selectedBloomFactor;\n\
                  return;\n\
              }\n\
          #endif\n\
          \n\
          gl_FragColor =glowOnly?bloomColor: bloomColor+color;\n\
      }";

  function createUnrealBloomStage(name, kernelSizeArray) {
    const { PostProcessStageComposite, Cartesian3, PostProcessStage, Color } = Cesium;

    name = name || "unreal_bloom";
    let nMips = 5;
    if (!kernelSizeArray) {
      kernelSizeArray = [3, 5, 7, 9, 11];
    }

    let highPass = createLuminosityHighPass(name);

    let separableBlurStages = [highPass];

    let textureScale = 0.5;
    for (var i = 0; i < nMips; i++) {
      let separableBlurStage = createSeparableBlur(name + "_blur_" + i, kernelSizeArray[i], textureScale);
      separableBlurStages.push(separableBlurStage);
      textureScale = textureScale / 2;
    }

    let blurComposite = new PostProcessStageComposite({
      name: name + "_blur_composite",
      stages: separableBlurStages,
      inputPreviousStageTexture: true,
    });

    let generateCompositeShader = {
      defines: {
        NUM_MIPS: nMips,
      },

      uniforms: {
        blurTexture1: separableBlurStages[0].name,
        blurTexture2: separableBlurStages[1].name,
        blurTexture3: separableBlurStages[2].name,
        blurTexture4: separableBlurStages[3].name,
        blurTexture5: separableBlurStages[4].name,
        // "dirtTexture": { value: null },
        bloomStrength: 1.0,
        bloomFactors: [1.0, 0.8, 0.6, 0.4, 0.2],
        bloomTintColors: [new Cartesian3(1, 1, 1), new Cartesian3(1, 1, 1), new Cartesian3(1, 1, 1), new Cartesian3(1, 1, 1), new Cartesian3(1, 1, 1)],
        bloomRadius: 0.1,
        glowOnly: false,
        selectedBloomFactor: 0.1,
      },

      fragmentShader: _shadersUnrealBloomComposite,
    };
    parseDefines(generateCompositeShader);
    let generateComposite = new PostProcessStage({
      name: name + "_generate_composite",
      fragmentShader: generateCompositeShader.fragmentShader,
      uniforms: generateCompositeShader.uniforms,
    });

    let uniforms = {};
    let bloomTintColor = Color.fromBytes(255, 255, 255, 255);
    let bloomFactor = 1;
    Object.defineProperties(uniforms, {
      threshold: {
        get() {
          return highPass.uniforms.luminosityThreshold;
        },
        set(val) {
          highPass.uniforms.luminosityThreshold = val;
        },
      },
      smoothWidth: {
        get() {
          return highPass.uniforms.smoothWidth;
        },
        set(val) {
          highPass.uniforms.smoothWidth = val;
        },
      },
      strength: {
        get() {
          return generateComposite.uniforms.bloomStrength;
        },
        set(val) {
          generateComposite.uniforms.bloomStrength = val;
        },
      },
      radius: {
        get() {
          return generateComposite.uniforms.bloomRadius;
        },
        set(val) {
          generateComposite.uniforms.bloomRadius = val;
        },
      },
      bloomFactors: {
        get() {
          return generateComposite.uniforms.bloomFactors;
        },
        set(val) {
          if (val) {
            generateComposite.uniforms.bloomFactors = val;
          }
        },
      },
      bloomFactor: {
        get() {
          return bloomFactor;
        },
        set(val) {
          if (typeof val != "number" || !val) return;
          bloomFactor = val;
          let step = bloomFactor / nMips;
          for (let i = 0; i < nMips; i++) {
            this.bloomFactors[i] = bloomFactor - step * i;
          }
        },
      },
      bloomTintColors: {
        get() {
          return generateComposite.uniforms.bloomTintColors;
        },
        set(val) {
          if (val) {
            generateComposite.uniforms.bloomTintColors = val;
          }
        },
      },
      bloomTintColor: {
        get() {
          return bloomTintColor;
        },
        set(val) {
          if (!val) return;

          const Color = Cesium.Color;
          if (typeof val == "number") {
            bloomTintColor = Color.fromRgba(val);
          } else if (typeof val == "string") {
            bloomTintColor = Color.fromCssColorString(val);
          } else if (val.isColor) {
            bloomTintColor.red = val.r;
            bloomTintColor.green = val.g;
            bloomTintColor.blue = val.b;
          } else if (val instanceof Color) {
            bloomTintColor = val;
          } else {
            Color.clone(val, bloomTintColor);
          }

          generateComposite.uniforms.bloomTintColors.forEach(color => {
            color.x = bloomTintColor.red;
            color.y = bloomTintColor.green;
            color.z = bloomTintColor.blue;
          });
        },
      },
      glowOnly: {
        get() {
          return generateComposite.uniforms.glowOnly;
        },
        set(val) {
          generateComposite.uniforms.glowOnly = !!val;
        },
      },
      selectedBloomFactor: {
        get() {
          return generateComposite.uniforms.selectedBloomFactor;
        },
        set(val) {
          if (typeof val != "number" || !val) return;
          generateComposite.uniforms.selectedBloomFactor = val;
        },
      },
    });

    let composite = new PostProcessStageComposite({
      name: name,
      stages: [blurComposite, generateComposite],
      inputPreviousStageTexture: false,
      uniforms: uniforms,
    });
    return composite;
  }

  const version = "1.0.0";
  let E = {
    expando: "effect" + (version + Math.random()).replace(/\D/g, ""),

    createUnrealBloomStage,
    Effect,
    Spread,
    DynamicLine,
    SolidWall,
    AtmosphericEffects,
    bright,
    runshineAnalysis,
  };

  Object.defineProperties(E, {
    map: {
      get: function () {
        return 0;
      },
      set: function (e) {},
    },
  });

  G.extend({
    E,
  });

  if (typeof window.effect === "undefined") {
    window.effect = G.E;
  }
})(window);
