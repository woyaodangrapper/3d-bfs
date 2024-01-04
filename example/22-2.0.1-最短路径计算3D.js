var pageInit = {
  canvas: null,
  context: null,
  size: 8,
  grid: [],
  init: function (options) {
    this.canvas = options.canvas
    this.context = this.canvas.getContext("2d");
    this.resizeCanvas()
    this.showCanvasGrid()
    this.test()

  },
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
  createCanvasPoint: function ({ x, y, color = "#16D46B", size = 5 }) {
    const context = this.context
    context.beginPath();
    context.fillStyle = color;
    context.arc(x, y, size, 0, 2 * Math.PI);
    context.fill();
  },
  createCanvasLines: function (shortestPath, { color = "#2440b3", size = 2 } = {}) {
    if (shortestPath.length === 0) {
      return;
    }
    const context = this.context
    context.beginPath();
    context.moveTo(shortestPath[0].x, shortestPath[0].y);
    for (let index = 1; index < shortestPath.length; index++) {
      const element = shortestPath[index];
      context.lineTo(element.x, element.y);
    }
    context.lineWidth = size;
    context.strokeStyle = color
    context.stroke();
  },
  showGraph(graph, { size = 2, color = "#FF0000" } = {}) {
    var context = this.context
    context.beginPath();
    graph.forEach(elements => {
      context.moveTo(elements[0].x, elements[0].y);
      for (let index = 1; index < elements.length; index++) {
        const element = elements[index];
        context.lineTo(element.x, element.y);
      }
      context.lineWidth = size;
      context.strokeStyle = color
      context.stroke();
    });
  },
  showSplitLines(splitLines) {
    let init = 0;
    let timer = setInterval(() => {
      let elements = splitLines[init]
      context.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.showGraph(graph)
      context.beginPath();

      context.moveTo(elements[0].x, elements[0].y);
      context.lineTo(elements[1].x, elements[1].y);
      context.lineWidth = 2;
      context.strokeStyle = getRandomColor()

      context.closePath();
      context.stroke();

      init++;
      if (init >= splitLines.length) {
        clearInterval(timer)
      }
    }, 1000);
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
  test() {
    const graph = [
      [
        [
          {
            "x": -694416.0495296326,
            "y": -4867396.382496719,
            "z": 4047910.8222462116,
            "oid": 1
          },
          {
            "x": 2414898.405468124,
            "y": -4509098.135957064,
            "z": 3797164.0685321507,
            "oid": 2
          }
        ],
        [
          {
            "x": 281457.14862696663,
            "y": -4409737.845540441,
            "z": 4583891.880250573,
            "oid": 2
          },
          {
            "x": 292161.48318572156,
            "y": -5584052.014914569,
            "z": 3057593.8519711196,
            "oid": 3
          }
        ],
        [
          {
            "x": 1668344.0031517649,
            "y": -4245766.986666892,
            "z": 4442474.199420432,
            "oid": 3
          },
          {
            "x": 1628435.0135987992,
            "y": -5343070.536198258,
            "z": 3068227.2685943153,
            "oid": 4
          }
        ]
      ]]

    const newGraph = this.webMercatorWgs84Array(graph)
    debugger
    const start = { x: 85917.43041571067, y: -4679563.389112163 };
    const end = { x: 726174.3487238389, y: -5373659.101816352 };
    const intersectionPoints = this.algorithm.calculateLinesWithIntersections(newGraph);
    // const splitLines = this.algorithm.splitWithLines(intersectionPoints)
    debugger
    // const shortestPath = this.algorithm.dijkstra(splitLines, start, end);
  },
  webMercatorWgs84Array(cartesians) {
    let newCoordinates = []
    for (const cartesian of cartesians) {
      for (const [start, end] of cartesian) {
        const startWgs84 = this.webMercatorWgs84(start)
        const endWgs84 = this.webMercatorWgs84(end)
        newCoordinates.push([startWgs84, endWgs84])
      }
    }
    return newCoordinates
  },
  webMercatorWgs84(cartesian) {
    const cartesianCoordinates = new Cesium.Cartesian3(cartesian.x, cartesian.y, cartesian.z);
    const wgs84Coordinates = Cesium.Cartographic.fromCartesian(cartesianCoordinates);
    const longitude = Cesium.Math.toDegrees(wgs84Coordinates.longitude);// 经度值
    const latitude = Cesium.Math.toDegrees(wgs84Coordinates.latitude);
    const height = wgs84Coordinates.height;
    return {
      x: longitude,
      y: latitude,
      z: height,
    }
  },
  algorithm: {
    // 分割线段函数
    splitLines(intersections) {
      // 遍历交叉点数据
      const newLines = [];
      for (const intersection of intersections) {
        // 找到交叉点所在的线段
        const point = intersection.point;
        const lines = intersection.lines;
        for (const { start, end } of lines) {

          const headLine = [start, point];
          const tailLine = [point, end];
          newLines.push(headLine);
          newLines.push(tailLine);
        }
      }
      return newLines
    },
    splitWithLines(intersections) {
      // 遍历交叉点数据
      const newLines = [];
      for (const intersection of intersections) {
        // 找到交叉点所在的线段
        const { line: { start, end }, points } = intersection;
        // 将起点和终点加入到points数组中
        points.push(start, end);
        // 根据x坐标对points数组进行排序
        points.sort((a, b) => a.x - b.x);
        // 遍历points数组，将每两个相邻的点作为一个新的线段
        for (let i = 0; i < points.length - 1; i++) {
          newLines.push([points[i], points[i + 1]]);
        }
      }
      return newLines
    },
    // 计算最短路径
    dijkstra(graph, start, end) {
      const nodes = new Set();
      const distances = {};
      const previous = {};
      const path = [];

      // 初始化距离和前置节点
      graph.forEach(edge => {
        edge.forEach(point => {
          nodes.add(`${point.x},${point.y}`);
          distances[`${point.x},${point.y}`] = Infinity;
          previous[`${point.x},${point.y}`] = null;
        });
      });

      distances[`${start.x},${start.y}`] = 0;

      while (nodes.size > 0) {
        const currentNode = getMinDistanceNode(nodes, distances);
        nodes.delete(currentNode);

        graph.forEach(edge => {
          const [point1, point2] = edge;

          if (`${point1.x},${point1.y}` === currentNode || `${point2.x},${point2.y}` === currentNode) {
            const neighbor = `${point1.x},${point1.y}` === currentNode ? `${point2.x},${point2.y}` : `${point1.x},${point1.y}`;
            const newDistance = distances[currentNode] + distance(point1, point2);
            // if (newDistance < distances[neighbor]) {
            //   distances[neighbor] = newDistance;
            //   previous[neighbor] = currentNode;
            // }

            // 使用阈值进行浮点数比较 解决精度问题 (https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/EPSILON)
            if (newDistance + Number.EPSILON < distances[neighbor]) {
              distances[neighbor] = newDistance;
              previous[neighbor] = currentNode;
            }
          }
        });
      }

      let current = `${end.x},${end.y}`;
      while (current !== null) {
        path.unshift(current);
        current = previous[current];
      }

      return path.map(point => {
        const [x, y] = point.split(',').map(coord => Number(coord));
        // const [x, y] = point.split(',').map(coord => parseFloat(coord));
        // const [x, y] = point.split(',').map(coord => parseInt(coord));
        return { x, y };
      });

      function getMinDistanceNode(nodes, distances) {
        return Array.from(nodes).reduce((minNode, node) => (
          distances[node] < distances[minNode] ? node : minNode
        ), Array.from(nodes)[0]);
      }

      function distance(point1, point2) {
        const dx = point1.x - point2.x;
        const dy = point1.y - point2.y;
        // 将浮点数距离转换为字符串，保留足够的精度
        return parseFloat(Math.sqrt(dx * dx + dy * dy).toFixed(15));
        // return Math.sqrt(dx * dx + dy * dy);
      }
    },
    // 计算每条线段与其他线段的交点
    calculateLinesWithIntersections(graph) {
      // // 定义两条线
      // const line1 = turf.lineString([[lon1, lat1], [lon2, lat2]]);
      // const line2 = turf.lineString([[lon3, lat3], [lon4, lat4]]);

      // // 计算交叉点
      // const intersection = turf.lineIntersect(line1, line2);


      const intersections = [];
      for (let i = 0; i < graph.length; i++) {
        const line1 = graph[i];
        let lineIntersections = [];

        for (let j = 0; j < graph.length; j++) {
          if (i !== j) {
            const line2 = graph[j];

            for (let k = 0; k < line1.length - 1; k++) {
              const p1 = line1[k];
              const p2 = line1[k + 1];

              for (let l = 0; l < line2.length - 1; l++) {
                const p3 = line2[l];
                const p4 = line2[l + 1];

                const aa = { p1, p2, p3, p4 }
                // 定义两条线的坐标
                const x1 = turf.lineString([
                  [p1.x, p1.y],
                  [p2.x, p2.y],
                ]);

                const x2 = turf.lineString([
                  [p3.x, p3.y],
                  [p4.x, p4.y],
                ]);

                // 找到两条线的交叉点
                const intersectionx = turf.lineIntersect(x1, x2);
                debugger
                const intersection = this.calculateIntersection(p1, p2, p3, p4);
                if (intersection) {
                  lineIntersections.push(intersection);
                }
              }
            }
          }
        }

        if (lineIntersections.length > 0) {
          intersections.push({
            line: { start: line1[0], end: line1[line1.length - 1] },
            points: lineIntersections,
          });
        }
      }

      return intersections;


    },
  },
}

function getRandomColor() {
  var letters = "0123456789ABCDEF";
  var color = "#";
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}