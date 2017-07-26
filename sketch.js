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