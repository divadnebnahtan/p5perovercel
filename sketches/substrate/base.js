let dimX = 1920;
let dimY = 1080;


let initialCracks = 30;
let maxCracks = 250;
let crackGrid;
let cracks;


let maxPal = 50;
let palette;


function setup() {
  createCanvas(dimX, dimY);
  colorMode(HSB, 360, 100, 100);

  initColours();

  crackGrid = [];
  cracks = [];

  begin();
}

function draw() {
  let speed = mouseIsPressed ? 20 : 1;
  for (let i = 0; i < speed; i++) {
    for (let n = 0; n < cracks.length; n++) {
      cracks[n].move();
      // print(`Moving crack ${n}`);
    }
  }

  // for (let i = 0; i < palette.length; i++) {
  //   fill(palette[i]);
  //   noStroke();
  //   rect(i * width / palette.length, 0, width / palette.length, height);
  // }

  // noLoop();
}

function begin() {
  background(0, 0, 95);

  for (let y = 0; y < dimY; y++) {
    for (let x = 0; x < dimX; x++) {
      crackGrid[y * dimX + x] = 10001;
    }
  }

  for (let k = 0; k < initialCracks; k++) {
    let i = floor(random(dimX * dimY));
    crackGrid[i] = random(360);
  }

  for (let k = 0; k < initialCracks; k++) {
    makeCrack();
  }

}

// function mouseClicked() {
//   begin();
// }

function makeCrack() {
  if (cracks.length < maxCracks) {
    cracks[cracks.length] = new Crack();
    // cracks.length++;
    // print(`CRACKS: ${cracks.length}`);
  }
}

function initColours() {
  palette = [];
  for (let i = 0; i < maxPal; i++) {
    palette[i] = color(random(360), 100, 50);
  }
}

function someColour() {
  return palette[floor(random(palette.length))];
}

class Crack {
  constructor() {
    this.x;
    this.y;
    this.t;
    // this.flag = {};
    this.c = someColour();
    this.findStart();
  }

  findStart() {
    let px = 0;
    let py = 0;

    let found = false;
    let timeout = 0;

    while ((!found) || (timeout++ > 1000)) {
      px = floor(random(dimX));
      py = floor(random(dimY));
      if (crackGrid[py * dimX + px] < 10000) {
        found = true;
      }
    }

    if (found) {
      let a = crackGrid[py * dimX + px];
      if (random() > 0.5) {
        a -= 90 + random(-2, 2.1);
      } else {
        a += 90 + random(-2, 2.1);
      }
      // a = random(360);

      this.startCrack(px, py, a);
      // print(`START FOUND`);
    } else {
      print(`Timeout: ${timeout}`);
    }

  }

  startCrack(X, Y, T) {
    // print(`T: ${T}`);
    this.x = X;
    this.y = Y;
    this.t = T % 360; // % 360;

    this.x += 0.61 * cos(this.t * PI / 180);
    this.y += 0.61 * sin(this.t * PI / 180);

    // this.flag = random() > 0.5 ? -1 : 1;
  }

  move() {
    // if (random() > 0.1) {
      // this.t += this.flag * 0.5;
    // this.t += random() > 0.5 ?45 : -45;
    // }
    // if (random() > 0.999) {
      // this.flag *= -1;
    // }
    // continue cracking
    this.x += 0.42 * cos(this.t * PI / 180);
    this.y += 0.42 * sin(this.t * PI / 180);

    // bound check
    let z = 0.33;
    let cx = floor(this.x + random(-z, z));
    let cy = floor(this.y + random(-z, z));

    // draw sand painter
    // this.regionColour();

    // draw black crack
    stroke(this.c);
    // strokeWeight(85);
    point(this.x + random(-z, z), this.y + random(-z, z));
    // print(`MOVING ${this.x}, ${this.y}`);

    if ((cx >= 0) && (cx < dimX) && (cy >= 0) && cy < dimY) {
      // safe to check
      if ((crackGrid[cy * dimX + cx] > 10000) || (abs(crackGrid[cy * dimX + cx] - this.t) < 5)) {
        // continue cracking
        crackGrid[cy * dimX + cx] = this.t;
      } else if (abs(crackGrid[cy * dimX + cx] - this.t) > 2) {
        // crack encountered (not self), stop cracking
        this.findStart();
        makeCrack();

      }
    } else {
      // out of bounds, stop cracking
      this.findStart();
      makeCrack();
    }

  }
}