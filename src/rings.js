let tilesX = 1000;
let tilesY = tilesX;
let tileSize = 1000 / tilesX;
let adjacentRelative = [
  [-1, 0], // Left
  [1, 0], // Right
  [0, -1], // Up
  [0, 1], // Down
  [-1, -1], // Top-left
  [1, -1], // Top-right
  [-1, 1], // Bottom-left
  [1, 1] // Bottom-right
];

let centreX, centreY;
let selectedX = -1, selectedY = -1;
let patternStep = 1, patternRing = 1, patternEpoch = 0, changedCells = [];
let maxDist;
let pattern;
let mainGrid;

function setup() {
  mainGrid = [];

  for (let i = 0; i < tilesX; i++) {
    mainGrid[i] = [];
    for (let j = 0; j < tilesY; j++) {
      mainGrid[i][j] = null;
    }
  }

  centreX = floor(tilesX / 2);
  centreY = floor(tilesY / 2);
  selectedX = -1;
  selectedY = -1;
  maxDist = max(centreX, centreY, tilesX - centreX - 1, tilesY - centreY - 1);

  pattern = [];

  for (let [i, j] of expandingPattern(centreX, centreY, maxDist)) {
    if (i < 0 || i >= tilesX || j < 0 || j >= tilesY) {
      continue;
    }
    pattern.push([i, j]);
  }

  createCanvas(tilesX * tileSize, tilesX * tileSize);
  colorMode(HSB, 360.0, 100.0, 100.0, 100.0);
  noLoop();
  noStroke();

  background(0, 0, 0);
  setPixel(centreX, centreY, color(random(360), random(30, 60), random(40, 90)));
}

function draw() {
  // background(220);

  // if (mouseIsPressed) {
  //   patternIncrement();
  // }


  // for (let i = 0; i < tilesX; i++) {
  //   for (let j = 0; j < tilesY; j++) {
  //     let c = mainGrid[i][j];
  //     // print(`(${i}, ${j}): ${c}`);
  //     if (c) {
  //       fill(c);
  //     } else {
  //       fill(0, 0, 0);
  //     }
  //     rect(i * tileSize, j * tileSize, tileSize, tileSize);
  //   }
  // }

  for (let cell of changedCells) {
    let x = cell[0];
    let y = cell[1];
    let c = mainGrid[x][y];
    if (c) {
      fill(c);
      rect(x * tileSize, y * tileSize, tileSize, tileSize);
    }
  }

  changedCells = [];

}

function mouseClicked() {
  for (let i = 0; i < 10; i++) {
    if (patternStep >= pattern.length) {
      patternStep = 1;
      patternRing = 1;
      patternEpoch++;
      // for (let i = 0; i < tilesX; i++) {
      //   for (let j = 0; j < tilesY; j++) {
      //     setPixel(i, j, null);
      //   }
      // }
      setPixel(centreX, centreY, color(random(360), random(30, 90), random(40, 90)));
      // redraw();
      // return;
    }
    patternIncrementRing();
  }
  redraw();
}

function patternIncrementRing() {


  let steps = patternRing * 8;
  if (steps + patternStep >= pattern.length) {
    steps = pattern.length - patternStep;
  }
  let step = 0;
  for (; step < steps; step++) {
    // print(`Pattern step ${patternStep} (${step}) of ${pattern.length}`);
    patternIncrement();
  }

  patternRing++;
}

function patternIncrement() {
  if (patternStep >= pattern.length) {
    print("Pattern complete, resetting.");
    return;
  }

  let [x, y] = pattern[patternStep];
  let adjacents = adjacentCoords(x, y);
  let filledCount = numFilled(mainGrid, adjacents);


  let newColour = randomHSB();
  if (filledCount > 0) {
    let values = getValues(mainGrid, adjacents);
    let average = averageHSB(values);
    newColour = addNoise(
      average,
      15 / (patternEpoch + 1),
      5 / (patternEpoch + 1),
      5 / (patternEpoch + 1),
    );
  }

  setPixel(x, y, newColour);

  patternStep++;
}

function setPixel(x, y, color) {
  if (x < 0 || x >= tilesX || y < 0 || y >= tilesY) {
    return;
  }
  mainGrid[x][y] = color;
  changedCells.push([x, y]);
}

function fillAll(grid, cellList, color) {
  for (let cell of cellList) {
    let x = cell[0];
    let y = cell[1];
    grid[x][y] = color;
  }
}

function numFilled(grid, cellList) {
  let filled = 0;
  for (let cell of cellList) {
    let x = cell[0];
    let y = cell[1];
    if (grid[x][y]) {
      filled++;
    }
  }
  return filled;
}

function getValues(grid, cellList) {
  let values = [];
  for (let cell of cellList) {
    let x = cell[0];
    let y = cell[1];
    if (grid[x][y]) {
      values.push(grid[x][y]);
    }
  }
  return values;
}

function adjacentCoords(x, y) {
  let neighbors = [];
  for (let i = 0; i < adjacentRelative.length; i++) {
    let nx = x + adjacentRelative[i][0];
    let ny = y + adjacentRelative[i][1];

    if (nx >= 0 && nx < tilesX && ny >= 0 && ny < tilesY) {
      neighbors.push([nx, ny]);
    }
  }
  return neighbors;
}

function addNoise(colour, hueNoise, saturationNoise, brightnessNoise) {
  let h = hue(colour);
  let s = saturation(colour);
  let b = brightness(colour);

  h += random(-hueNoise, hueNoise);
  s += random(-saturationNoise, saturationNoise);
  b += random(-brightnessNoise, brightnessNoise);

  h = h % 360; // wrap around hue
  s = constrain(s, 0, 100);
  b = constrain(b, 0, 100);

  return color(h, s, b);
}

function randomHSB() {
  let h = random(360);
  let s = 100; // random(100);
  let b = 100; // random(100);
  return color(h, s, b);
}

function averageHSB(colours) {
  let sumX = 0;
  let sumY = 0;
  let totalS = 0;
  let totalB = 0;

  for (let c of colours) {
    let h = hue(c) * (Math.PI / 180); // convert to radians
    let s = saturation(c);
    let b = brightness(c);

    sumX += Math.cos(h);
    sumY += Math.sin(h);
    totalS += s;
    totalB += b;
  }

  let avgHue = Math.atan2(sumY, sumX) * (180 / Math.PI); // back to degrees
  if (avgHue < 0) avgHue += 360;

  let avgS = totalS / colours.length;
  let avgB = totalB / colours.length;

  return color(avgHue, avgS, avgB);
}

function* expandingPattern(x, y, maxDist) {
  yield [x, y]; // center cell

  for (let d = 1; d <= maxDist; d++) {
    const ring = [];

    // 1. Plus arms
    ring.push([x - d, y]); // Left
    ring.push([x + d, y]); // Right
    ring.push([x, y - d]); // Up
    ring.push([x, y + d]); // Down

    // 2. Edges between plus arms and corners
    for (let offset = 1; offset < d; offset++) {
      // Horizontal edges
      ring.push([x - offset, y - d]); // Top edge, left side
      ring.push([x + offset, y - d]); // Top edge, right side
      ring.push([x - offset, y + d]); // Bottom edge, left side
      ring.push([x + offset, y + d]); // Bottom edge, right side

      // Vertical edges
      ring.push([x - d, y - offset]); // Left edge, top side
      ring.push([x - d, y + offset]); // Left edge, bottom side
      ring.push([x + d, y - offset]); // Right edge, top side
      ring.push([x + d, y + offset]); // Right edge, bottom side
    }

    // 3. Corners (true diagonals)
    ring.push([x - d, y - d]); // top-left
    ring.push([x + d, y - d]); // top-right
    ring.push([x - d, y + d]); // bottom-left
    ring.push([x + d, y + d]); // bottom-right

    // Yield this ring in order
    for (const pos of ring) yield pos;
  }
}