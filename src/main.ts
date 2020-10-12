const tetrisCanvas = document.getElementById("tetris") as HTMLCanvasElement;
const counter = document.getElementById("counter") as HTMLDivElement;
const reset = document.getElementById("reset") as HTMLButtonElement;
const ctx = tetrisCanvas.getContext("2d");

type TetrisData = (TetrisType | " ")[][];
type TetrisType = "ll" | "rl" | "c" | "s" | "lz" | "rz" | "p";

type TetrisFigures = TetrisFigure[];
type TetrisFigureCoord = [number, number];
type TetrisFigureCoords = TetrisFigureCoord[];
type TetrisFigureMove = "left" | "right" | "down" | "up";
type TetrisFigureRotate = "rotate";

interface GameAdapter {
  control: (move) => void;
  render: (data: TetrisData, counter: number) => void;
}

class Tetris {
  staticField: TetrisData;
  data: TetrisData;
  adapter: GameAdapter;

  width: number;
  height: number;

  count: number = 0;

  intervalID: number;

  currentFigure: TetrisFigure;
  figures: TetrisFigures = [];

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height + 2;
    this.staticField = new Array(this.height).fill(
      new Array(this.width).fill(" ")
    );
  }

  getRandomFigure = (): TetrisType => {
    const variants: TetrisType[] = ["ll", "rl", "c", "s", "lz", "rz", "p"];
    return variants[Math.floor(Math.random() * variants.length)];
  };

  moveCurrentFigure(to: TetrisFigureMove | TetrisFigureRotate): boolean {
    const nextCoord = this.currentFigure.check(to);

    let borderCollapse = false;
    let anotherFigure = false;

    nextCoord.forEach((coord) => {
      const [x, y] = coord;
      // Check border
      if (x === this.width || x < 0 || y === this.height - 1) {
        borderCollapse = true;
      }
      // Check another figures
      if (this.staticField[y][x] !== " ") {
        anotherFigure = true;
      }
    });

    if (!borderCollapse && !anotherFigure) {
      if (to === "rotate") {
        this.currentFigure.rotate();
        return true;
      }
      this.currentFigure.move(to);
      return true;
    }
    return false;
  }

  run = (adapter: GameAdapter) => {
    this.adapter = adapter;

    this.currentFigure = new TetrisFigure(
      this.getRandomFigure(),
      Math.floor(this.width / 2),
      0
    );

    window.addEventListener("keydown", (event) => {
      const variants: Record<string, TetrisFigureMove | TetrisFigureRotate> = {
        ArrowLeft: "left",
        ArrowRight: "right",
        ArrowUp: "rotate",
      };

      if (event.key === " ") {
        for (let i = 0; i < this.height; i += 1) {
          this.moveCurrentFigure("down");
        }
        return;
      }

      const variant = variants[event.code];
      this.moveCurrentFigure(variant);
    });

    this.intervalID = setInterval(() => {
      this.data = this.staticField.map((row) => [...row]);
      this.currentFigure.formattedData.forEach((coord) => {
        this.data[coord[1]][coord[0]] = this.currentFigure.type;
      });

      if (!this.moveCurrentFigure("down")) {
        this.staticField = this.data;

        // Game Over check
        if (this.staticField[0].some((type) => type !== " ")) {
          this.stop();
          return;
        }

        // Check completed line
        const completedLineIdxs = [];
        this.staticField.forEach((row, idx) => {
          if (row.every((type) => type !== " ")) {
            completedLineIdxs.push(idx);
          }
        });
        completedLineIdxs.forEach((idx) => {
          this.staticField.splice(idx, 1);
          this.staticField.unshift(new Array(this.width).fill(" "));
        });
        this.count += completedLineIdxs.length;

        this.currentFigure = new TetrisFigure(
          this.getRandomFigure(),
          Math.floor(this.width / 2),
          0
        );
      }

      this.adapter.render(this.data.slice(1), this.count);
    }, 1000 / 15);
  };

  stop = () => {
    clearInterval(this.intervalID);
  };

  reset = () => {
    this.stop();
    this.data = [];
    this.intervalID = null;
    this.currentFigure = null;
    this.figures = [];
    this.run(this.adapter);
    this.count = 0;
    this.staticField = new Array(this.height).fill(
      new Array(this.width).fill(" ")
    );
  };
}

class TetrisFigure {
  data: TetrisFigureCoords;
  type: TetrisType;
  allVariants: TetrisFigureCoords[];
  x: number;
  y: number;
  rotateIndex: number = 0;

  get formattedData(): TetrisFigureCoords {
    return this.data.map((coord) => {
      return [coord[0] + this.x, coord[1] + this.y];
    });
  }

  getNewFigure(type: TetrisType, x: number, y: number): TetrisFigureCoords {
    const variants: Record<TetrisType, TetrisFigureCoords[]> = {
      ll: [
        [
          [1, 0],
          [1, 1],
          [1, 2],
          [0, 2],
        ],
        [
          [0, 0],
          [0, 1],
          [1, 1],
          [2, 1],
        ],
        [
          [0, 0],
          [1, 0],
          [0, 1],
          [0, 2],
        ],
        [
          [0, 0],
          [1, 0],
          [2, 0],
          [2, 1],
        ],
      ],
      rl: [
        [
          [0, 0],
          [0, 1],
          [0, 2],
          [1, 2],
        ],
        [
          [0, 0],
          [1, 0],
          [2, 0],
          [0, 1],
        ],
        [
          [0, 0],
          [1, 0],
          [1, 1],
          [1, 2],
        ],
        [
          [2, 0],
          [2, 1],
          [1, 1],
          [0, 1],
        ],
      ],
      lz: [
        [
          [1, 1],
          [2, 1],
          [2, 2],
          [3, 2],
        ],
        [
          [3, 0],
          [3, 1],
          [2, 1],
          [2, 2],
        ],
      ],
      rz: [
        [
          [2, 1],
          [3, 1],
          [2, 2],
          [1, 2],
        ],
        [
          [2, 0],
          [2, 1],
          [3, 1],
          [3, 2],
        ],
      ],
      p: [
        [
          [1, 0],
          [1, 1],
          [0, 1],
          [2, 1],
        ],
        [
          [0, 0],
          [0, 1],
          [0, 2],
          [1, 1],
        ],
        [
          [0, 0],
          [1, 0],
          [2, 0],
          [1, 1],
        ],
        [
          [1, 0],
          [1, 1],
          [1, 2],
          [0, 1],
        ],
      ],
      c: [
        [
          [0, 0],
          [0, 1],
          [1, 1],
          [1, 0],
        ],
      ],
      s: [
        [
          [0, 1],
          [1, 1],
          [2, 1],
          [3, 1],
        ],
        [
          [2, 0],
          [2, 1],
          [2, 2],
          [2, 3],
        ],
      ],
    };

    this.allVariants = variants[type];

    return variants[type][0];
  }

  constructor(type: TetrisType, x: number, y: number) {
    this.type = type;
    this.x = x;
    this.y = y;
    this.data = this.getNewFigure(type, x, y);
  }

  rotate(reverse?: boolean) {
    const maxIndex: Record<TetrisType, number> = {
      c: 0,
      s: 1,
      lz: 1,
      rz: 1,
      ll: 3,
      rl: 3,
      p: 3,
    };

    if (reverse) {
      if (this.rotateIndex !== 0) {
        this.rotateIndex -= 1;
      } else {
        this.rotateIndex = maxIndex[this.type];
      }
      this.data = this.allVariants[this.rotateIndex];
      return;
    }

    if (this.rotateIndex < maxIndex[this.type]) {
      this.rotateIndex += 1;
    } else {
      this.rotateIndex = 0;
    }
    this.data = this.allVariants[this.rotateIndex];
  }
  check(to: TetrisFigureMove | TetrisFigureRotate): TetrisFigureCoords {
    const reverse: Record<TetrisFigureMove, TetrisFigureMove> = {
      up: "down",
      down: "up",
      left: "right",
      right: "left",
    };
    let result;
    if (to === "rotate") {
      this.rotate();
      result = this.formattedData;
      this.rotate(true);
      return result;
    }

    this.move(to);
    result = this.formattedData;
    this.move(reverse[to]);
    return result;
  }
  move(to: TetrisFigureMove) {
    switch (to) {
      case "up":
        this.y -= 1;
        return;
      case "down":
        this.y += 1;
        return;
      case "left":
        this.x -= 1;
        return;
      case "right":
        this.x += 1;
        return;
    }
  }
  destroy(coord: TetrisFigureCoord) {
    this.data = this.data.filter(
      (c) => c[0] + this.x !== coord[0] || c[1] + this.y !== coord[1]
    );
  }
}

const gameOptions = {
  width: 15,
  height: 30,
  cellSize: 30,
};

const game = new Tetris(gameOptions.width, gameOptions.height);

const renderCanvas = (data, counter) => {
  counter.innerText = "Count: " + counter;
  tetrisCanvas.width = gameOptions.cellSize * gameOptions.width;
  tetrisCanvas.height = gameOptions.cellSize * gameOptions.height;
  data.forEach((row, rowIndex) => {
    row.forEach((cell, cellIndex) => {
      const colors: Record<TetrisType | " ", string> = {
        " ": "#121212",
        ll: "#4caf50",
        rl: "#e91e63",
        c: "#1e88e5",
        s: "#6a1b9a",
        lz: "#ffffff",
        rz: "#eee",
        p: "#00c853",
      };
      ctx.fillStyle = colors[cell];
      ctx.fillRect(
        cellIndex * gameOptions.cellSize,
        rowIndex * gameOptions.cellSize,
        gameOptions.cellSize,
        gameOptions.cellSize
      );
    });
  });
};

reset.addEventListener("click", () => {
  game.reset();
});

game.run({
  render: renderCanvas,
  control: () => "left",
});
