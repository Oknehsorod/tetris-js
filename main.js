const tetrisCanvas = document.getElementById("tetris");
const tNextCanvas = document.getElementById("tetris-next");
const counter = document.getElementById("counter");
const reset = document.getElementById("reset");
const tCtx = tetrisCanvas.getContext("2d");
const tNCtx = tNextCanvas.getContext("2d");
class Tetris {
    constructor(width, height) {
        this.count = 0;
        this.getRandFigName = () => {
            const variants = ["ll", "rl", "c", "s", "lz", "rz", "p"];
            return variants[Math.floor(Math.random() * variants.length)];
        };
        this.moveCurrentFigure = (to) => {
            const nextCoord = this.currentFigure.check(to);
            let borderCollapse = false;
            let anotherFigure = false;
            nextCoord.forEach((coord) => {
                const [x, y] = coord;
                if (x === this.width || x < 0 || y === this.height - 1) {
                    borderCollapse = true;
                }
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
        };
        this.update = () => {
            this.dinamicField = this.staticField.map((row) => [...row]);
            this.currentFigure.formattedData.forEach((coord) => {
                this.dinamicField[coord[1]][coord[0]] = this.currentFigure.type;
            });
            if (!this.moveCurrentFigure("down")) {
                this.staticField = this.dinamicField;
                if (this.staticField[0].some((type) => type !== " ")) {
                    this.stop();
                    return;
                }
                this.staticField.forEach((row, idx) => {
                    if (row.every((type) => type !== " ")) {
                        this.staticField.splice(idx, 1);
                        this.staticField.unshift(new Array(this.width).fill(" "));
                        this.count += 1;
                    }
                });
                this.currentFigure = new TetrisFigure(this.nextFigure, Math.floor(this.width / 2), 0);
                this.nextFigure = this.getRandFigName();
            }
            this.adapter.render(this.dinamicField.slice(1), this.count, this.nextFigure);
        };
        this.run = (adapter) => {
            this.adapter = adapter;
            this.currentFigure = new TetrisFigure(this.getRandFigName(), Math.floor(this.width / 2), 0);
            this.nextFigure = this.getRandFigName();
            this.keyboardData = adapter.control(this.moveCurrentFigure);
            this.intervalID = setInterval(this.update, 1000 / 15);
        };
        this.stop = () => {
            clearInterval(this.intervalID);
            window.removeEventListener(...this.keyboardData);
        };
        this.reset = () => {
            this.stop();
            this.dinamicField = [];
            this.intervalID = null;
            this.currentFigure = null;
            this.run(this.adapter);
            this.count = 0;
            this.staticField = Tetris.createEmptyField(this.height, this.width);
        };
        this.width = width;
        this.height = height + 2;
        this.staticField = Tetris.createEmptyField(this.height, this.width);
    }
}
Tetris.createEmptyField = (height, width) => {
    let arr = [];
    for (let i = 0; i < height; i += 1) {
        arr.push(new Array(width).fill(" "));
    }
    return arr;
};
class TetrisFigure {
    constructor(type, x, y) {
        this.rotateIndex = 0;
        this.type = type;
        this.x = x;
        this.y = y;
        const figureAllVariants = TetrisFigure.getNewFigure(type);
        this.allVariants = figureAllVariants;
        this.data = figureAllVariants[0];
    }
    get formattedData() {
        return this.data.map((coord) => {
            return [coord[0] + this.x, coord[1] + this.y];
        });
    }
    static getNewFigure(type) {
        // prettier-ignore
        const variants = {
            ll: [[[1, 0], [1, 1], [1, 2], [0, 2]], [[0, 0], [0, 1], [1, 1], [2, 1]],
                [[0, 0], [1, 0], [0, 1], [0, 2]], [[0, 0], [1, 0], [2, 0], [2, 1]]],
            rl: [[[0, 0], [0, 1], [0, 2], [1, 2]], [[0, 0], [1, 0], [2, 0], [0, 1]],
                [[0, 0], [1, 0], [1, 1], [1, 2]], [[2, 0], [2, 1], [1, 1], [0, 1]]],
            p: [[[1, 0], [1, 1], [0, 1], [2, 1]], [[0, 0], [0, 1], [0, 2], [1, 1]],
                [[0, 0], [1, 0], [2, 0], [1, 1]], [[1, 0], [1, 1], [1, 2], [0, 1]]],
            lz: [[[1, 1], [2, 1], [2, 2], [3, 2]], [[3, 0], [3, 1], [2, 1], [2, 2]]],
            rz: [[[2, 1], [3, 1], [2, 2], [1, 2]], [[2, 0], [2, 1], [3, 1], [3, 2]]],
            s: [[[0, 1], [1, 1], [2, 1], [3, 1]], [[2, 0], [2, 1], [2, 2], [2, 3]]],
            c: [[[0, 0], [0, 1], [1, 1], [1, 0]]],
        };
        return variants[type];
    }
    rotate(reverse) {
        const maxIndex = {
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
            }
            else {
                this.rotateIndex = maxIndex[this.type];
            }
            this.data = this.allVariants[this.rotateIndex];
            return;
        }
        if (this.rotateIndex < maxIndex[this.type]) {
            this.rotateIndex += 1;
        }
        else {
            this.rotateIndex = 0;
        }
        this.data = this.allVariants[this.rotateIndex];
    }
    check(to) {
        const reverse = {
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
    move(to) {
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
}
const gameOptions = {
    width: 15,
    height: 30,
    cellSize: 30,
};
const game = new Tetris(gameOptions.width, gameOptions.height);
const renderCanvas = (data, count, next) => {
    counter.innerText = "Count: " + count;
    tetrisCanvas.width = gameOptions.cellSize * gameOptions.width;
    tetrisCanvas.height = gameOptions.cellSize * gameOptions.height;
    const nextData = Tetris.createEmptyField(4, 4);
    TetrisFigure.getNewFigure(next)[0].forEach(([x, y]) => {
        nextData[y][x] = next;
    });
    console.log(nextData);
    tNextCanvas.width = gameOptions.cellSize * nextData[0].length;
    tNextCanvas.height = gameOptions.cellSize * nextData.length;
    const render = (ctx) => (row, rowIndex) => {
        row.forEach((cell, cellIndex) => {
            const colors = {
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
            ctx.fillRect(cellIndex * gameOptions.cellSize, rowIndex * gameOptions.cellSize, gameOptions.cellSize, gameOptions.cellSize);
        });
    };
    data.forEach(render(tCtx));
    nextData.forEach(render(tNCtx));
};
const control = (move) => {
    const handler = (event) => {
        const variants = {
            ArrowLeft: "left",
            ArrowRight: "right",
            ArrowUp: "rotate",
        };
        if (event.key === " ") {
            for (let i = 0; i < gameOptions.height; i += 1) {
                move("down");
            }
            return;
        }
        const variant = variants[event.code];
        move(variant);
    };
    const eventType = "keydown";
    window.addEventListener(eventType, handler);
    return [eventType, handler];
};
reset.addEventListener("click", () => {
    game.reset();
});
game.run({
    render: renderCanvas,
    control,
});
