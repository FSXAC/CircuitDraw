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
    Resistor: 1
}
var g_drawingComp = COMPONENTS.Resistor;

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

    drawComponent(x1, y1, x2, y2) { // TODO: pushing the matrix from the get go will make the intiail calc less cumbersome
        var p1 = createVector(x1, y1);
        var p2 = createVector(x2, y2);
        var v = p5.Vector.sub(p2, p1);
        var mid = p5.Vector.add(p1, p5.Vector.mult(v, 0.5));

        var vn = p5.Vector.div(v, v.mag()).mult(GRID_SIZE);
        var start = p5.Vector.sub(mid, vn);
        var end = p5.Vector.add(mid, vn);

        line(x1, y1, start.x, start.y);
        line(x2, y2, end.x, end.y);

        // draw resistor symbol
        push();
        translate(start.x, start.y);
        text(this.resistance, 10, -10);
        rotate(vn.heading());
        var step = GRID_SIZE / 3;
        beginShape(LINES);
        vertex(0, 0);               // head
        vertex(0.5 * step, 10);
        for (var i = 0, pos = true; i <= 4; i++, pos = !pos) {
            vertex((0.5 + i) * step, pos ? 10 : -10);
            vertex((1.5 + i) * step, pos ? -10 : 10);
        }
        vertex(5.5 * step, -10);    // tail
        vertex(GRID_SIZE * 2, 0);
        endShape();
        pop();
    }
};
class Capacitor extends SinglePort { };
class Inductor extends SinglePort { };
class Diode extends SinglePort { };
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

    console.log(components.length);
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
        }
    }
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