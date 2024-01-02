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
  createCanvasLine: function (shortestPath, { color = "#2440b3", size = 2 } = {}) {
    if (shortestPath.length === 0) {
      return;
    }
    const context = this.context
    context.moveTo(shortestPath[0].x, shortestPath[0].y);
    for (let index = 1; index < shortestPath.length; index++) {
      const element = shortestPath[index];
      context.lineTo(element.x, element.y);
    }
    context.lineWidth = size;
    context.strokeStyle = color
    context.stroke();
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
    const end = { x: 185, y: 440 };   // 便利店的位置
    this.createCanvasPoint({ x: start.x, y: start.y, color: "#FF0000" })
    this.createCanvasPoint({ x: end.x, y: end.y, color: "#FF0000" })


    // 转换数据结构为BFS算法所需形式
    function convertToBFS(graph) {
      const adjacencyList = new Map();

      // Build the adjacency list from the given graph
      for (let i = 0; i < graph.length; i++) {
        for (let j = 0; j < graph[i].length; j++) {
          const currentNode = graph[i][j];

          // Create an empty array for the current node in the adjacency list
          adjacencyList.set(getNodeKey(currentNode), []);

          // Add edges to the adjacency list
          if (j > 0) {
            const prevNode = graph[i][j - 1];
            addEdge(adjacencyList, currentNode, prevNode);
          }

          if (i > 0) {
            const upperNode = graph[i - 1][j];
            addEdge(adjacencyList, currentNode, upperNode);
          }
        }
      }

      return adjacencyList;
    }

    function addEdge(adjacencyList, node1, node2) {
      adjacencyList.get(getNodeKey(node1)).push(getNodeKey(node2));
      adjacencyList.get(getNodeKey(node2)).push(getNodeKey(node1));
    }

    function getNodeKey(node) {
      return `${node.x},${node.y}`;
    }
    function bfs(graph, start, target) {
      const visited = new Set();
      const queue = [[start, []]];
      while (queue.length > 0) {
        const [currentNode, path] = queue.shift();

        if (currentNode === target) {
          return path.concat(currentNode);
        }

        if (!visited.has(currentNode)) {
          visited.add(currentNode);
          const neighbors = graph.get(currentNode) || [];

          for (const neighbor of neighbors) {
            if (!visited.has(neighbor)) {
              queue.push([neighbor, path.concat(currentNode)]);
            }
          }
        }
      }

      return null; // If no path is found
    }

    function convertStringToXYObject(inputString) {
      const result = [];

      for (let index = 0; index < inputString.length; index++) {
        const element = inputString[index];
        const coordinates = element.split(',').map(Number);
        for (let i = 0; i < coordinates.length; i += 2) {
          result.push({ x: coordinates[i], y: coordinates[i + 1] });
        }
      }

      return result;
    }

    const startNode = "298,52";
    const targetNode = "59,163";
    const bfsGraph = convertToBFS(graph);

    const shortestPath = bfs(bfsGraph, startNode, targetNode);

    if (shortestPath) {
      console.log(`Shortest path from ${startNode} to ${targetNode}: ${shortestPath}`);
      const xyObjects = convertStringToXYObject(shortestPath);
      this.createCanvasLine(xyObjects)

    } else {
      console.log(`No path found from ${startNode} to ${targetNode}`);
    }

    debugger
    console.log(`转换数据结构为BFS算法所需形式:`, bfsGraph);

  }
}
