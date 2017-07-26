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
var BORDER_SIZE = 50;

var lines = [];

function setup() {
    canvas = createCanvas(windowWidth, windowHeight);
    canvas.position(0, 0);
}

function draw() {
    background(255);

    drawGrid();

    for (var i = 0; i < lines.length; i++) {
        lines[i].draw();
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

function mousePressed() {
    lines.push(new Line(mouseX, mouseY));
}

function mouseReleased() {
    lines[lines.length - 1].setEnd(mouseX, mouseY);
}

function Line(x, y) {
    this.x1 = x;
    this.y1 = y;

    this.x2 = 0;
    this.y2 = 0;

    this.built = false;

    this.draw = function() {
        if (this.built) line(this.x1, this.y1, this.x2, this.y2);
        else line(this.x1, this.y1, mouseX, mouseY);
    }

    this.setEnd = function(x, y) {
        this.x2 = x;
        this.y2 = y;
        this.built = true;
    }
}