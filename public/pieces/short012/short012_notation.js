//#ef NOTES
/*
Pie start time
pie colors
keep pie outline


Add 'A' or 'D' above accelerating or decelerating cursors
Work on ictus

which frame does a beat start on?


Write new timeline function, that calculates the number of pixels traveled for each frame
D = (initialVelocity * time) + ((acceleration * timeSquared )/2 )

Redo Calculate timelines and build frame Array; accel by alterating tempo
New tempi
New Loops
Accelerating Tempo/Loop Cursor
For accel increase pxPerFrame for each frame in tempoConsts.pxPerFrame have a accel factor
in func calcTimeline increase here:       let tCurPx = Math.round(frmIx * tempoObj.pxPerFrame);

*/
//#endef NOTES

//#ef General Variables
const TEMPO_COLORS = [clr_limeGreen, clr_mustard, clr_brightBlue, clr_brightOrange, clr_lavander, clr_darkRed2, clr_brightGreen, clr_lightGrey, clr_neonMagenta, clr_plum, clr_blueGrey];
//Timing
const FRAMERATE = 60;
const PX_PER_SEC = 50;
const PX_PER_FRAME = PX_PER_SEC / FRAMERATE;
const MS_PER_FRAME = 1000.0 / FRAMERATE;
let FRAMECOUNT = 0;
const LEADIN_SEC = 5;
const LEADIN_PX = LEADIN_SEC * PX_PER_SEC;
const LEADIN_FRAMES = Math.round(LEADIN_SEC * FRAMERATE);
//Canvas Variables
let WORLD_W; // Calculated later in notation variables; 9 beats of notation @ 105 pixels per beat
let WORLD_H; //calculated later with notation variables
let canvas = {}; // canvas.panel(jspanel); canvas.div(jspanel div); canvas.svg(svg container on top of canvas.div)
const CSRGO = 250;
let panelTitle = "Short012"
let cursor;
let barsTiming = [
  [3, 0.5],
  [0.5, 0.5],
  [0.5, 0],
  [2, 1],
  [4, 1.5],
  [0.5, 0.5],
  [1.5, 0.75],
  [3, 0],
  [1, 0.5],
  [4, 1],
  [2, 0.5],
  [0.5, 0],
  [0.5, 0],
  [1, 0],
  [2, 0.5],
  [1, 2],
  [4, 0]
];
let barsTimingFrames = [];
let totalNumFrames = 0;
barsTiming.forEach((times, barIx) => {
  let ta = [];
  let barDur = times[0];
  let restDur = times[1];
  let tbarfrm = Math.round(barDur * FRAMERATE);
  ta.push(tbarfrm);
  totalNumFrames = totalNumFrames + tbarfrm;
  let trestfrm = Math.round(restDur * FRAMERATE);
  ta.push(trestfrm);
  totalNumFrames = totalNumFrames + trestfrm;
  barsTimingFrames.push(ta);
});
let barsPx = [];
barsTiming.forEach((times, barIx) => {
  let ta = [];
  let barDur = times[0];
  let restDur = times[1];
  let tbarpx = barDur * PX_PER_SEC;
  ta.push(tbarpx);
  let trestpx = restDur * PX_PER_SEC;
  ta.push(trestpx);
  barsPx.push(ta);
});
let bars = [];
WORLD_W = 945;
WORLD_H = 150;
let pie;
let pieOutline;
let pieTimingPerFrame = [];
const PIERAD = 30;
const PIEX = 250;
const PIEY = 30;
//Timesync
const TS = timesync.create({
  server: '/timesync',
  interval: 1000
});
//#endef General Variables

//#ef Animation Engine
//Animation Engine Variables
let cumulativeChangeBtwnFrames_MS = 0;
let epochTimeOfLastFrame_MS;

function animationEngine(timestamp) { //timestamp not used; timeSync server library used instead
  let ts_Date = new Date(TS.now()); //Date stamp object from TimeSync library
  let tsNowEpochTime_MS = ts_Date.getTime();
  cumulativeChangeBtwnFrames_MS += tsNowEpochTime_MS - epochTimeOfLastFrame_MS;
  epochTimeOfLastFrame_MS = tsNowEpochTime_MS; //update epochTimeOfLastFrame_MS for next frame
  while (cumulativeChangeBtwnFrames_MS >= MS_PER_FRAME) { //if too little change of clock time will wait until 1 animation frame's worth of MS before updating etc.; if too much change will update several times until caught up with clock time
    if (cumulativeChangeBtwnFrames_MS > (MS_PER_FRAME * FRAMERATE)) cumulativeChangeBtwnFrames_MS = MS_PER_FRAME; //escape hatch if more than 1 second of frames has passed then just skip to next update according to clock
    update();
    FRAMECOUNT++;
    cumulativeChangeBtwnFrames_MS -= MS_PER_FRAME; //subtract from cumulativeChangeBtwnFrames_MS 1 frame worth of MS until while cond is satisified
  }
  requestAnimationFrame(animationEngine);
}
// Update Functions
function update() {
  moveBars();
  movePie();
}
//#endef Animation Engine END

//#ef INIT
function init() { //runs from html file: ill20231212.html <body onload='init();'></body>
  makeCanvas();
  drawBars();
  makePie();
  calcPieTimes();
  console.log(pieTimingPerFrame);
  //Initialize clock and start animation engine
  let ts_Date = new Date(TS.now()); //Date stamp object from TimeSync library
  let tsNowEpochTime_MS = ts_Date.getTime(); //current time at init in Epoch Time MS
  epochTimeOfLastFrame_MS = tsNowEpochTime_MS;
  requestAnimationFrame(animationEngine); //kick off animation
}
//#endef INIT

//#ef Make Canvas
function makeCanvas() {
  //Make Panel with jsPanel
  let tPanel = mkPanel({
    w: WORLD_W,
    h: WORLD_H,
    title: panelTitle,
    onwindowresize: true,
    clr: 'none',
    ipos: 'center-top',
  });
  // Enable Click/Tap to go to full screen mode
  tPanel.content.addEventListener('click', function() {
    document.documentElement.webkitRequestFullScreen({
      navigationUI: 'hide'
    });
  });
  //tPanel.content is the jspanel's div container
  //Change Background Color of Panel: tPanel.content.style.backgroundColor = clr_plum;
  canvas['panel'] = tPanel;
  canvas['div'] = tPanel.content;
  // SVG Container on top of jsPanel's div
  let tSvg = mkSVGcontainer({
    canvas: tPanel.content,
    w: WORLD_W,
    h: WORLD_H,
    x: 0,
    y: 0,
  });
  //Change Background Color of svg container tSvg.style.backgroundColor = clr_mustard
  canvas['svg'] = tSvg;
  tSvg.style.backgroundColor = 'black';
  //Draw static cursor
  cursor = mkSvgLine({
    svgContainer: canvas.svg,
    x1: CSRGO,
    y1: 0,
    x2: CSRGO,
    y2: WORLD_H,
    stroke: clr_limeGreen,
    strokeW: 3
  });
  cursor.setAttributeNS(null, 'stroke-linecap', 'round');
  cursor.setAttributeNS(null, 'display', 'yes');
}
//#endef Make Canvas

//#ef Bars
function drawBars() {
  let tCurPx = 0;
  let clrNum = 0;
  barsPx.forEach((pxAr, barIx) => {
    let barLen = pxAr[0];
    let gapLen = pxAr[1];
    let tBar = mkSvgRect({
      svgContainer: canvas.svg,
      x: tCurPx + CSRGO,
      y: 70,
      w: barLen,
      h: 50,
      fill: TEMPO_COLORS[clrNum],
      stroke: 'black',
      strokeW: 0,
      roundR: 0
    });
    tBar.setAttributeNS(null, 'display', 'yes');
    bars.push(tBar);
    tCurPx = tCurPx + barLen + gapLen;
    clrNum = (clrNum + 1) % TEMPO_COLORS.length;
  });
}

function moveBars() {
  let tx = (FRAMECOUNT * -PX_PER_FRAME) + LEADIN_PX;
  bars.forEach((tBar) => {
    tBar.setAttributeNS(null, 'transform', "translate(" + tx.toString() + ",0)");
  });
}
//#endef Bars

//#ef Pie
function calcPieTimes() {
  barsTimingFrames.forEach((barAr, bix) => {
    let tBarFrms = barAr[0];
    let tRestFrms = barAr[1];
    let degPerFrame = 360 / tBarFrms;
    for (var i = 0; i < tBarFrms; i++) {
      let td = {};
      td['clr'] = TEMPO_COLORS[bix%TEMPO_COLORS.length];
      td['deg'] = degPerFrame * i;
      pieTimingPerFrame.push(td);
    }
    for (var i = 0; i < tRestFrms; i++) {
      let td = {};
      td['clr'] = TEMPO_COLORS[bix%TEMPO_COLORS.length];
      td['deg'] = 0;
      pieTimingPerFrame.push(td);
    }
  });
}

function makePie() {
  pie = mkSvgArc({
    svgContainer: canvas.svg,
    x: PIEX,
    y: PIEY,
    radius: PIERAD,
    startAngle: 0,
    endAngle: 359,
    fill: TEMPO_COLORS[0],
    stroke: 'none',
    strokeW: 0,
    strokeCap: 'round' //square;round;butt
  });
  pie.setAttributeNS(null, 'display', 'yes');
    pieOutline = mkSvgArc({
      svgContainer: canvas.svg,
      x: PIEX,
      y: PIEY,
      radius: PIERAD,
      startAngle: 0,
      endAngle: 359,
      fill: 'none',
      stroke: clr_neonMagenta,
      strokeW: 2,
      strokeCap: 'round' //square;round;butt
    });
    pieOutline.setAttributeNS(null, 'display', 'yes');
}

function movePie() {
  let pieClock = FRAMECOUNT - LEADIN_FRAMES;
  if (pieClock >= 0) {
    let endAngle = pieTimingPerFrame[pieClock].deg;
    let tClr = pieTimingPerFrame[pieClock].clr
    let startAngle = 0;
    let start = polarToCartesian(PIEX, PIEY, PIERAD, endAngle);
    let end = polarToCartesian(PIEX, PIEY, PIERAD, startAngle);
    let arcSweep = endAngle - startAngle <= 180 ? "0" : "1";
    let d = [
      "M", start.x, start.y,
      "A", PIERAD, PIERAD, 0, arcSweep, 0, end.x, end.y,
      "L", PIEX, PIEY,
      "L", start.x, start.y
    ].join(" ");
    pie.setAttributeNS(null, "d", d); //describeArc makes 12'0clock =0degrees
    pie.setAttributeNS(null, "fill", tClr);
  }
}
//#endef Pie



//
