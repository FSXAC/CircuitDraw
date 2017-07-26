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

const GRID_SIZE = 20;
const BORDER_SIZE = 0;

var components = [];

// Snapped mouse position
var g_mouseX;
var g_mouseY;

// States
const MODES = {
    Drawing: 0,
    Editing: 1,
    Viewing: 2
}
var g_currentMode = MODES.Drawing;

// Components
const COMPONENTS = {
    Wire: 0,
    Resistor: 1,
    Capacitor: 2,
    Inductor: 3,
    Diode: 4,
    VSource: 5,
    ISource: 6,
}
var g_drawingComp = COMPONENTS.Diode;

// slot for temperary component during creation
var g_currentComponent;

// ====================[ APPARENTLY JS HAS CLASSES NOW ]====================
class SinglePort {
    constructor(x, y) {
        this.x1 = x;
        this.y1 = y;
        this.x2 = 0;
        this.y2 = 0;
        this.built = false;
        this.size = 5;
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
}

class Wire extends SinglePort { };
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
        var m1 = v.mag() / 2 - GRID_SIZE;
        var m2 = v.mag() / 2 + GRID_SIZE;
        var step = (m2 - m1) / 6;

        push();
        translate(x1, y1);
        rotate(v.heading());

        line(m2, 0, v.mag(), 0);
        line(0, 0, m1, 0);

        push();
        translate(m1, 0);
        textRotated(this.resistance, this.size, -GRID_SIZE / 2, -1.0 * v.heading())

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
        var m1 = v.mag() / 2 - 0.5 * GRID_SIZE;
        var m2 = v.mag() / 2 + 0.5 * GRID_SIZE;
        var step = (m2 - m1) / 6;

        push();
        translate(x1, y1);
        rotate(v.heading());

        textRotated(this.capacitance, m1 + this.size, -GRID_SIZE / 2, -1.0 * v.heading())

        line(m2, 0, v.mag(), 0);
        line(0, 0, m1, 0);
        line(m1, -this.size, m1, this.size);
        line(m2, -this.size, m2, this.size);

        pop();
    }
};
class Inductor extends SinglePort {
    // TODO: not yet implemented
};
class Diode extends SinglePort {
    constructor (x, y) {
        super(x, y);
        this.v_d    // voltage across diode
        this.v_t    // thermal voltage
        this.i_rs   // reverse saturation current
    }

    drawComponent(x1, y1, x2, y2) {
        var v = createVector(x2 - x1, y2 - y1);
        var m = v.mag() / 2;

        line(x1, y1, x2, y2);

        push();
        translate(x1, y1);
        rotate(v.heading());
        beginShape(TRIANGLES);
        fill(0);
        vertex(m - this.size, this.size);
        vertex(m - this.size, -this.size);
        vertex(m + this.size, 0);
        endShape();
        line(m + this.size, this.size, m + this.size, -this.size);
        pop();
    }
};
class VSource extends SinglePort { };
class ISource extends SinglePort { };

// TODO: Add all common single port items:
// Resistors, capacitors, inductors, diodes, LEDs, zener diodes, VSources, ISources

// TODO: Add single connection components:
// V Source, Ground

// TODO: Add interactive components
// Switches, potentiometers

function setup() {
    canvas = createCanvas(windowWidth, windowHeight - 100);
    canvas.position(0, 100);
    canvas.style("z-index", "-1")
}

function draw() {
    background(255);

    // update snapping position
    g_mouseX = round(mouseX / GRID_SIZE) * GRID_SIZE;
    g_mouseY = round(mouseY / GRID_SIZE) * GRID_SIZE;

    // draw UI
    drawCursor();
    drawGrid();

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
        case COMPONENTS.Wire: 
            g_currentComponent = new Wire(g_mouseX, g_mouseY);
            break;
        case COMPONENTS.Resistor:
            g_currentComponent = new Resistor(g_mouseX, g_mouseY);
            break;
        case COMPONENTS.Capacitor: 
            g_currentComponent = new Capacitor(g_mouseX, g_mouseY);
            break;
        case COMPONENTS.Inductor:
            g_currentComponent = new Inductor(g_mouseX, g_mouseY);
            break;
        case COMPONENTS.Diode:
            g_currentComponent = new Diode(g_mouseX, g_mouseY);
            break;
        case COMPONENTS.VSource:
            g_currentComponent = new VSource(g_mouseX, g_mouseY);
            break;
        case COMPONENTS.ISource:
            g_currentComponent = new ISource(g_mouseX, g_mouseY);
            break;
        }
    }
}

function textRotated(string, x, y, rotation) {
    // Draws a rotated text
    push();
    translate(x, y);
    rotate(rotation);
    text(string, 0, 0);
    pop();
}

function mouseReleased() {
    finishComponent();
}

function finishComponent() {
    if ((g_currentComponent === undefined) ||
        (g_currentComponent.x1 == g_mouseX && g_currentComponent.y1 == g_mouseY)) return;

    // don't add to component if mouse position didn't change
    g_currentComponent.setEnd(g_mouseX, g_mouseY);
    components.push(g_currentComponent);
    g_currentComponent = undefined;
}