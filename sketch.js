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

var GRID_SIZE = 20;
var BORDER_SIZE = 0;

var components = [];

// Snapped mouse position
var g_mouseX;
var g_mouseY;

// ======================= Classes =====================
class SinglePort {
    constructor(x, y) {
        this.x1 = x;
        this.y1 = y;
        this.x2 = 0;
        this.y2 = 0;
        this.built =  false;
    }

    draw() {
        if (this.built) line(this.x1, this.y1, this.x2, this.y2);
        else line(this.x1, this.y1, g_mouseX, g_mouseY);
    }

    setEnd(x, y) {
        this.x2 = x;
        this.y2 = y;
        this.built = true;
    }
}

function setup() {
    canvas = createCanvas(windowWidth, windowHeight);
    canvas.position(0, 0);
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
    ellipse(g_mouseX, g_mouseY, 5, 5 );
}

function mousePressed() {
    components.push(new SinglePort(g_mouseX, g_mouseY));
}

function mouseReleased() {
    // don't add to component if mouse position didn't change
    // var prevComponent = components[components.length - 1];
    // if (prevComponent.x1 != g_mouseX)
    components[components.length - 1].setEnd(g_mouseX, g_mouseY);
}