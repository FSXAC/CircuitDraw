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

// ====================[ CircuitDraw 0.3 ]====================

// ====================[ TODO LIST ]====================
// TODO: Add caps lock

// TODO: Add part editing
// Moving parts around
// Changing values

// TODO: Add interactive components
// Switches, potentiometers

// TODO: Add interaction mode

// TODO: Add circuit analysis
// Voltmeter, ohm meter

const WEB_TOP_MARGIN = 40;
const GRID_SIZE      = 20;
const BORDER_SIZE    = 0;
const SELECT_RANGE   = 5;
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
    Ground: 8,
    IC: 9
}
const COMPONENT_NAMES = [
    "Wire", "Resistor", "Capacitor", "Inductor", "Diode",
    "Voltage Source", "Current Source", "Voltage Reference",
    "Ground Reference", "Chip (DIP)"
]
const SI_PREFIX = "pnumkMG";

var g_colorDefault = '#000';     // [color]  standard colors
var g_colorHighlight = '#49F';   
var g_colorHighlightA = "#CEF"
var g_colorSelected = '#F94';

var g_drawGrid;         // [bool]   draw grid or not
var g_background;       // [p5]     background graphic

var g_components = [];  // [Part]   list of all components onscreen

var g_mouseX;           // [real]   snapped mouse coordinates
var g_mouseY;

var g_currentMode;      // [enum]   current mode in MODES
var g_drawingComp;      // [enum]   current component in COMPONENTS
var g_currentComponent; // [Part]   component of the part in editing

var g_textOpacity = 255;// [real]   for fancy texts
var g_textOpacityTgt = 0;

var g_dragEdit = false; // [bool]   for selection box in edit mode
var g_dragEditX;        // [real]
var g_dragEditY;

var g_editStringBuf = "";    // [string]
var g_editStringValid;

// ====================[ APPARENTLY JS HAS CLASSES NOW ]====================
class Part {
    constructor() {
        this.highlight = false;
        this.selected = false;
    }

    setHighlight(highlight) {
        this.highlight = highlight;
    }

    setSelected(select) {
        this.selected = select;
    }

    setParameter(param) { }
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
        stroke(this.highlight ? g_colorHighlight : this.selected ? g_colorSelected :  g_colorDefault);
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

    getEndPoints() {
        return [ createVector(this.x1, this.y1), createVector(this.x2, this.y2) ];
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
        this.resistance = "100";
    }

    setParameter(r) {
        if (r != "") this.resistance = r;
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

        if (this.built) textRotated(this.resistance + "\u03A9", this.size, -GRID_SIZE / 2, -1.0 * v.heading())
        pop();
        pop();
    }
};
class Capacitor extends SinglePort {
    constructor(x, y) {
        super(x, y);
        this.capacitance = "0.1u"
    }

    setParameter(c) {
        if (c != "") this.capacitance = c;
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
        if (this.built) textRotated(this.capacitance + "F", m1 + this.size, -GRID_SIZE / 2, -1.0 * v.heading())
        pop();
    }
};
class Inductor extends SinglePort {
    constructor(x, y) {
        super(x, y);
        this.inductance = "1.0m"
    }

    setParameter(l) {
        if (l != "") this.inductance = l;
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
        if (this.built) textRotated(this.inductance + "H", this.size, -GRID_SIZE / 2, -1.0 * v.heading());
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

    setParameter(v) {
        if (v != "") this.voltage = v;
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
        if (this.built) textRotated(this.voltage + "V", m, -GRID_SIZE, -1.0 * v.heading())
        pop();
    }
};
class ISource extends SinglePort {
    constructor(x, y) {
        super(x, y);
        this.current = 1.0;
    }

    setParameter(i) {
        if (i != "") this.current = i;
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
        if (this.built) textRotated(this.current + "A", m, -GRID_SIZE, -1.0 * v.heading())
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
        stroke(this.highlight ? g_colorHighlight : this.selected ? g_colorSelected : g_colorDefault);
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

    getEndPoints() {
        return [createVector(this.x, this.y)];
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
        if (this.built) text(this.voltage + " V", w * 1.5, -w * 1.5);
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

// ====================[ IC CLASS ]====================
class IC extends Part{
    constructor(x, y) {
        super();
        this.x1 = x;
        this.y1 = y;
        this.x2 = 0;
        this.y2 = 0;
        this.built = false;
        this.label = "IC";
    }

    setParameter(label) {
        if (label != "") this.label = label;
    }

    draw() {
        stroke(this.highlight ? g_colorHighlight : this.selected ? g_colorSelected :  g_colorDefault);
        if (this.built) {
            this.drawComponent(this.x1, this.y1, this.x2, this.y2);
        } else {
            this.drawComponent(this.x1, this.y1, g_mouseX, g_mouseY);
        }
    }

    drawComponent(x1, y1, x2, y2) {
        fill(50);
        rect(x1, y1, x2 - x1, y2 - y1);

        if (this.built) {
            for (var i = x1; i <= x2; i += GRID_SIZE) {
                line(i, y1, i, y1 - GRID_SIZE);
                line(i, y2, i, y2 + GRID_SIZE);
                strokeWeight(3);
                point(i, y1 - GRID_SIZE);
                point(i, y2 + GRID_SIZE);
                strokeWeight(1);
            }
            textSize(GRID_SIZE * 0.8);
            noStroke();
            fill(255);
            text(this.label.toUpperCase(), x1 + 0.5 * GRID_SIZE, y2 - 0.5 * GRID_SIZE);
        }
    }

    setEnd(x, y) {
        this.x2 = x;
        this.y2 = y;
        if (x < this.x1) {  // TODO: temp hack for resolving p1, p2 issue
            this.x2 = this.x1;
            this.x1 = x;
        }
        if (y < this.y1) {
            this.y2 = this.y1;
            this.y1 = y;
        }
        this.built = true;
    }

    getNearestDistance(r) {
        // if (isInsideRect(this.x1, this.y1, this.x2, this.y2, mouseX, mouseY)) return 0;
        if (mouseX > (this.x1 - r) && mouseX < (this.x2 + r) && mouseY > (this.y1 - r) && mouseY < (this.y2 + r)) return 0;
        else return undefined;
    }

    getEndPoints() {
        return [createVector(this.x1, this.y1),
                createVector(this.x1, this.y2),
                createVector(this.x2, this.y1),
                createVector(this.x2, this.y2)];
    }
}

// ====================[ ENTRY POINT ]====================
function setup() {
    canvas = createCanvas(windowWidth, windowHeight - WEB_TOP_MARGIN);
    canvas.position(0, WEB_TOP_MARGIN);
    canvas.style("z-index", "-1");

    // show grid on start
    g_drawGrid = false;

    // default modes
    g_currentMode = MODES.Drawing;
    g_drawingComp = COMPONENTS.Wire;

    // default mouse cursor
    cursor(CROSS);

    // setup background graphic
    var windowScaleFactor = displayWidth / windowWidth;
    if (Number.isInteger(windowScaleFactor)) {
        g_background = createGraphics(width * windowScaleFactor, height * windowScaleFactor);
        stroke(100);
        for (var x = BORDER_SIZE; x < g_background.width - BORDER_SIZE; x += GRID_SIZE) {
            for (var y = BORDER_SIZE; y < g_background.height - BORDER_SIZE; y += GRID_SIZE) {
                g_background.point(x, y);
            }
        }
    }
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

        // drawing selection rectangle
        if (g_dragEdit) {
            fill(g_colorHighlightA);
            rect(g_dragEditX, g_dragEditY, mouseX-g_dragEditX, mouseY-g_dragEditY);
        }
    }

    // draw background
    drawGrid();

    // draw components
    for (var i = 0; i < g_components.length; i++) {
        g_components[i].draw();
    }

    // draw current component (if drawing)
    if (g_currentComponent != undefined) {
        g_currentComponent.draw();
    }

    // draw other stuff
    drawHUD();
    drawCopyright();
}

// ====================[ INPUT EVENTS ]====================
function mousePressed() {
    // if mouse is outside of canvas, don't do anything
    if (g_mouseX < 0 || g_mouseY < 0 || g_mouseX > width || g_mouseY > height) return;

    if (mouseButton === LEFT) {
        if (g_currentMode === MODES.Drawing) {
            handleComponent();
        }
        else if (g_currentMode === MODES.Editing) {
            g_dragEditX = mouseX;
            g_dragEditY = mouseY;
            handleSelect();
        }
    } else if (mouseButton === CENTER) {
        handleModeSwitch();
    }
}

function mouseReleased() {
    finishComponent();

    if (g_currentMode === MODES.Editing && mouseButton === LEFT) {
        if (g_dragEdit) {
            selectComponentInBox(g_dragEditX, g_dragEditY, mouseX, mouseY);
            g_dragEdit = false;
        }
    }
}

function mouseWheel(event) {
    if (event.delta > 0) {
        if (g_drawingComp < Object.keys(COMPONENTS).length - 1) g_drawingComp++;
    } else {
        if (g_drawingComp > 0) g_drawingComp--;
    }
    g_textOpacity = 255;
}

function mouseMoved() {
}

function mouseDragged() {
    if (g_currentMode === MODES.Editing && mouseButton === LEFT) {
        g_dragEdit = true;
    }
}

function keyPressed() {
    if (g_currentMode === MODES.Drawing) {
        switch(keyCode) {
        case ESCAPE:        // Discard current unbuilt component
            g_currentComponent = undefined;
            g_editStringBuf = "";
            break;
        case BACKSPACE:
            g_editStringBuf = g_editStringBuf.substring(0, g_editStringBuf.length - 1);
            g_editStringValid = validateEditInput()[0];
            break;
        case ENTER:         // finish
            finishComponent();
            break;
        }
    } else if (g_currentMode === MODES.Editing) {
        switch(keyCode) {
        case ESCAPE:        // Deselect all
            for (var i = 0; i < g_components.length; i++) {
                g_components[i].setSelected(false);
            }
            break;
        case DELETE:        // Delete highlighted components
            handleDelete();
            break;
        }
    }
}

function keyTyped() {
    if (g_currentMode === MODES.Drawing && g_currentComponent != undefined) {
        if ((keyCode >= 48 && keyCode <= 57) ||     // 0-9
            (keyCode >= 97 && keyCode <= 122) ||    // a-z
            (keyCode >= 65 && keyCode <= 90) ||     // A-Z
            (keyCode == 46)) {
            g_editStringBuf += key;
            g_editStringValid = validateEditInput()[0];
        }
    } else {
        if (key === 'g' || key === 'G') {
            // toggle grid
            g_drawGrid = !g_drawGrid;
        }
    }
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

        case COMPONENTS.IC: g_currentComponent = new IC(g_mouseX, g_mouseY); break;
        }
    }
}

function handleSelect() {
    // get highlighted component and select them
    for (var i = 0; i < g_components.length; i++) {
        if (g_components[i].highlight && g_components[i] != undefined) {
            g_components[i].setSelected(!g_components[i].selected);
            return;
        }
    }
}

function handleDelete() {
    for (var i = 0; i < g_components.length; i++) {
        if (g_components[i].selected && g_components[i] != undefined) {
            g_components.splice(i--, 1);
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
    g_textOpacity = 255;
}

// ====================[ OTHERS ]====================
function drawCursor() {
    stroke(g_colorHighlight);
    noFill();
    rect(g_mouseX - 5, g_mouseY - 5, 10, 10);
}

function drawGrid() {
    if (g_drawGrid && g_background != undefined) {
        image(g_background, 0, 0, width, height);
    } else if (g_drawGrid) {
        for (var x = BORDER_SIZE; x < width - BORDER_SIZE; x += GRID_SIZE) {
            for (var y = BORDER_SIZE; y < height - BORDER_SIZE; y += GRID_SIZE) {
                stroke(100);
                point(x, y);
            }
        }
        textSize(12);
        noStroke();
        fill(255, 0, 0);
        text("WARNING: Current browser scale not supported. Please rescale the window and refresh (else bad performance)", 10, height - 20);
    }
}

function drawHUD() {
    noStroke();
    fill(0, g_textOpacity);
    g_textOpacity = lerp(g_textOpacity, g_textOpacityTgt, 0.02);
    textSize(20);
    if (g_currentMode === MODES.Drawing) {
        text("Draw " + COMPONENT_NAMES[g_drawingComp], mouseX, mouseY + 20);
    } else if (g_currentMode === MODES.Editing) {
        text("Edit", mouseX, mouseY + 20);
    }

    // draw input text
    if (g_editStringBuf != "") {
        textSize(12);
        if (g_editStringValid) fill(g_colorHighlight);
        else fill(255, 0, 0);
        text(g_editStringBuf, mouseX, mouseY + 35);
    }
}

function drawCopyright() {
    textSize(12);
    fill(200);
    text("Copyright © 2017 Muchen He", 10, height - 5);
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
    // don't add to component if mouse position didn't change
    if ((g_currentComponent === undefined) ||
        (g_currentComponent.x1 == g_mouseX && g_currentComponent.y1 == g_mouseY)) return;

    // clear edit strign buffer
    var param = validateEditInput();
    g_currentComponent.setParameter((param[0]) ? param[1] + param[2] : "");
    g_editStringBuf = "";

    g_currentComponent.setEnd(g_mouseX, g_mouseY);
    g_components.push(g_currentComponent);

    // clear the current component
    g_currentComponent = undefined;
}

function getNearestComponentIndex(r = SELECT_RANGE) {
    var range = sqrt(r);
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
// returns a distance from the point closest
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

// Check if a point inside a rectange
function isInsideRect(x1, y1, x2, y2, px, py) {
    var minX = Math.min(x1, x2);
    var maxX = Math.max(x1, x2);
    var minY = Math.min(y1, y2);
    var maxY = Math.max(y1, y2);
    return (px > minX && px < maxX && py > minY && py < maxY);
}

// parameter is a box; inspect the list of components turn their selection to TRUE if they touch the box
function selectComponentInBox(x1, y1, x2, y2) {
    for (var i = 0; i < g_components.length; i++) {
        var endPoints = g_components[i].getEndPoints(); // PVector
        for (var j = 0; j < endPoints.length; j++) {
            if (isInsideRect(x1, y1, x2, y2, endPoints[j].x, endPoints[j].y))
                g_components[i].setSelected(true);
        }
    }
}

// returns true if the input is valid (according to regex)
function validateEditInput() {
    if (g_drawingComp == COMPONENTS.IC){
        return [true, g_editStringBuf, ""];
    } else {
        var input = g_editStringBuf.split(/([0-9]*[.]?[0-9]+)/g);
        var valid = input.length === 3 && input[1] != undefined && 
                    ((input[2].length == 1 && SI_PREFIX.indexOf(input[2]) > -1) || input[2].length == 0);
        return [valid, input[1], input[2]];
    }
}
