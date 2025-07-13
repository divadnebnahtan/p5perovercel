let tilesX = 1920;
let tilesY = 1080;
let tileSize = 1;

const adjacentRelative = [
  [-1, 0], [1, 0], [0, -1], [0, 1], // Cardinal directions
  [-1, -1], [1, -1], [-1, 1], [1, 1] // Diagonals
];

let centreX, centreY;
let patternStep = 0;
let patternRing = 1, patternEpoch = 0;
let changedCells = [];
let pattern = [];
let patternSet = new Set();
let unfilledSet = new Set();
let mainGrid;
let startTime = 0;
let finished = false;

function xyKey(x, y) {
  return `${x},${y}`;
}

function setup() {
  // saveGif("randoms.gif", 16);
  mainGrid = Array.from({ length: tilesX }, () => Array(tilesY).fill(null));
  centreX = floor(tilesX / 2);
  centreY = floor(tilesY / 2);

  createCanvas(tilesX * tileSize, tilesY * tileSize);
  colorMode(HSB, 360, 100, 100, 100);
  noStroke();

  background(0, 0, 0);

  // Fill unfilledSet with all possible coordinates
  for (let x = 0; x < tilesX; x++) {
    for (let y = 0; y < tilesY; y++) {
      unfilledSet.add(xyKey(x, y));
    }
  }

  pattern.push([centreX, centreY]);
  patternSet.add(xyKey(centreX, centreY));

  startTime = millis();
  loop();
}

function draw() {
  if (finished) return;

  // Fill as many as possible per frame for speed
  let stepsPerFrame = 1080;
  for (let i = 0; i < stepsPerFrame; i++) {
    if (patternStep >= tilesX * tilesY || pattern.length === 0) {
      finished = true;
      noLoop();
      let elapsed = millis() - startTime;
      console.log(`Completed in ${elapsed / 1000} seconds.`);
      break;
    }
    patternIncrement();
  }

  for (const [x, y] of changedCells) {
    const c = mainGrid[x][y];
    if (c) {
      fill(c);
      rect(x * tileSize, y * tileSize, tileSize, tileSize);
    }
  }
  changedCells = [];
}

// mouseClicked no longer needed

function patternIncrement() {
  if (patternStep >= tilesX * tilesY || pattern.length === 0) {
    return;
  }

  const randomIndex = floor(random(pattern.length));
  const [x, y] = pattern[randomIndex];

  if (!unfilledSet.has(xyKey(x, y))) {
    // Already filled, remove from pattern efficiently
    removePatternAt(randomIndex);
    return;
  }

  const adjacents = adjacentCoords(x, y);
  const filledCount = numFilled(mainGrid, adjacents);

  let newColour = color(random(360), random(30, 90), random(40, 90));
  if (filledCount > 0) {
    const values = getValues(mainGrid, adjacents);
    const average = averageHSB(values);
    newColour = addNoise(
      average,
      5,
      2,
      2
    );
  }

  setPixel(x, y, newColour, randomIndex);
  patternStep++;
}

function setPixel(x, y, color, patternIdx) {
  if (!unfilledSet.has(xyKey(x, y))) return;

  mainGrid[x][y] = color;
  changedCells.push([x, y]);
  unfilledSet.delete(xyKey(x, y));

  // Remove from pattern efficiently
  if (patternIdx !== undefined) {
    removePatternAt(patternIdx);
  } else {
    const idx = pattern.findIndex(([px, py]) => px === x && py === y);
    if (idx !== -1) removePatternAt(idx);
  }

  // Add unfilled adjacents to pattern
  for (const [nx, ny] of adjacentCoords(x, y)) {
    const key = xyKey(nx, ny);
    if (unfilledSet.has(key) && !patternSet.has(key)) {
      pattern.push([nx, ny]);
      patternSet.add(key);
    }
  }
}

// O(1) removal from pattern array and patternSet
function removePatternAt(idx) {
  const [x, y] = pattern[idx];
  const key = xyKey(x, y);
  patternSet.delete(key);
  const last = pattern.length - 1;
  if (idx !== last) {
    pattern[idx] = pattern[last];
  }
  pattern.pop();
}

function fillAll(grid, cellList, color) {
  for (const [x, y] of cellList) {
    grid[x][y] = color;
  }
}

function numFilled(grid, cellList) {
  return cellList.reduce((count, [x, y]) => count + (grid[x][y] ? 1 : 0), 0);
}

function getValues(grid, cellList) {
  return cellList
    .filter(([x, y]) => grid[x][y])
    .map(([x, y]) => grid[x][y]);
}

function adjacentCoords(x, y) {
  return adjacentRelative
    .map(([dx, dy]) => [x + dx, y + dy])
    .filter(([nx, ny]) => nx >= 0 && nx < tilesX && ny >= 0 && ny < tilesY);
}

function addNoise(colour, hueNoise, saturationNoise, brightnessNoise) {
  let h = hue(colour) + random(-hueNoise, hueNoise);
  let s = saturation(colour) + random(-saturationNoise, saturationNoise);
  let b = brightness(colour) + random(-brightnessNoise, brightnessNoise);

  h = (h + 360) % 360;
  s = constrain(s, 0, 100);
  b = constrain(b, 0, 100);

  return color(h, s, b);
}

function randomHSB() {
  return color(random(360), 100, 100);
}

function averageHSB(colours) {
  let sumX = 0, sumY = 0, totalS = 0, totalB = 0;

  for (const c of colours) {
    const h = hue(c) * (Math.PI / 180);
    sumX += Math.cos(h);
    sumY += Math.sin(h);
    totalS += saturation(c);
    totalB += brightness(c);
  }

  let avgHue = Math.atan2(sumY, sumX) * (180 / Math.PI);
  if (avgHue < 0) avgHue += 360;

  return color(
    avgHue,
    totalS / colours.length,
    totalB / colours.length
  );
}

// Generator for expanding pattern (not used in main logic)
function* expandingPattern(x, y, maxDist) {
  yield [x, y];
  for (let d = 1; d <= maxDist; d++) {
    const ring = [];

    // Plus arms
    ring.push([x - d, y], [x + d, y], [x, y - d], [x, y + d]);

    // Edges between plus arms and corners
    for (let offset = 1; offset < d; offset++) {
      ring.push([x - offset, y - d], [x + offset, y - d]);
      ring.push([x - offset, y + d], [x + offset, y + d]);
      ring.push([x - d, y - offset], [x - d, y + offset]);
      ring.push([x + d, y - offset], [x + d, y + offset]);
    }

    // Corners
    ring.push([x - d, y - d], [x + d, y - d], [x - d, y + d], [x + d, y + d]);

    for (const pos of ring) yield pos;
  }
}