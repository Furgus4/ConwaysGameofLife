import { plotLine, deepCopy2DArray, saveState } from './helpers.js';

export class Game {
  constructor(gridSize) {
    document.addEventListener('contextmenu', e => e.preventDefault());
    this.canvas = document.querySelector('#canvas');
    this.ctx = this.canvas.getContext('2d');
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    addEventListener('resize', () => {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    });

    this.gridSize = gridSize;
    this.possibleColors = ["#0d0f11","#86ace4"];
    this.cellSize = 20;
    this.gap = 2;
    this.grid = Array.from({ length: this.gridSize}, () => Array.from({ length: this.gridSize }, () => 0));

    this.gridHistory = [];
    this.gridHistoryIndex = -1;
    [this.gridHistory, this.gridHistoryIndex] = saveState(this.grid, this.gridHistory, this.gridHistoryIndex);

    this.cameraPosition = [(-this.canvas.width/2)+((this.gridSize*(this.cellSize+this.gap))/2), (-this.canvas.height/2)+((this.gridSize*(this.cellSize+this.gap))/2)];
    this.currentScale = 1;
    this.leftMouseDown = false;
    this.rightMouseDown = false;
    this.mousePosition = null;
    this.currentCell = null;
    this.lastCellChanged = null;
    this.newCellValue = null;
    this.overCanvas = true;

    addEventListener("mousemove", (e) => {
      const scaleOffsetX = (this.canvas.width - this.canvas.width * this.currentScale) / (2 * this.currentScale);
      const scaleOffsetY = (this.canvas.height - this.canvas.height * this.currentScale) / (2 * this.currentScale);

      this.mousePosition = [
        e.clientX / this.currentScale + this.cameraPosition[0] - scaleOffsetX,
        e.clientY / this.currentScale + this.cameraPosition[1] - scaleOffsetY
      ];
      this.currentCell = [
        Math.floor(this.mousePosition[0]/(this.cellSize+this.gap)),
        Math.floor(this.mousePosition[1]/(this.cellSize+this.gap))
      ];

      if (this.rightMouseDown) {
        this.cameraPosition[0] -= e.movementX / this.currentScale;
        this.cameraPosition[1] -= e.movementY / this.currentScale;
      }

      this.overCanvas = e.target.id === "canvas";
    });
    addEventListener("mousedown", (e) => {
      if (e.button === 0) {
        if (this.currentCell[0] >= 0 && this.currentCell[0] < this.gridSize && this.currentCell[1] >= 0 && this.currentCell[1] < this.gridSize) {
          this.newCellValue = this.grid[this.currentCell[1]][this.currentCell[0]] === 0 ? 1 : 0;
        } else {
          this.newCellValue = 1;
        }
        this.leftMouseDown = true;
      } else if (e.button === 2 || e.button === 1) {
        this.rightMouseDown = true;
      }
    });
    addEventListener(("mouseup"), () => {
      this.leftMouseDown = false;
      this.rightMouseDown = false;
      if (this.lastCellChanged !== null) {
        [this.gridHistory, this.gridHistoryIndex] = saveState(this.grid, this.gridHistory, this.gridHistoryIndex);
      }
      this.lastCellChanged = null;
    });
    addEventListener("wheel", (e) => {
      this.currentScale -= e.deltaY/1000;
      this.currentScale = Math.max(0.1, Math.min(this.currentScale, 10));
    });

    this.runningSimulation = false;
    this.lastDraw = 0;
    this.drawInterval = 1000/60; // 60fps
    this.lastSimStep = 0;
    this.simStepInterval = 1000/10; // 10fps

    this.simSpeedSlider = document.getElementById("speed");
    this.simSpeedSlider.addEventListener("input", () => {
      this.simStepInterval = 1000/this.simSpeedSlider.value;
    });

    this.clearButton = document.getElementById("clear");
    this.clearButton.addEventListener("click", () => {
      if (!this.runningSimulation) {
        this.grid = Array.from({ length: this.gridSize}, () => Array.from({ length: this.gridSize }, () => 0));
        [this.gridHistory, this.gridHistoryIndex] = saveState(this.grid, this.gridHistory, this.gridHistoryIndex);
      }
    });

    this.undoButton = document.getElementById("undo");
    this.undoButton.addEventListener("click", () => {
      if (this.gridHistoryIndex > 0) {
        this.gridHistoryIndex--;
        this.grid = deepCopy2DArray(this.gridHistory[this.gridHistoryIndex]);
      }
    });
    this.redoButton = document.getElementById("redo");
    this.redoButton.addEventListener("click", () => {
      if (this.gridHistoryIndex < this.gridHistory.length - 1) {
        this.gridHistoryIndex++;
        this.grid = deepCopy2DArray(this.gridHistory[this.gridHistoryIndex]);
      }
    });

    this.startStopButton = document.getElementById("start-stop");
    this.startStopButton.addEventListener("click", () => {
      if (!this.runningSimulation) {
        this.startStopButton.innerHTML = "Stop";
        this.clearButton.style.backgroundColor = "black";
        this.undoButton.style.backgroundColor = "black";
        this.redoButton.style.backgroundColor = "black";
        this.runningSimulation = true;

      } else if (this.runningSimulation) {
        this.startStopButton.innerHTML = "Start";
        this.clearButton.style.backgroundColor = this.possibleColors[0];
        this.undoButton.style.backgroundColor = this.possibleColors[0];
        this.redoButton.style.backgroundColor = this.possibleColors[0];
        this.runningSimulation = false;

        [this.gridHistory, this.gridHistoryIndex] = saveState(this.grid, this.gridHistory, this.gridHistoryIndex);
      }
    });

    [this.clearButton, this.undoButton, this.redoButton].forEach(button => {
      button.addEventListener("mouseenter", () => {
        if (!this.runningSimulation) {
          button.style.backgroundColor = "#121518"
        }
      });
      button.addEventListener("mouseleave", () => {
        if (!this.runningSimulation) {
          button.style.backgroundColor = this.possibleColors[0];
        }
      });
      button.addEventListener("mousedown", () => {
        if (!this.runningSimulation) {
          button.style.backgroundColor = "var(--secondary)";
        }
      });
      button.addEventListener("mouseup", () => {
        if (!this.runningSimulation) {
          button.style.backgroundColor = "#121518";
        }
      });
    });
    this.startStopButton.addEventListener("mouseenter", () => {
      this.startStopButton.style.backgroundColor = "#121518"
    });
    this.startStopButton.addEventListener("mouseleave", () => {
      this.startStopButton.style.backgroundColor = this.possibleColors[0];
    });
    this.startStopButton.addEventListener("mousedown", () => {
      this.startStopButton.style.backgroundColor = "var(--secondary)";
    });
    this.startStopButton.addEventListener("mouseup", () => {
      this.startStopButton.style.backgroundColor = "#121518";
    })

    this.start = this.start.bind(this);
    this.loop = this.loop.bind(this);
    this.update = this.update.bind(this);
    this.draw = this.draw.bind(this);
  }

  start() {
    requestAnimationFrame(this.loop);
  }

  loop(timestamp) {
    if (timestamp - this.lastDraw >= this.drawInterval) {
      this.draw();
      this.lastDraw = timestamp;
    }
    if (timestamp - this.lastSimStep >= this.simStepInterval && this.runningSimulation && !this.leftMouseDown) {
      this.updateSimulation();
      this.lastSimStep = timestamp;
    }
    this.update();
    requestAnimationFrame(this.loop);
  }

  update() {
    if (this.leftMouseDown && this.overCanvas) {
      if (this.lastCellChanged) {
        plotLine(
          this.lastCellChanged[0], this.lastCellChanged[1],
          this.currentCell[0], this.currentCell[1],
          (x0, y0) => { this.grid[y0][x0] = this.newCellValue; },
          { width: this.gridSize, height: this.gridSize }
        );
      } else if (this.currentCell[0] >= 0 && this.currentCell[0] < this.gridSize && this.currentCell[1] >= 0 && this.currentCell[1] < this.gridSize) {
        this.grid[this.currentCell[1]][this.currentCell[0]] = this.newCellValue;
      }
      this.lastCellChanged = this.currentCell;
    }

    if (this.gridHistoryIndex < 1) {
      this.undoButton.style.color = this.possibleColors[0];
    } else {
      this.undoButton.style.color = "var(--text)";
    }
    if (this.gridHistoryIndex > this.gridHistory.length - 2) {
      this.redoButton.style.color = this.possibleColors[0];
    } else {
      this.redoButton.style.color = "var(--text)";
    }
  }

  updateSimulation() {
    let newGrid = Array.from({ length: this.gridSize}, () => Array.from({ length: this.gridSize }, () => 0));
    for (let i = 0; i < this.gridSize; i++) {
      for (let j = 0; j < this.gridSize; j++) {
        let count = 0;
        count += this.grid[i-1] === undefined || this.grid[i-1][j-1] === undefined ? 0 : this.grid[i-1][j-1];
        count += this.grid[i-1] === undefined ? 0 : this.grid[i-1][j];
        count += this.grid[i-1] === undefined || this.grid[i-1][j+1] === undefined ? 0 : this.grid[i-1][j+1];

        count += this.grid[i][j-1] === undefined ? 0 : this.grid[i][j-1];
        count += this.grid[i][j+1] === undefined ? 0 : this.grid[i][j+1];

        count += this.grid[i+1] === undefined || this.grid[i+1][j-1] === undefined ? 0 : this.grid[i+1][j-1];
        count += this.grid[i+1] === undefined ? 0 : this.grid[i+1][j];
        count += this.grid[i+1] === undefined || this.grid[i+1][j+1] === undefined ? 0 : this.grid[i+1][j+1];

        if (count === 3) {
          newGrid[i][j] = 1;
        } else if (count === 2) {
          newGrid[i][j] = this.grid[i][j];
        } else {
          newGrid[i][j] = 0;
        }
      }
    }
    this.grid = newGrid;
  }

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.save();
    this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
    this.ctx.scale(this.currentScale, this.currentScale);
    this.ctx.translate(-this.canvas.width / 2, -this.canvas.height / 2);
    for (let i = 0; i < this.gridSize; i++) {
      for (let j = 0; j < this.gridSize; j++) {
        this.ctx.fillStyle = this.possibleColors[this.grid[i][j]];
        this.ctx.fillRect(
          (j*(this.cellSize+this.gap)) - this.cameraPosition[0],
          (i*(this.cellSize+this.gap)) - this.cameraPosition[1],
          this.cellSize,
          this.cellSize,
        );
      }
    }
    this.ctx.restore();
  }
}
