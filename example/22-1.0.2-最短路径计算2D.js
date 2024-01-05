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
    // 一个或多个线条二维坐标数组
    const graph =
      [
        [{ x: 298, y: 52 }, { x: 185, y: 440 }],
        [{ x: 59, y: 163 }, { x: 654, y: 271 }],
        [{ x: 38, y: 196 }, { x: 528, y: 417 }],
        [{ x: 415, y: 63 }, { x: 239, y: 465 }]
      ];
    this.showGraph(graph, { color: "#FF0000", size: 2 })

    const intersectionPoints = this.algorithm.calculateLinesWithIntersections(graph);
    debugger
    console.log(intersectionPoints)
    for (const crossPoint of intersectionPoints) {
      for (const point of crossPoint.points) {
        this.createCanvasPoint({ x: point.x, y: point.y, color: "#FFF", size: 5 })
      }
    }
    const splitLines = this.algorithm.splitWithLines(intersectionPoints)
    console.log("Intersection splitLines Points:", intersectionPoints, splitLines);

    // const context = this.context
    // const canvas = this.canvas
    // for (let index = 0; index < splitLines.length; index++) {
    //   const [start, end] = splitLines[index];
    //   context.beginPath();
    //   context.moveTo(start.x, start.y);
    //   context.lineTo(end.x, end.y);
    //   context.lineWidth = 2;
    //   context.strokeStyle = "#FF0000"
    //   context.stroke();
    // }
    const start = { x: 298, y: 52 };
    const end = { x: 38, y: 196 };
    this.createCanvasPoint({ x: start.x, y: start.y, color: "#FF0000", size: 10 })
    this.createCanvasPoint({ x: end.x, y: end.y, color: "#FF0000", size: 10 })
    const shortestPath = this.algorithm.dijkstra(splitLines, start, end);
    this.createCanvasLines(shortestPath, { size: 5 })

    console.log("最短路径：", shortestPath);
  },
  webMercatorCoordinatesArray(cartesians, zoom = 1023) {
    let newCoordinates = []
    for (const cartesian of cartesians) {
      for (const data of cartesian) {
        const coordinates = this.webMercatorCoordinates(data, zoom)
        newCoordinates.push(coordinates)
      }
    }
    return newCoordinates
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
    // 计算交点 
    calculateIntersectionPoints(graph) {
      const intersections = [];
      for (let i = 0; i < graph.length - 1; i++) {
        const line1 = graph[i];

        for (let j = i + 1; j < graph.length; j++) {
          const line2 = graph[j];

          for (let k = 0; k < line1.length - 1; k++) {
            const p1 = line1[k];
            const p2 = line1[k + 1];

            for (let l = 0; l < line2.length - 1; l++) {
              const p3 = line2[l];
              const p4 = line2[l + 1];

              const intersection = this.calculateIntersection(p1, p2, p3, p4);
              if (intersection) {
                intersections.push({
                  point: intersection,
                  lines: [{ start: p1, end: p2, lineIndex: i }, { start: p3, end: p4, lineIndex: j }],
                });
              }
            }
          }
        }
      }

      return intersections;
    },
    // 计算每条线段与其他线段的交点
    calculateLinesWithIntersections(graph) {
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
    // 计算交点坐标 (辅助函数) (https://en.wikipedia.org/wiki/Line%E2%80%93line_intersection)
    calculateIntersection(p1, p2, p3, p4) {
      const ua =
        ((p4.x - p3.x) * (p1.y - p3.y) - (p4.y - p3.y) * (p1.x - p3.x)) /
        ((p4.y - p3.y) * (p2.x - p1.x) - (p4.x - p3.x) * (p2.y - p1.y));
      const ub =
        ((p2.x - p1.x) * (p1.y - p3.y) - (p2.y - p1.y) * (p1.x - p3.x)) /
        ((p4.y - p3.y) * (p2.x - p1.x) - (p4.x - p3.x) * (p2.y - p1.y));
      if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {
        const intersectionX = p1.x + ua * (p2.x - p1.x);
        const intersectionY = p1.y + ua * (p2.y - p1.y);
        // Round the intersection coordinates to 12 decimal places
        const roundedIntersectionX = parseFloat(intersectionX.toFixed(12));
        const roundedIntersectionY = parseFloat(intersectionY.toFixed(12));
        // 为了解决后续算法出现的精度问题，这里将交点坐标保留12位小数
        return { x: roundedIntersectionX, y: roundedIntersectionY };
      }

      return null;
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