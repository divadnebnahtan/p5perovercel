let tilesX = 1920;
let tilesY = 1080;
let tileSize;
const adjacentRelative = [
  [-1, 0], [1, 0], [0, -1], [0, 1],
  // [-1, -1], [1, -1], [-1, 1], [1, 1]
];

let centreX, centreY;
let patternStep = 0;
let changedCells = [];
let pattern = [];
let path = [];
let patternSet = new Set();
let unfilledSet = new Set();
let mainGrid;
let startTime = 0;
let finished = false;

let autoRun = true;
let stepsPerFrame = tilesX * tilesY / (30 * 30); // total tiles / (30 FPS * 30 seconds expected duration)
const targetFrameTimeAutoRunOn = 1000 / 30; // ~33ms for 30 FPS
const targetFrameTimeAutoRunOff = 1000 / 30; // ~33ms for 30 FPS
const targetFrameTime = autoRun ? targetFrameTimeAutoRunOn : targetFrameTimeAutoRunOff;
const minSteps = 1;
const maxSteps = tilesX * tilesY;

function xyKey(x, y) {
  return `${x},${y}`;
}

function setup() {
  tileSize = ceil(min(windowWidth, windowHeight) / max(tilesX, tilesY));
  mainGrid = Array.from({ length: tilesX }, () => Array(tilesY).fill(null));
  centreX = floor(tilesX / 2);
  centreY = floor(tilesY / 2);

  createCanvas(tilesX * tileSize, tilesY * tileSize);
  colorMode(HSB, 360, 100, 100, 100);
  noStroke();
  background(0, 0, 0);

  for (let x = 0; x < tilesX; x++) {
    for (let y = 0; y < tilesY; y++) {
      unfilledSet.add(xyKey(x, y));
    }
  }

  pattern.push([centreX, centreY]);
  path.push([0, 0]);
  patternSet.add(xyKey(centreX, centreY));

  startTime = millis();

  if (autoRun) {
    loop();
  } else {
    noLoop();
    redraw();
  }
}

function draw() {
  if (finished) return;

  let frameStart = performance.now();

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

  // OPTION 1: Rectangles. You'd think this would be slower, but it performs well enough.
  for (const [x, y] of changedCells) {
    const c = mainGrid[x][y];
    if (c) {
      fill(c);
      rect(x * tileSize, y * tileSize, tileSize, tileSize);
    }
  }

  // OPTION 2: Pixels. Theoretically faster but needs further testing.
  // loadPixels();
  // for (const [x, y] of changedCells) {
  //   const c = mainGrid[x][y];
  //   if (c) {
  //     for (let dx = 0; dx < tileSize; dx++) {
  //       for (let dy = 0; dy < tileSize; dy++) {
  //         let px = x * tileSize + dx;
  //         let py = y * tileSize + dy;
  //         if (px < width && py < height) {
  //           let idx = 4 * (py * width + px);
  //           pixels[idx + 0] = red(c);
  //           pixels[idx + 1] = green(c);
  //           pixels[idx + 2] = blue(c);
  //           pixels[idx + 3] = 255;
  //         }
  //       }
  //     }
  //   }
  // }
  // updatePixels();
  changedCells = [];

  let frameEnd = performance.now();
  let frameTime = frameEnd - frameStart;

  if (!finished) {
    let newSteps = stepsPerFrame * (targetFrameTime / frameTime);
    stepsPerFrame = constrain(Math.round(newSteps), minSteps, maxSteps);
    // Uncomment for debugging:
    // console.log(`stepsPerFrame: ${stepsPerFrame}, frameTime: ${frameTime.toFixed(2)}ms`);
  }
}

function mousePressed() {
  if (!autoRun && !finished) {
    redraw();
  }
}

function dfsNext() {
    while (path.length > 0) {
        let [x, y] = path.pop();
        let adjacents = adjacentCoords(x, y).filter(([nx, ny]) => unfilledSet.has(xyKey(nx, ny)));
        if (adjacents.length > 0) {
            let newPos = selectRandom(adjacents);
            if (adjacents.length > 1) {
                path.push([x, y]);
            }
            path.push(newPos);
            return newPos;
        }
    }
}

function patternIncrement() {
  if (patternStep >= tilesX * tilesY || pattern.length === 0) return;

  let [x, y] = dfsNext();
  
  const randomIndex = 0;


  if (!unfilledSet.has(xyKey(x, y))) {
    removePatternAt(randomIndex);
    return;
  }

  const adjacents = adjacentCoords(x, y);
  const filledCount = numFilled(mainGrid, adjacents);

  let newColour = color(random(360), random(40, 70), random(40, 60));
  if (filledCount > 0) {
    const values = getValues(mainGrid, adjacents);
    const average = averageHSB(values);
    newColour = addNoise(average, 2, 2, 2);
  }

  setPixel(x, y, newColour, randomIndex);
  patternStep++;
}

function selectRandom(list) {
    return list[floor(random(list.length))]
}

function setPixel(x, y, color, patternIdx) {
  if (!unfilledSet.has(xyKey(x, y))) return;

  mainGrid[x][y] = color;
  changedCells.push([x, y]);
  unfilledSet.delete(xyKey(x, y));

  if (patternIdx !== undefined) {
    removePatternAt(patternIdx);
  } else {
    const idx = pattern.findIndex(([px, py]) => px === x && py === y);
    if (idx !== -1) removePatternAt(idx);
  }

  for (const [nx, ny] of adjacentCoords(x, y)) {
    const key = xyKey(nx, ny);
    if (unfilledSet.has(key) && !patternSet.has(key)) {
      pattern.push([nx, ny]);
      patternSet.add(key);
    }
  }
}

function removePatternAt(idx) {
  const [x, y] = pattern[idx];
  patternSet.delete(xyKey(x, y));
  const last = pattern.length - 1;
  if (idx !== last) pattern[idx] = pattern[last];
  pattern.pop();
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
  let h = hue(colour);
  let s = saturation(colour);
  let b = brightness(colour);

  if (hueNoise !== 0) h += random(-hueNoise, hueNoise);
  if (saturationNoise !== 0) s += random(-saturationNoise, saturationNoise);
  if (brightnessNoise !== 0) b += random(-brightnessNoise, brightnessNoise);

  h = ((h % 360) + 360) % 360;
  s = constrain(s, 1, 100);
  b = constrain(b, 1, 100);

  return color(h, s, b);
}

function averageHSB(colours) {
  if (colours.length === 0) return color(100, 50, 50);
  let sumSin = 0, sumCos = 0, sumS = 0, sumB = 0;
  for (const c of colours) {
    let angle = radians(hue(c));
    sumSin += Math.sin(angle);
    sumCos += Math.cos(angle);
    sumS += saturation(c);
    sumB += brightness(c);
  }
  let avgHue = degrees(Math.atan2(sumSin, sumCos));
  if (avgHue < 0) avgHue += 360;
  let avgS = sumS / colours.length;
  let avgB = sumB / colours.length;
  return color(avgHue, avgS, avgB);
}