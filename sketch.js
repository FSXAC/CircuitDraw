// FSXAC/CircuitDraw: Javascript interactive to draw circuit diagrams
// Copyright (C) 2017 Muchen He

// FSXAC/CircuitDraw is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// FSXAC/CircuitDraw is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

// ====================[ CircuitDraw 0.2 ]====================
// TODO: Add part editing
// Moving parts around
// Changing values

// TODO: Add keyboard inputs during drawing

// TODO: Add ICs

// TODO: Add interactive components
// Switches, potentiometers

// TODO: Add interaction mode

// TODO: Add circuit analysis
// Voltmeter, ohm meter

// TODO: Optimize [DRAW GRID] (currently using 80-90% of the total processing)

const WEB_TOP_MARGIN = 40;
const GRID_SIZE      = 20;
const BORDER_SIZE    = 0;
const SELECT_RANGE   = 25;
const MODES = {
    Drawing: 0,
    Editing: 1,
    Viewing: 2
}
const COMPONENTS = {
    Wire: 0,
    Resistor: 1,
    Capacitor: 2,
    Inductor: 3,
    Diode: 4,
    VSource: 5,
    ISource: 6,
    VRef: 7,
    Ground: 8
}
const COMPONENT_NAMES = [
    "Wire", "Resistor", "Capacitor", "Inductor", "Diode",
    "Voltage Source", "Current Source", "Voltage Reference",
    "Ground Reference"
]

var g_colorDefault;     // [color]  standard colors
var g_colorHighlight;   

var g_drawGrid;         // [bool]   draw grid or not
var g_background;       // [p5]     background graphic

var g_components = [];  // [Part]   list of all components onscreen

var g_mouseX;           // [real]   snapped mouse coordinates
var g_mouseY;

var g_currentMode;      // [enum]   current mode in MODES
var g_drawingComp;      // [enum]   current component in COMPONENTS
var g_currentComponent; // [Part]   component of the part in editing


// ====================[ APPARENTLY JS HAS CLASSES NOW ]====================
class Part {
    constructor() {
        this.highlight = false;
    }

    setHighlight(highlight) {
        this.highlight = highlight;
    }
}

// ====================[ SINGLE PORT CLASSES ]====================
class SinglePort extends Part{
    constructor(x, y) {
        super();
        this.x1 = x;
        this.y1 = y;
        this.x2 = 0;
        this.y2 = 0;
        this.built = false;
        this.size = 10;
    }

    draw() {
        stroke(this.highlight ? g_colorHighlight : g_colorDefault);
        if (this.built) {
            this.drawComponent(this.x1, this.y1, this.x2, this.y2);
            strokeWeight(3);
            point(this.x1, this.y1);
            point(this.x2, this.y2);
        } else {
            this.drawComponent(this.x1, this.y1, g_mouseX, g_mouseY);
            strokeWeight(3);
            point(this.x1, this.y1);
            point(g_mouseX, g_mouseY);
        }
        strokeWeight(1);
    }

    drawComponent(x1, y1, x2, y2) {
        line(x1, y1, x2, y2);
    }

    setEnd(x, y) {
        this.x2 = x;
        this.y2 = y;
        this.built = true;
    }

    getNearestDistance(range) {
        var v1 = createVector(this.x1, this.y1);
        var v2 = createVector(this.x2, this.y2);
        var mousePos = createVector(mouseX, mouseY);
        var point = createVector(0, 0);
        var d = getDistSqPoint2Seg(v1, v2, mousePos, point)
        if (d > range) return undefined;
        else return d;
    }
};
class Wire extends SinglePort {
    drawComponent(x1, y1, x2, y2) {
        line(x1, y1, x2, y2);
        stroke(0);
    }
};
class Resistor extends SinglePort {
    constructor(x, y) {
        super(x, y);
        this.resistance = 100;
    }

    setResistance(r) {
        this.resistance = r;
    }

    drawComponent(x1, y1, x2, y2) {
        var v = createVector(x2 - x1, y2 - y1);
        var vn = v.copy().normalize(v);
        var m1 = v.mag() / 2 - GRID_SIZE;
        var m2 = v.mag() / 2 + GRID_SIZE;
        var step = (m2 - m1) / 6;

        line(x1, y1, x1 + vn.x * m1, y1 + vn.y * m1);
        line(x2, y2, x2 - vn.x * m1, y2 - vn.y * m1);

        push();
        translate(x1, y1);
        rotate(v.heading());

        push();
        translate(m1, 0);

        beginShape(LINES);
        vertex(0, 0);
        vertex(0.5 * step, this.size);
        for (var i = 0, pos = true; i <= 4; i++, pos = !pos) {
            vertex((0.5 + i) * step, pos ? this.size : -this.size);
            vertex((1.5 + i) * step, pos ? -this.size : this.size);
        }
        vertex(5.5 * step, -this.size);
        vertex(GRID_SIZE * 2, 0);
        endShape();

        textRotated(this.resistance, this.size, -GRID_SIZE / 2, -1.0 * v.heading())
        pop();
        pop();
    }
};
class Capacitor extends SinglePort {
    constructor(x, y) {
        super(x, y);
        this.capacitance = "0.1u"
    }

    setCapacitance(c) {
        this.capacitance = c;
    }

    drawComponent(x1, y1, x2, y2) {
        var v = createVector(x2 - x1, y2 - y1);
        var vn = v.copy().normalize(v);
        var m1 = v.mag() / 2 - 0.25 * GRID_SIZE;
        var m2 = v.mag() / 2 + 0.25 * GRID_SIZE;
        var step = (m2 - m1) / 6;

        line(x1, y1, x1 + vn.x * m1, y1 + vn.y * m1);
        line(x2, y2, x2 - vn.x * m1, y2 - vn.y * m1);

        push();
        translate(x1, y1);
        rotate(v.heading());
        strokeWeight(2);
        line(m1, -this.size, m1, this.size);
        line(m2, -this.size, m2, this.size);
        strokeWeight(1);
        textRotated(this.capacitance, m1 + this.size, -GRID_SIZE / 2, -1.0 * v.heading())
        pop();
    }
};
class Inductor extends SinglePort {
    constructor(x, y) {
        super(x, y);
        this.inductance = "1.0m"
    }

    drawComponent(x1, y1, x2, y2) {
        var v = createVector(x2 - x1, y2 - y1);
        var vn = v.copy().normalize(v);
        var m1 = v.mag() / 2 - GRID_SIZE;
        var m2 = v.mag() / 2 + GRID_SIZE;
        line(x1, y1, x1 + vn.x * m1, y1 + vn.y * m1);
        line(x2, y2, x2 - vn.x * m1, y2 - vn.y * m1);

        push();
        translate(x1, y1);
        rotate(v.heading());
        translate(m1, 0);
        noFill();
        var step = (m2 - m1) / 4
        for (var i = 0; i < 4; i++) {
            var centerX = (i + 0.5) * step;
            arc(centerX, 0, step, this.size * 1.5, PI, 0);
        }
        textRotated(this.inductance, this.size, -GRID_SIZE / 2, -1.0 * v.heading());
        pop();
    }
};
class Diode extends SinglePort {
    constructor(x, y) {
        super(x, y);
        this.v_d    // voltage across diode
        this.v_t    // thermal voltage
        this.i_rs   // reverse saturation current
    }

    drawComponent(x1, y1, x2, y2) {
        var v = createVector(x2 - x1, y2 - y1);
        var m = v.mag() / 2;
        var s = this.size * 0.75;

        line(x1, y1, x2, y2);

        push();
        translate(x1, y1);
        rotate(v.heading());
        beginShape(TRIANGLES);
        fill(0);
        vertex(m - s, s);
        vertex(m - s, -s);
        vertex(m + s, 0);
        endShape();
        line(m + s, s, m + s, -s);
        pop();
    }
};
class VSource extends SinglePort {
    constructor(x, y) {
        super(x, y);
        this.voltage = 9.0;
    }

    drawComponent(x1, y1, x2, y2) {
        var v = createVector(x2 - x1, y2 - y1);
        var m = v.mag() / 2;

        var ms = this.size / 3;
        var mc = this.size * 3;
        var mn = m - mc / 4;
        var mp = m + mc / 4;

        line(x1, y1, x2, y2);

        push();
        translate(x1, y1);
        rotate(v.heading());
        fill(255);
        ellipse(m, 0, mc, mc);
        line(mn, ms, mn, -ms);
        line(mp, ms, mp, -ms);
        line(mp - ms, 0, mp + ms, 0);
        textRotated(this.voltage + " V", m, -GRID_SIZE, -1.0 * v.heading())
        pop();
    }
};
class ISource extends SinglePort {
    constructor(x, y) {
        super(x, y);
        this.current = 1.0;
    }

    drawComponent(x1, y1, x2, y2) {
        var v = createVector(x2 - x1, y2 - y1);
        var m = v.mag() / 2;

        var ms = this.size / 3;
        var mc = this.size * 3;
        var mn = m - mc / 4;
        var mp = m + mc / 4;

        line(x1, y1, x2, y2);

        push();
        translate(x1, y1);
        rotate(v.heading());
        fill(255);
        ellipse(m, 0, mc, mc);
        line(mn, 0, mp, 0);
        beginShape(TRIANGLES);
        fill(0);
        vertex(mp - ms, ms);
        vertex(mp - ms, -ms);
        vertex(mp, 0);
        endShape();
        textRotated(this.current + " A", m, -GRID_SIZE, -1.0 * v.heading())
        pop();
    }
};

// ====================[ SINGLE PIN (ZERO PORT) CLASSES ]====================
class ZeroPort extends Part{
    constructor() {
        super();
        this.x = 0;
        this.y = 0;
        this.built = false;
    }

    draw() {
        stroke(this.highlight ? g_colorHighlight : g_colorDefault);
        if (this.built) this.drawComponent(this.x, this.y);
        else this.drawComponent(g_mouseX, g_mouseY);
    }

    setEnd(x, y) {
        this.x = x;
        this.y = y;
        this.built = true;
    }

    getNearestDistance(range) {
        var d = dist(this.x, this.y, mouseX, mouseY); 
        return (d < range ? d : undefined);
    }
};
class VRef extends ZeroPort {
    constructor() {
        super();
        this.voltage = 9.0;
    }

    drawComponent(x, y) {
        var w = GRID_SIZE * 0.5;

        push();
        translate(x, y);
        line(0, 0, 0, -w);
        strokeWeight(2);
        line(-w, -w, w, -w);
        textSize(12);
        fill(0);
        noStroke();
        text(this.voltage + " V", w * 1.5, -w * 1.5);
        pop();
    }
}
class Ground extends ZeroPort {
    drawComponent(x, y) {
        var w = GRID_SIZE * 0.5;
        push();
        translate(x, y);
        line(0, 0, 0, w);
        beginShape(TRIANGLES);
        noFill();
        vertex(-w, w);
        vertex(w, w);
        vertex(0, GRID_SIZE);
        endShape();
        pop();
    }
}

// ====================[ ENTRY POINT ]====================
function setup() {
    canvas = createCanvas(windowWidth, windowHeight - WEB_TOP_MARGIN);
    canvas.position(0, WEB_TOP_MARGIN);
    canvas.style("z-index", "-1");

    g_colorDefault = color('#000');
    g_colorHighlight = color('#49F');

    // show grid on start
    g_drawGrid = true;

    // default modes
    g_currentMode = MODES.Drawing;
    g_drawingComp = COMPONENTS.Wire;

    // default mouse cursor
    cursor(CROSS);

    // setup background graphic
    g_background = createGraphics(width, height);
    stroke(100);
    for (var x = BORDER_SIZE; x < width - BORDER_SIZE; x += GRID_SIZE) {
        for (var y = BORDER_SIZE; y < height - BORDER_SIZE; y += GRID_SIZE) {
            g_background.point(x, y);
        }
    }
    g_background.fill(200);
    g_background.text("Copyright © 2017 Muchen He", 10, height - 10);
}

function draw() {
    background(255);

    // update snapping position
    g_mouseX = round(mouseX / GRID_SIZE) * GRID_SIZE;
    g_mouseY = round(mouseY / GRID_SIZE) * GRID_SIZE;

    // user interactions
    if (g_currentMode === MODES.Drawing) {
        drawCursor();
    } else if (g_currentMode === MODES.Editing) {
        // highlight nearst obj
        var nearestIndex = getNearestComponentIndex();
        if (nearestIndex != -1) {
            // actually something near
            g_components[nearestIndex].setHighlight(true);
        }
    }

    // draw other stuff
    if (g_drawGrid) image(g_background, 0, 0);
    drawHUD();

    // draw components
    for (var i = 0; i < g_components.length; i++) {
        g_components[i].draw();
    }

    // draw current component (if drawing)
    if (g_currentComponent != undefined) {
        g_currentComponent.draw();
    }

    // noLoop();
}

// ====================[ INPUT EVENTS ]====================
function mousePressed() {
    // if mouse is outside of canvas, don't do anything
    if (g_mouseX < 0 || g_mouseY < 0 || g_mouseX > width || g_mouseY > height) return;

    if (mouseButton == LEFT) {
        if (g_currentMode == MODES.Drawing) {
            handleComponent();
        }
        else if (g_currentMode == MODES.Editing) {
            handleSelect();
        }
    } else if (mouseButton == CENTER) {
        handleModeSwitch();
    }
    // redraw();
}

function mouseReleased() {
    finishComponent();
    // redraw();
}

function mouseWheel(event) {
    if (event.delta > 0) {
        if (g_drawingComp < 8) g_drawingComp++;
    } else {
        if (g_drawingComp > 0) g_drawingComp--;
    }
    // redraw();
}

function mouseMoved() {
    // redraw();
}

function mouseDragged() {
    // redraw();
}

function keyPressed() {
    switch(keyCode) {
    case ESCAPE:        // Discard current unbuilt component
        g_currentComponent = undefined;
        break;
    case DELETE:        // Delete highlighted components
        handleDelete();
        break;
    }
    // redraw();
}

function keyTyped() {
    if (key === 'g') {
        // toggle grid
        g_drawGrid = !g_drawGrid;
    }
    // redraw();
}

// ====================[ MOUSE EVENT HANDLERS ]====================
function handleComponent() {
    if (g_currentComponent != undefined) {
        // there is already something, finish it
        finishComponent();
    } else {
        switch(g_drawingComp) {
        case COMPONENTS.Wire:       g_currentComponent = new Wire(g_mouseX, g_mouseY);      break;
        case COMPONENTS.Resistor:   g_currentComponent = new Resistor(g_mouseX, g_mouseY);  break;
        case COMPONENTS.Capacitor:  g_currentComponent = new Capacitor(g_mouseX, g_mouseY); break;
        case COMPONENTS.Inductor:   g_currentComponent = new Inductor(g_mouseX, g_mouseY);  break;
        case COMPONENTS.Diode:      g_currentComponent = new Diode(g_mouseX, g_mouseY);     break;
        case COMPONENTS.VSource:    g_currentComponent = new VSource(g_mouseX, g_mouseY);   break;
        case COMPONENTS.ISource:    g_currentComponent = new ISource(g_mouseX, g_mouseY);   break;

        case COMPONENTS.VRef: g_currentComponent = new VRef(g_mouseX, g_mouseY); break;
        case COMPONENTS.Ground: g_currentComponent = new Ground(g_mouseX, g_mouseY); break;
        }
    }
}

function handleSelect() {

}

function handleDelete() {
    for (var i = 0; i < g_components.length; i++) {
        if (g_components[i].highlight && g_components[i] != undefined) {
            g_components.splice(i, 1);
        }
    }
}

function handleModeSwitch() {
    if (g_currentMode == MODES.Drawing) {
        g_currentMode = MODES.Editing;
        cursor(HAND);
    }
    else if (g_currentMode == MODES.Editing) {
    // No view mode right now
    //     g_currentMode = MODES.Viewing;
    //     cursor(MOVE);
    // }
    // else if (g_currentMode == MODES.Viewing) {
        g_currentMode = MODES.Drawing;
        cursor(CROSS);
    }
}

// ====================[ OTHERS ]====================
function drawCursor() {
    stroke(200);
    rect(g_mouseX - 5, g_mouseY - 5, 10, 10);
}

function drawHUD() {
    noStroke();
    textSize(10);
    text(frameRate().toFixed(1) + "fps", 10, 10);
    textSize(20);
    if (g_currentMode == MODES.Drawing) {
        var drawText = COMPONENT_NAMES[g_drawingComp];
        text("Drawing " + drawText, 10, 30);
    } else if (g_currentMode == MODES.Editing) {
        text("Edit mode", 10, 30);
    }
}

function textRotated(string, x, y, rotation) {
    // Draws a rotated text
    textSize(12);
    fill(0);
    noStroke();
    push();
    translate(x, y);
    rotate(rotation);
    text(string, 0, 0);
    pop();
}

function finishComponent() {
    if ((g_currentComponent === undefined) ||
        (g_currentComponent.x1 == g_mouseX && g_currentComponent.y1 == g_mouseY)) return;

    // don't add to component if mouse position didn't change
    g_currentComponent.setEnd(g_mouseX, g_mouseY);
    g_components.push(g_currentComponent);
    g_currentComponent = undefined;
}

function getNearestComponentIndex(range = SELECT_RANGE) {
    var minDist = 9999; // TODO lol
    var nearestIndex = -1;
    for (var i = 0; i < g_components.length; i++) {
        g_components[i].setHighlight(false);
        var d = g_components[i].getNearestDistance(range);
        if (d === undefined) continue;
        if (minDist > d) {
            minDist = d;
            nearestIndex = i;
        }
    }

    if (minDist === undefined) return -1; // no part in range is found
    return nearestIndex;
}

// end1, end2: two end points of the segment
// point: point under test
// returns a point to the closest
function getDistSqPoint2Seg(end1, end2, point, resultBuf) {
    var vx = point.x - end1.x;  // v = end1 -> point
    var vy = point.y - end1.y;
    var ux = end2.x - end1.x;   // u = end1 -> end2
    var uy = end2.y - end1.y;
    var det = vx * ux + vy * uy;

    // outside the line segment near end1
    if (det <= 0) {
        resultBuf.set(end1);
        return vx * vx + vy * vy;
    }
    
    var lenSq = ux * ux + uy * uy;  // lenSq = u^2

    // outside the line segment near end2
    if (det >= lenSq) {
        resultBuf.set(end2);
        return sq(end2.x - point.x) + sq(end2.y - point.y);
    }

    // near line segment
    var len = sqrt(lenSq);
    var ex = ux / len;              // e = u / |u^2|
    var ey = uy / len;
    var f = ex * vx + ey * vy;      // f = e . v
    resultBuf.x = end1.x + f * ex;
    resultBuf.y = end1.y + f * ey;

    // result = end1 + f * e
    return sq(ux *vy - uy * vx) / lenSq;  // (u x v) ^ 2 / lenSq
}