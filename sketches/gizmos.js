let tilesX = 50;
let tilesY = tilesX;
let tileSize = 8;
let adjacentRelative = [
  [0, 0, 0], // Center
  [-1, 0, -1], // Left
  [1, 0, 1], // Right
  [0, -1, 0], // Up
  [0, 1, 0], // Down
  [-1, -1, -0.1], // Top-left
  [1, -1, 0.1], // Top-right
  [-1, 1, -0.1], // Bottom-left
  [1, 1, 0.1] // Bottom-right
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
  // noLoop();
  noStroke();

  background(0, 0, 0);
  setPixel(centreX, centreY, color(random(360), random(30, 60), random(40, 90)));

}

function draw() {
  // for (let i = 0; i < maxDist; i++) {
    runClick();
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


  // draw border around the canvas
  // if (patternEpoch > 0) {
  //   stroke(0, 0, 0);
  // } else {
  //   stroke(0, 0, 100);
  // }
  // strokeWeight(5);
  // noFill();
  // rect(0, 0, tilesX * tileSize, tilesY * tileSize);
  // noStroke();
}

// function mouseClicked() {
//   // for (let i = 0; i < 1; i++) {
//   runClick();
//   // }
//   redraw();
// }

function runClick() {
  if (!isLooping()) {
    return;
  }

  if (patternStep >= pattern.length) {
    patternStep = 1;
    patternRing = 1;
    patternEpoch++;
    // setPixel(centreX, centreY, color(random(360), random(30, 90), random(40, 90)));
    
    noLoop();
    return;
  }
  patternIncrementRing();
}

function patternIncrementRing() {


  let steps = patternRing * 8;
  if (steps + patternStep >= pattern.length) {
    steps = pattern.length - patternStep;
  }
  let step = 0;
  for (; step < steps; step++) {
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


  let newColour = color(random(360), random(30, 90), random(40, 90));
  if (filledCount > 0) {
    let [values, weights] = getValues(mainGrid, adjacents);
    let average = averageHSB(values, weights);
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
  let weights = [];

  for (let cell of cellList) {
    let x = cell[0];
    let y = cell[1];
    let w = cell[2]; // Assuming weight is at index 2
    if (grid[x] && grid[x][y]) {
      values.push(grid[x][y]);
      weights.push(w);
    }
  }

  return [values, weights]; // Return as a tuple
}


function adjacentCoords(x, y) {
  let neighbors = [];
  for (let i = 0; i < adjacentRelative.length; i++) {
    let nx = x + adjacentRelative[i][0];
    let ny = y + adjacentRelative[i][1];
    let nw = adjacentRelative[i][2];

    if (nx >= 0 && nx < tilesX && ny >= 0 && ny < tilesY && nw !== 0) {
      neighbors.push([nx, ny, nw]);
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

  h = h % 360;
  s = constrain(s, 0, 100);
  b = constrain(b, 0, 100);

  return color(h, s, b);
}

function averageHSB(colours, weights) {
  let sumX = 0;
  let sumY = 0;
  let totalS = 0;
  let totalB = 0;
  let totalWeight = 0;

  for (let i = 0; i < colours.length; i++) {
    let c = colours[i];
    let w = weights[i];

    let h = hue(c) * (Math.PI / 180); // convert to radians
    let s = saturation(c);
    let b = brightness(c);

    sumX += Math.cos(h) * w;
    sumY += Math.sin(h) * w;
    totalS += s * w;
    totalB += b * w;
    totalWeight += w;
  }

  let avgHue = Math.atan2(sumY, sumX) * (180 / Math.PI); // back to degrees
  if (avgHue < 0) avgHue += 360;

  let avgS = totalS / totalWeight;
  let avgB = totalB / totalWeight;

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