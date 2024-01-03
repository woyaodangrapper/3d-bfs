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
  algorithm: {
    // 分割线段函数
    splitLines(crossPoints, lines) {
      const newLines = [];

      const splitLinesIndex = new Set();
      for (const crossPoint of crossPoints) {
        const { point, lines: connectedLines } = crossPoint;
        for (const connectedLine of connectedLines) {
          const { start, end, lineIndex } = connectedLine;
          // 计算分割点的坐标
          const splitPointX = point.x;
          const splitPointY = point.y;

          // 只有当线段还没有被分割时，才进行分割
          if (!splitLinesIndex.has(lineIndex)) {
            // 分割线段
            const newLine1 = [start, { x: splitPointX, y: splitPointY }];
            newLines.push(newLine1);
            splitLinesIndex.add(lineIndex);
          }

          // 对于已经被分割的线段，我们只需要添加一条新线段
          const newLine2 = [{ x: splitPointX, y: splitPointY }, end];
          newLines.push(newLine2);
        }
      }

      // 添加未被分割的线段
      for (const line of lines) {
        if (!crossPoints.some((crossPoint) => crossPoint.lines.some((l) => l.lineIndex === lines.indexOf(line)))) {
          newLines.push(line);
        }
      }

      return newLines;
    },
    splitLines2(intersections, graph) {
      // 遍历交叉点数据
      const newGraph = [];
      for (const intersection of intersections) {
        // 找到交叉点所在的线段
        const lines = intersection.lines;
        for (const line of lines) {
          const index = graph.findIndex((g) => g[0] === line.start && g[1] === line.end);
          if (index !== -1) {
            // 计算交叉点在线段上的比例
            const start = graph[index][0];
            const end = graph[index][1];
            const dx = end.x - start.x;
            const dy = end.y - start.y;
            const x = intersection.point.x - start.x;
            const y = intersection.point.y - start.y;
            const ratio = (x * dx + y * dy) / (dx * dx + dy * dy);

            // 将线段分割为两个线段
            const newLine1 = [start, { x: start.x + ratio * dx, y: start.y + ratio * dy }];
            const newLine2 = [newLine1[1], end];

            // 添加到新图中
            newGraph.push(newLine1);
            newGraph.push(newLine2);
          }
        }
      }
      return newGraph
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

            if (newDistance < distances[neighbor]) {
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
        const [x, y] = point.split(',').map(coord => parseInt(coord));
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
        return Math.sqrt(dx * dx + dy * dy);
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
        return { x: intersectionX, y: intersectionY };
      }

      return null;
    },
  },
  test() {
    // 一个或多个线条二维坐标数组
    const graph =
      [
        [{ x: 298, y: 52 }, { x: 185, y: 440 }],
        [{ x: 59, y: 163 }, { x: 654, y: 271 }],
        // [{ x: 38, y: 196 }, { x: 528, y: 417 }],
        [{ x: 415, y: 63 }, { x: 239, y: 465 }]
      ];
    const intersectionPoints = this.algorithm.calculateIntersectionPoints(graph);

    // const splitLines = this.algorithm.splitLines(intersectionPoints, graph)
    // console.log("Intersection Points:", intersectionPoints, splitLines);
    // for (const crossPoint of intersectionPoints) {
    //   this.createCanvasPoint({ x: crossPoint.point.x, y: crossPoint.point.y, color: "#FFF" })
    // }
    this.test2()
    // for (const crossPoint of intersectionPoints) {
    //   for (const connectedLine of crossPoint.lines) {
    //     const { start, end } = connectedLine;
    //     this.createCanvasPoint({ x: start.x, y: start.y, color: "#FFF" })
    //     this.createCanvasPoint({ x: end.x, y: end.y, color: "#FFF" })
    //   }
    // }

    // const start = { x: 298, y: 52 };
    // const end = { x: 415, y: 63 };
    // this.createCanvasPoint({ x: start.x, y: start.y, color: "#FF0000", size: 10 })
    // this.createCanvasPoint({ x: end.x, y: end.y, color: "#FF0000", size: 10 })
    // const shortestPath = dijkstra(splitLines, start, end);
    // this.createCanvasLines(shortestPath, { size: 2 })
    // console.log("最短路径：", shortestPath, splitLines);
  },
  test2() {
    const graph = [
      [{ x: 298, y: 52 }, { x: 185, y: 440 }],
      [{ x: 59, y: 163 }, { x: 654, y: 271 }],
      [{ x: 415, y: 63 }, { x: 239, y: 465 }]
    ];

    const intersectionPoints = this.algorithm.calculateIntersectionPoints(graph);
    console.log("Intersection Points:", intersectionPoints);
    const splitLines = this.algorithm.splitLines2(intersectionPoints, graph);

    const context = this.context
    const canvas = this.canvas

    for (let index = 0; index < splitLines.length; index++) {
      context.clearRect(0, 0, canvas.width, canvas.height);
      const [start, end] = splitLines[index];

      // let py = 40 * (index + 1)
      context.beginPath();
      context.moveTo(start.x, start.y);
      context.lineTo(end.x, end.y);
      context.lineWidth = 2;
      context.strokeStyle = getRandomColor()
      context.stroke();
      debugger

    }


    console.log(splitLines);
  }
}
function getRandomColor() {
  var letters = "0123456789ABCDEF";
  var color = "#";
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}