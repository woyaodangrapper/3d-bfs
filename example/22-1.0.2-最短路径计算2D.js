var pageInit = {
  canvas: null,
  viewer: null,
  context: null,
  size: 8,
  grid: [],
  init: function (options) {
    this.canvas = options.canvas
    this.viewer = options.viewer
    this.context = this.canvas.getContext("2d");
    // this.initExampleData()
    this.resizeCanvas()
    this.showCanvasGrid()
    // this.showCanvasPoint()
    this.test()

  },
  initExampleData: function () {
    this.grid = [
      [
        {
          "x": -508000.1133700637,
          "y": -4639279.464654529,
          "z": 4332746.464047527,
          "oid": 1
        },
        {
          "x": 2362103.042650178,
          "y": -5009306.689512873,
          "z": 3152813.701283045,
          "oid": 2
        },
        {
          "x": 2204046.731146804,
          "y": -4057027.590254493,
          "z": 4385573.956435748,
          "oid": 3
        }
      ],
      [
        {
          "x": -518571.13834141754,
          "y": -4706700.044504273,
          "z": 4258622.6507786205,
          "oid": 3
        },
        {
          "x": 2386928.2295798166,
          "y": -4230958.536223587,
          "z": 4119165.837246711,
          "oid": 4
        },
        {
          "x": -372308.3669996348,
          "y": -5578863.050694464,
          "z": 3058581.376460309,
          "oid": 5
        }
      ],
      [
        {
          "x": 1051972.5447096291,
          "y": -4402774.390625431,
          "z": 4478159.8058881145,
          "oid": 5
        },
        {
          "x": 1176292.6744638083,
          "y": -5356660.634419123,
          "z": 3245303.918063604,
          "oid": 6
        },
        {
          "x": -229617.42795581766,
          "y": -4921126.537127274,
          "z": 4037330.4907501778,
          "oid": 7
        },
        {
          "x": 2563335.1893934575,
          "y": -4405978.022725804,
          "z": 3820776.0076626963,
          "oid": 8
        },
        {
          "x": -80610.26483353763,
          "y": -5342169.2504423335,
          "z": 3471805.523497485,
          "oid": 9
        }
      ]
    ]
  },
  // 显示网格
  showCanvasGrid: function () {
    const gridSize = this.size;
    const canvas = this.canvas;
    const cellWidth = canvas.width / gridSize;
    const cellHeight = canvas.height / gridSize;
    const context = this.context;

    for (let i = 0; i <= gridSize; i++) {
      const y = i * cellHeight;
      context.moveTo(0, y);
      context.lineTo(canvas.width, y);
    }

    for (let j = 0; j <= gridSize; j++) {
      const x = j * cellWidth;
      context.moveTo(x, 0);
      context.lineTo(x, canvas.height);
    }

    context.strokeStyle = '#ddd';
    context.stroke();


  },
  // 显示画点
  showCanvasPoint() {
    // 找到最小和最大坐标值

    var flatArray = this.grid.reduce(function (result, innerArray) {
      return result.concat(innerArray);
    }, []);
    const length = this.getMinMaxDimension(flatArray)
    const minRange = Cesium.Cartesian3.fromDegrees(
      length.minX, length.minY, length.minZ
    );

    const maxRange = Cesium.Cartesian3.fromDegrees(
      length.maxX, length.maxY, length.maxZ
    );

    // let grid = flatArray.map(node => {
    //   const cartesian2 = this.cartesian3DTo2D(node, this.viewer)
    //   return [cartesian2.x, cartesian2.y]
    // })
    // grid = this.recenterCoordinates(grid)
    // // 画点
    // for (let index = 0; index < grid.length; index++) {
    //   const element = grid[index];
    //   let position = {
    //     x: element[0],
    //     y: element[1],
    //   }
    //   this.createCanvasPoint(position)
    // }

    this.bfs3D()
  },
  // 画点
  createCanvasPoint: function ({ x, y, color = "#16D46B", size = 5 }) {
    const context = this.context
    context.beginPath();
    context.fillStyle = color;
    context.arc(x, y, size, 0, 2 * Math.PI);
    context.fill();
  },
  /**
 * 归一
 * @param {Object} cartesian 
 * @param {Object} min 
 * @param {Object} max 
 * @returns {Object} 归一化后的坐标
 */
  normalizeCoordinates(cartesian, min, max) {
    // 添加类型检查
    if (
      typeof cartesian !== 'object' ||
      typeof min !== 'object' ||
      typeof max !== 'object'
    ) {
      throw new Error("Invalid input. Expected objects for cartesian, min, and max.");
    }

    // 避免除零错误
    if ((max.x - min.x) === 0 || (max.y - min.y) === 0 || (max.z - min.z) === 0) {
      throw new Error("Denominator cannot be zero. Check the input range.");
    }

    var normalizedX = (cartesian.x - min.x) / (max.x - min.x);
    var normalizedY = (cartesian.y - min.y) / (max.y - min.y);
    var normalizedZ = (cartesian.z - min.z) / (max.z - min.z);

    return { x: normalizedX, y: normalizedY, z: normalizedZ };
  },
  /**
   * 逆归一
   * @param {Object} normalizedCartesian 
   * @param {Object} min 
   * @param {Object} max 
   * @returns {Object} 逆归一化后的坐标
   */
  denormalizeCoordinates(normalizedCartesian, min, max) {
    // 添加类型检查
    if (
      typeof normalizedCartesian !== 'object' ||
      typeof min !== 'object' ||
      typeof max !== 'object'
    ) {
      throw new Error("Invalid input. Expected objects for normalizedCartesian, min, and max.");
    }

    // 避免除零错误
    if ((max.x - min.x) === 0 || (max.y - min.y) === 0 || (max.z - min.z) === 0) {
      throw new Error("Denominator cannot be zero. Check the input range.");
    }

    var denormalizedX = normalizedCartesian.x * (max.x - min.x) + min.x;
    var denormalizedY = normalizedCartesian.y * (max.y - min.y) + min.y;
    var denormalizedZ = normalizedCartesian.z * (max.z - min.z) + min.z;

    return { x: denormalizedX, y: denormalizedY, z: denormalizedZ };
  },
  /**
   * 根据放大倍数放大归一化后的数据
   * @param {Object} normalizedCartesian 归一化后的坐标
   * @param {number} scale 放大倍数
   * @returns {Object} 放大后的坐标
   */
  amplifyNormalizedCoordinates(normalizedCartesian, min, max, scale) {
    // 添加类型检查
    if (typeof normalizedCartesian !== 'object') {
      throw new Error("Invalid input. Expected an object for normalizedCartesian.");
    }
    let cartesian = this.denormalizeCoordinates(normalizedCartesian, min, max)
    let transformedX = (cartesian.x - min.x) / (max.x - min.x) * scale;
    let transformedY = (cartesian.y - min.y) / (max.y - min.y) * scale;
    let transformedZ = (cartesian.z - min.z) / (max.z - min.z) * scale;
    return { x: transformedX, y: transformedY, z: transformedZ };
  },
  getMinMaxDimension(coordinates) {
    if (coordinates.length === 0) {
      throw new Error("coordinates is null");
    }

    // 找到每个维度的最小值
    const minX = Math.min(...coordinates.map(coord => coord.x));
    const minY = Math.min(...coordinates.map(coord => coord.y));
    const minZ = Math.min(...coordinates.map(coord => coord.z));

    // 找到每个维度的最大值
    const maxX = Math.max(...coordinates.map(coord => coord.x));
    const maxY = Math.max(...coordinates.map(coord => coord.y));
    const maxZ = Math.max(...coordinates.map(coord => coord.z));
    return { minX, minY, minZ, maxX, maxY, maxZ };
  },
  resizeCanvas: function () {
    const canvas = this.canvas;
    window.addEventListener('resize', resize);
    function resize() {
      const bodyElement = document.body;
      canvas.width = bodyElement.offsetWidth;
      canvas.height = bodyElement.offsetHeight;
    }
    resize()
  },
  getCanvasSize: function () {
    return {
      x: this.canvas.width,
      y: this.canvas.height,
    }
  },
  cartesian3DTo2D({ x, y, z }, viewer) {
    let scene = viewer.scene;
    let cartesian3D = new Cesium.Cartesian3(x, y, z);
    let cartesian2D = Cesium.SceneTransforms.wgs84ToWindowCoordinates(scene, cartesian3D);

    // 将浮点坐标值取整
    let x2D = Math.round(cartesian2D.x);
    let y2D = Math.round(cartesian2D.y);
    return { x: x2D, y: y2D };
  },
  recenterCoordinates(coordinates) {
    if (coordinates.length === 0) {
      return coordinates; // 如果没有坐标，直接返回
    }

    // 找到每个维度的最小值
    const minX = Math.min(...coordinates.map(coord => coord[0]));
    const minY = Math.min(...coordinates.map(coord => coord[1]));
    // 重新偏移坐标
    const recenteredCoordinates = coordinates.map(coord => [
      coord[0] - minX,
      coord[1] - minY
    ]);

    return recenteredCoordinates;
  },
  bfs3D() {

    // let positions = []
    // for (let index = 0; index < this.grid.length; index++) {
    //   const array = this.grid[index];
    //   let gridTmp = array.map(node => {
    //     const cartesian2 = this.cartesian3DTo2D(node, this.viewer)
    //     return [cartesian2.x, cartesian2.y]
    //   });
    //   positions.push(this.recenterCoordinates(gridTmp))
    // }
    // let wallCoordinates = [], roadCoordinates = []
    // for (let index = 0; index < positions.length; index++) {
    //   const elements = positions[index];
    //   for (let i = 0; i < elements.length - 1; i++) {
    //     const coord1 = elements[i];
    //     const coord2 = elements[i + 1];
    //     const filledCoordinates = this.bresenhamLine(coord1, coord2);
    //     for (let i = 0; i < filledCoordinates.length; i++) {
    //       const element = filledCoordinates[i];
    //       roadCoordinates.push({ x: element[0], y: element[1] })
    //     }
    //   }

    // }

    // // roadCoordinates.forEach(element => {
    // //   this.createCanvasPoint({ x: element.x, y: element.y, color: "#FF0000", size: 1 })
    // // });
    // //  
    // var flatArray = positions.reduce(function (result, innerArray) {
    //   return result.concat(innerArray);
    // }, []);

    // const maxX = Math.max(...flatArray.map(coord => coord[0]));
    // const maxY = Math.max(...flatArray.map(coord => coord[1]));

    // let gridWidth = maxX + 1, gridHeight = maxY + 1

    // // wallCoordinates.forEach(element => {
    // //   this.createCanvasPoint({ x: element.x, y: element.y, color: "#FFF", size: 1 })
    // // });
    // // 设置起点和终点
    // const star = flatArray[0];
    // const end = flatArray[flatArray.length - 1];

    // this.createCanvasPoint({ x: star[0], y: star[1], color: "#FF0000" })
    // this.createCanvasPoint({ x: end[0], y: end[1], color: "#FF0000" })
  },
  bresenhamLine([x0, y0], [x1, y1]) {
    const coordinates = [];
    let dx = Math.abs(x1 - x0);
    let dy = Math.abs(y1 - y0);
    let sx = x0 < x1 ? 1 : -1;
    let sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;
    while (true) {
      coordinates.push([Math.round(x0), Math.round(y0)]);

      if (x0 === x1 && y0 === y1) {
        break;
      }

      let e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        x0 += sx;
      }

      if (e2 < dx) {
        err += dx;
        y0 += sy;
      }
    }

    return coordinates;
  },
  test() {
    // 示例数据
    const graph = [
      [{ x: 298, y: 52 }, { x: 185, y: 440 }],
      [{ x: 59, y: 163 }, { x: 654, y: 271 }],
      [{ x: 38, y: 196 }, { x: 528, y: 417 }],
      [{ x: 415, y: 63 }, { x: 239, y: 465 }]
    ];


    var context = this.context
    context.beginPath();
    graph.forEach(elements => {

      context.moveTo(elements[0].x, elements[0].y);
      for (let index = 1; index < elements.length; index++) {
        const element = elements[index];
        context.lineTo(element.x, element.y);
      }
      context.lineWidth = 2;
      context.strokeStyle = "#f73131"
      context.stroke();

    });

    const start = { x: 298, y: 52 }; // 家的位置
    const end = { x: 415, y: 63 };   // 便利店的位置
    this.createCanvasPoint({ x: start.x, y: start.y, color: "#FF0000" })
    this.createCanvasPoint({ x: end.x, y: end.y, color: "#FF0000" })

    function convertToAdjacencyList(graph) {
      const adjacencyList = {};

      for (let i = 0; i < graph.length; i++) {
        for (let j = 0; j < graph[i].length; j++) {
          const node = graph[i][j];
          const key = `(${node.x},${node.y})`;

          if (!adjacencyList[key]) {
            adjacencyList[key] = [];
          }

          if (j < graph[i].length - 1) {
            const nextNode = graph[i][j + 1];
            const nextKey = `(${nextNode.x},${nextNode.y})`;
            adjacencyList[key].push(nextKey);
            adjacencyList[nextKey] = [key];
          }

          if (i < graph.length - 1) {
            const belowNode = graph[i + 1][j];
            const belowKey = `(${belowNode.x},${belowNode.y})`;
            adjacencyList[key].push(belowKey);
            adjacencyList[belowKey] = [key];
          }
        }
      }

      return adjacencyList;
    }

    function bfsShortestPath(graph, start, end) {
      const adjacencyList = convertToAdjacencyList(graph);
      const visited = new Set();
      const queue = [[start]];

      if (start === end) {
        return [start];
      }

      while (queue.length > 0) {
        const path = queue.shift();
        const node = path[path.length - 1];

        if (!visited.has(node)) {
          const neighbors = adjacencyList[node] || [];

          for (const neighbor of neighbors) {
            const newPath = [...path, neighbor];
            queue.push(newPath);

            if (neighbor === end) {
              return newPath.map(node => {
                const match = /\((\d+),(\d+)\)/.exec(node);
                return { x: parseInt(match[1]), y: parseInt(match[2]) };
              });
            }
          }

          visited.add(node);
        }
      }

      return null; // No path found
    }
    const shortestPath = bfsShortestPath(graph, `(${start.x},${start.y})`, `(${end.x},${end.y})`);

    if (shortestPath) {
      console.log("Shortest Path:", shortestPath);


      context.moveTo(shortestPath[0].x, shortestPath[0].y);
      for (let index = 1; index < shortestPath.length; index++) {
        const element = shortestPath[index];
        context.lineTo(element.x, element.y);
      }
      context.lineWidth = 2;
      context.strokeStyle = "#2440b3"
      context.stroke();

    } else {
      console.log("No path found.");
    }

  },
}
