var pageInit = {
  viewer: null,
  init: function (options) {
    this.viewer = options.viewer
    this.test()

  },
  createCesiumPoint: function ({ x, y }, { color = "#16D46B", size = 5 }) {
    const material = Cesium.Color.fromCssColorString(color);
    return this.viewer.entities.add({
      position: Cesium.Cartesian3.fromDegrees(x, y, 20),
      point: {
        color: material,
        pixelSize: size,
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,  // 无论如何缩放，标记点不被地形遮挡
        clampToGround: true,
      },

    })
  },
  createCesiumLines: function (shortestPath, { color = "#2440b3", size = 2 } = {}) {
    if (shortestPath.length === 0) {
      return;
    }
    const material = Cesium.Color.fromCssColorString(color);
    const positions = Cesium.Cartesian3.fromDegreesArray(shortestPath)
    return this.viewer.entities.add({
      polyline: {
        positions,
        width: size,
        material,
        clampToGround: true,
      }
    })
  },
  showGraph(graph, { size = 2, color = "#FF0000" } = {}) {
    let entities = []
    const material = Cesium.Color.fromCssColorString(color);
    graph.forEach(elements => {
      const lines = [];
      elements.forEach(element => {
        lines.push(element.x, element.y)
        // this.createCesiumPoint(element, { size: 10 })
      });
      const positions = Cesium.Cartesian3.fromDegreesArray(lines)
      const entity = this.viewer.entities.add({
        polyline: {
          positions: positions,
          width: size,
          material,
          clampToGround: true,
        },
      })
      entities.push(entity)
    });

    return entities
  },
  // 根据最远距离绘制矩形
  drawCesiumRectangle(farthestDistance) {
    const rectangleEntity = this.viewer.entities.add({
      rectangle: {
        coordinates: Cesium.Rectangle.fromDegrees(
          farthestDistance.topLeft.x, farthestDistance.bottomRight.y,
          farthestDistance.bottomRight.x, farthestDistance.topLeft.y
        ),
        material: Cesium.Color.RED.withAlpha(0.2),
        outline: true,
        outlineColor: Cesium.Color.BLACK,
        clampToGround: true,
      },
    });
    this.viewer.zoomTo(rectangleEntity);
  },
  getRandomColor() {
    var letters = "0123456789ABCDEF";
    var color = "#";
    for (var i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  },
  test() {
    const graph =
      [
        [
          {
            "x": 306630.7193963019,
            "y": -4899980.4938360145,
            "z": 4057810.569051184,
            "oid": 1
          },
          {
            "x": 310742.73985302774,
            "y": -4899729.785786595,
            "z": 4057800.818137084,
            "oid": 2
          },
          {
            "x": 314045.9389229774,
            "y": -4899482.177889724,
            "z": 4057845.1853814623,
            "oid": 3
          },
          {
            "x": 316446.18264782813,
            "y": -4899297.239981003,
            "z": 4057881.767006526,
            "oid": 4
          },
          {
            "x": 318444.67947947746,
            "y": -4899156.362238748,
            "z": 4057895.4086734382,
            "oid": 5
          }
        ],
        [
          {
            "x": 308209.9744873236,
            "y": -4898859.688844325,
            "z": 4059036.003404969,
            "oid": 5
          },
          {
            "x": 308288.20498322166,
            "y": -4899437.242490877,
            "z": 4058337.606698183,
            "oid": 6
          },
          {
            "x": 308258.7756753211,
            "y": -4899691.82696436,
            "z": 4058034.517412217,
            "oid": 7
          },
          {
            "x": 308304.8683362478,
            "y": -4899826.551119394,
            "z": 4057869.4716055994,
            "oid": 8
          },
          {
            "x": 308328.9370702147,
            "y": -4900171.507236488,
            "z": 4057453.900173363,
            "oid": 9
          },
          {
            "x": 308369.58899279434,
            "y": -4900919.443164479,
            "z": 4056553.3874187116,
            "oid": 10
          },
          {
            "x": 308417.0413267278,
            "y": -4901467.049722103,
            "z": 4055892.5566507233,
            "oid": 11
          }
        ],
        [
          {
            "x": 307124.8824480425,
            "y": -4901019.65781412,
            "z": 4056526.9501650846,
            "oid": 11
          },
          {
            "x": 309955.7219499064,
            "y": -4900825.627506139,
            "z": 4056545.9079366955,
            "oid": 12
          },
          {
            "x": 310104.8136602833,
            "y": -4902888.793527864,
            "z": 4054057.4363482874,
            "oid": 13
          }
        ],
        [
          {
            "x": 311629.5292865234,
            "y": -4900615.594257167,
            "z": 4056493.514518942,
            "oid": 13
          },
          {
            "x": 314599.9057600778,
            "y": -4900493.184672512,
            "z": 4056589.7096322835,
            "oid": 14
          },
          {
            "x": 314463.9338058696,
            "y": -4898676.173874017,
            "z": 4058779.5138151534,
            "oid": 15
          }
        ]
      ]

    const graphManipulator = new GraphManipulator()
    const newWgs84Graph = graphManipulator.cartesian3ToWgs84Array(graph)
    this.showGraph(newWgs84Graph)

    const rectangle = graphManipulator._getFarthestRectangle(newWgs84Graph)
    this.drawCesiumRectangle(rectangle)

    const start = newWgs84Graph[0][0];
    const end = newWgs84Graph[1][1];
    this.createCesiumPoint(start, { size: 20 })
    this.createCesiumPoint(end, { size: 20 })
    const shortestPath = graphManipulator.findShortestPath(newWgs84Graph, { start, end });
    this.createCesiumLines(shortestPath.map(s => {
      return [s.x, s.y]
    }).flat(), { size: 10 })
  },

}


class GraphManipulator {
  constructor({ texture = 0 } = {}) {
    this.texture = texture

  }
  async findShortestPathAasync(graph, { start, end }) {
    return await new Promise((resolve, rej) => {
      try {
        return findShortestPath(graph, { start, end });
      } catch (error) {
        rej(error)
      }
    });
  }
  findShortestPath(graph, { start, end }) {
    console.log(graph, 'graph')
    if (graph.length === 0) {
      throw new Error("Graph is empty");
    }
    if (start === end) {
      throw new Error("Start and end nodes are the same");
    }
    if (!start || !end) {
      throw new Error("Start or end node is missing");
    }
    const rectangle = this._getFarthestRectangle(graph)
    let isValidStart = this._isPointInRectangle(start, rectangle)
    let isValidEnd = this._isPointInRectangle(end, rectangle)

    if (!isValidStart) {
      throw new Error("Start node is not in the graph");
    }
    if (!isValidEnd) {
      throw new Error("End node is not in the graph");
    }
    const splittedGraphSegments = this._splitSegments(graph, this.texture);
    const intersections = this._calculateIntersections(splittedGraphSegments);
    const splitLines = this._splitIntersectionLines(intersections);
    const newStart = this._findNearestLocation(start, splitLines.flat())
    const newEnd = this._findNearestLocation(end, splitLines.flat())
    const shortestPath = this._dijkstra(splitLines, newStart, newEnd);
    return shortestPath;
  }

  // 计算最短路径
  _dijkstra(graph, start, end) {
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
  }
  // 根据交叉点分割线段
  _splitIntersectionLines(intersections) {
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
  }
  // 计算每条线段与其他线段的交点
  _calculateIntersections(graph) {
    const intersections = {};
    for (let i = 0; i < graph.length; i++) {
      const line1 = graph[i];

      for (let j = 0; j < graph.length; j++) {
        if (i !== j) {
          const line2 = graph[j];

          for (let k = 0; k < line1.length - 1; k++) {
            const p1 = line1[k];
            const p2 = line1[k + 1];

            const lineKey = JSON.stringify({ start: p1, end: p2 });
            if (!intersections[lineKey]) {
              intersections[lineKey] = {
                line: { start: p1, end: p2 },
                points: [],
              };
            }

            for (let l = 0; l < line2.length - 1; l++) {
              const p3 = line2[l];
              const p4 = line2[l + 1];

              // 定义两条线的坐标,找到两条线的交叉点
              const intersection = turf.lineIntersect(
                turf.lineString([
                  [p1.x, p1.y],
                  [p2.x, p2.y],
                ]),
                turf.lineString([
                  [p3.x, p3.y],
                  [p4.x, p4.y],
                ]));


              if (intersection?.features?.length > 0) {
                for (const feature of intersection.features) {
                  const { geometry: { coordinates: [x, y] } } = feature;
                  intersections[lineKey].points.push({ x, y });
                }
              }
            }
          }
        }
      }
    }

    return Object.values(intersections);
  }
  // 找到最近的点
  _findNearestLocation(point, locations) {
    let nearestLocation = null;
    let minDistance = Infinity;
    for (const location of locations) {
      const distance = this._calculateDistance(point.y, point.x, location.y, location.x);
      if (distance < minDistance) {
        minDistance = distance;
        nearestLocation = location;
      }
    }
    return nearestLocation;
  }
  // 框出路线有效范围
  _getFarthestRectangle(coords, expand = 1000) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    // 有效范围扩大1km
    let expandBy = (expand / 1000) / 111;  // approximately 1 km in degrees

    for (let i = 0; i < coords.length; i++) {
      for (let j = 0; j < coords[i].length; j++) {
        let point = coords[i][j];
        minX = Math.min(minX, point.x);
        minY = Math.min(minY, point.y);
        maxX = Math.max(maxX, point.x);
        maxY = Math.max(maxY, point.y);
      }
    }

    return {
      topLeft: { x: minX - expandBy, y: maxY + expandBy },
      bottomRight: { x: maxX + expandBy, y: minY - expandBy }
    };
  }
  // 判断点是否在矩形内
  _isPointInRectangle(point, rectangle) {
    rectangle = Cesium.Rectangle.fromDegrees(
      rectangle.topLeft.x, rectangle.bottomRight.y,
      rectangle.bottomRight.x, rectangle.topLeft.y
    )

    let pointInRectangle = new Cesium.Cartographic.fromDegrees(point.x, point.y);
    return Cesium.Rectangle.contains(rectangle, pointInRectangle)
  }
  _calculateDistance(lat1, lon1, lat2, lon2) {
    // 将经纬度转换为弧度
    const radlat1 = Math.PI * lat1 / 180;
    const radlon1 = Math.PI * lon1 / 180;
    const radlat2 = Math.PI * lat2 / 180;
    const radlon2 = Math.PI * lon2 / 180;

    // Haversine 公式计算距离
    const dlat = radlat2 - radlat1;
    const dlon = radlon2 - radlon1;
    const a = Math.sin(dlat / 2) * Math.sin(dlat / 2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.sin(dlon / 2) * Math.sin(dlon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = 6371 * c; // 地球半径，单位：公里

    return distance;
  }
  // 将线段分割成两半
  _splitSegments(graph, numSplits) {
    const data = graph//{ ...graph };
    for (let i = 0; i < data.length; i++) {
      let newData = [];
      for (let j = 0; j < data[i].length - 1; j++) {
        let point1 = data[i][j];
        let point2 = data[i][j + 1];

        let dx = (point2.x - point1.x) / (numSplits + 1);
        let dy = (point2.y - point1.y) / (numSplits + 1);
        let dz = (point2.z - point1.z) / (numSplits + 1);

        newData.push(point1);

        for (let k = 1; k <= numSplits; k++) {
          newData.push({
            x: point1.x + dx * k,
            y: point1.y + dy * k,
            z: point1.z + dz * k
          });
        }
      }
      newData.push(data[i][data[i].length - 1]);
      data[i] = newData;
    }
    return data;
  }
  cartesian3ToWgs84Array(cartesians) {
    let newCoordinates = []
    cartesians.forEach(elements => {
      let coordinates = []
      elements.forEach(element => {
        const wgs84 = this.cartesian3ToWgs84(element)
        coordinates.push(wgs84)
      });
      newCoordinates.push(coordinates)
    });
    // for (const [start, end] of cartesians) {
    //   const startWgs84 = this.cartesian3ToWgs84(start)
    //   const endWgs84 = this.cartesian3ToWgs84(end)
    //   newCoordinates.push([startWgs84, endWgs84])
    // }
    return newCoordinates
  }
  cartesian3ToWgs84(cartesian) {
    const cartesianCoordinates = new Cesium.Cartesian3(cartesian.x, cartesian.y, cartesian.z);
    const wgs84Coordinates = Cesium.Cartographic.fromCartesian(cartesianCoordinates);
    const longitude = Cesium.Math.toDegrees(wgs84Coordinates.longitude);//到度 经度值
    const latitude = Cesium.Math.toDegrees(wgs84Coordinates.latitude);
    const height = wgs84Coordinates.height;
    return {
      x: longitude,
      y: latitude,
      z: height,
    }
  }
}