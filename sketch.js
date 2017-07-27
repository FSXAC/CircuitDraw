// FSXAC/CircuitDraw: Javascript webapp to draw circuit diagrams
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
// TODO: Add all common single port items:
// Resistors, capacitors, inductors, diodes, LEDs, zener diodes, VSources, ISources

// TODO: Add single connection components:
// V Source, Ground

// TODO: Add part editing

// TODO: Add ICs

// TODO: Add interactive components
// Switches, potentiometers

// TODO: Add circuit analysis

const WEB_TOP_MARGIN = 70;

const GRID_SIZE = 20;
const BORDER_SIZE = 0;

var components = [];

// Snapped mouse position
var g_mouseX;
var g_mouseY;

// Modes enum
const MODES = {
    Drawing: 0,
    Editing: 1,
    Viewing: 2
}
var g_currentMode = MODES.Drawing;

// Components enum
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
var g_drawingComp = COMPONENTS.Wire;

// slot for temperary component during creation
var g_currentComponent;

// ====================[ APPARENTLY JS HAS CLASSES NOW ]====================

// ====================[ SINGLE PORT CLASSES ]====================
class SinglePort {
    constructor(x, y) {
        this.x1 = x;
        this.y1 = y;
        this.x2 = 0;
        this.y2 = 0;
        this.built = false;
        this.size = 10;
    }

    draw() {
        if (this.built) this.drawComponent(this.x1, this.y1, this.x2, this.y2);
        else this.drawComponent(this.x1, this.y1, g_mouseX, g_mouseY);
    }

    drawComponent(x1, y1, x2, y2) {
        line(x1, y1, x2, y2);
    }

    setEnd(x, y) {
        this.x2 = x;
        this.y2 = y;
        this.built = true;
    }
};
class Wire extends SinglePort {
    constructor(x, y) {
        super(x, y);
        this.color = color(255, 0, 0);
    }

    drawComponent(x1, y1, x2, y2) {
        stroke(this.color);
        line(x1, y1, x2, y2);
        stroke(0);
    }
};
class Resistor extends SinglePort {
    constructor(x, y) {
        super(x, y);
        this.resistance = 100;
    }

    set setResistance(r) {
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

    set setCapacitance(c) {
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
        line(m1, -this.size, m1, this.size);
        line(m2, -this.size, m2, this.size);
        textRotated(this.capacitance, m1 + this.size, -GRID_SIZE / 2, -1.0 * v.heading())
        pop();
    }
};
class Inductor extends SinglePort {
    // TODO: not yet implemented
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
class ZeroPort {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.built = false;
    }

    draw() {
        if (this.built) this.drawComponent(this.x, this.y);
        else this.drawComponent(g_mouseX, g_mouseY);
    }

    setEnd(x, y) {
        this.x = x;
        this.y = y;
        this.built = true;
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
}

function draw() {
    background(255);
    cursor(CROSS);

    // update snapping position
    g_mouseX = round(mouseX / GRID_SIZE) * GRID_SIZE;
    g_mouseY = round(mouseY / GRID_SIZE) * GRID_SIZE;

    // draw UI
    drawCursor();
    drawGrid();
    drawHUD();

    // draw components
    for (var i = 0; i < components.length; i++) {
        components[i].draw();
    }

    // draw current component (if drawing)
    if (g_currentComponent != undefined) {
        g_currentComponent.draw();
    }
}

function drawGrid() {
    stroke(100);
    for (var x = BORDER_SIZE; x < width - BORDER_SIZE; x += GRID_SIZE) {
        for (var y = BORDER_SIZE; y < height - BORDER_SIZE; y += GRID_SIZE) {
            point(x, y);
        }
    }
}

function drawCursor() {
    ellipse(g_mouseX, g_mouseY, 5, 5);
}

function drawHUD() {
    var drawText;

    switch(g_drawingComp) {
    case COMPONENTS.Wire: drawText = "Wire";  break;
    case COMPONENTS.Resistor: drawText = "Resistor"; break;
    case COMPONENTS.Capacitor: drawText = "Capacitor";  break;
    case COMPONENTS.Inductor: drawText = "Inductor"; break;
    case COMPONENTS.Diode: drawText = "Diode"; break;
    case COMPONENTS.VSource: drawText = "V-Source"; break;
    case COMPONENTS.ISource: drawText = "I-Source"; break;
    case COMPONENTS.VRef: drawText = "V-Reference"; break;
    case COMPONENTS.Ground: drawText = "Ground"; break;
    }
    textSize(20);
    text("Drawing " + drawText, 10, 30);
}

function mousePressed() {
    // if not drawing: return (not doing anything at the moment)
    if (g_currentMode != MODES.Drawing) return;

    // if mouse is outside of canvas, don't do anything
    if (g_mouseX < 0 || g_mouseY < 0 || g_mouseX > width || g_mouseY > height) return;

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

function mouseReleased() {
    finishComponent();
}

function mouseWheel(event) {
    if (event.delta > 0) {
        if (g_drawingComp < 8) g_drawingComp++;
    } else {
        if (g_drawingComp > 0) g_drawingComp--;
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
    components.push(g_currentComponent);
    g_currentComponent = undefined;
}