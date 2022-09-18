import logo from "./logo.svg";
import "./App.css";
import { useEffect, useState } from "react";

const createGrid = (gridSize) => {
  let idx = 0;
  return Array.from({ length: gridSize }).map(() =>
    Array.from({ length: gridSize }).map(() => {
      return idx++;
    })
  );
};

const gridSize = 20;
const grid = createGrid(gridSize);
const maze = Array.from({ length: gridSize * gridSize }).map(() => ({
  isMaze: false,
  nextIdx: 0,
}));
maze[0].isMaze = true;
maze[0].nextIdx = 1;
const gridMaxIdx = 20 * 20 - 1;

const initGameState = {
  gridSize,
  grid,
  gridMaxIdx,
  maze,
  enemies: [],
  tick: 1000 / 60,
  tickCount: 0,
};

const newEnemy = (overrides = {}) => {
  return { idx: 0, idxPrev: null, speed: 0.25, increment: 0, ...overrides };
};

const traverseMaze = (maze, start, steps) => {
  let idx = start;
  while (steps--) {
    idx = maze[idx].nextIdx;
  }

  return maze[idx]?.isMaze ? idx : Number.MAX_VALUE;
};

const enemiesTick = (enemies) => {
  const tick = 1000 / 60;
  enemies.forEach((e) => {
    const increment = e.increment;
    // increment / second
    const delta = e.speed / tick;
    const newVal = increment + delta;

    const deltaIdx = Math.floor(newVal);

    const newIncrement = newVal - deltaIdx;
    e.increment = newIncrement;
    e.idx = traverseMaze(maze, e.idx, deltaIdx);
  });

  return enemies.filter((e) => e.idx < gridMaxIdx);
};

const gameTick = (gameState) => {
  return {
    enemies: enemiesTick(gameState.enemies),
    tickCount: gameState.tickCount + 1,
  };
};

const useGameLoop = (gameState, setGameState) => {
  useEffect(() => {
    const gameIntervalId = setInterval(() => {
      setGameState((gameState) => ({
        ...gameState,
        ...gameTick(gameState),
      }));
    }, gameState.tick);

    return () => clearInterval(gameIntervalId);
  }, [gameState.tick]);
};

const gridSearch = (idx) => {
  if (idx === undefined) throw Error('BRO!')
  const vals = [idx - 1, idx + 1];
  // this includes diagonals
  // [-1, 0, 1].forEach((i) => {
  //   vals.push(idx - gridSize + i);
  //   vals.push(idx + gridSize + i);
  // });

  // this is only up/down or left/right
  [-1, 1].forEach((i) => {
    vals.push(idx + gridSize * i);
    vals.push(idx + i);
  });

  return vals.filter((i) => i >= 0 && i <= gridMaxIdx);
};

function App() {
  const [gameState, setGameState] = useState({ ...initGameState });

  useGameLoop(gameState, setGameState);

  return (
    <div className="App">
      {/* <p>HI!</p> */}
      <div style={{ fontFamily: "monospace" }}>
        {gameState.grid.map((row, rowIdx) => (
          <div key={rowIdx}>
            {row.map((col, colIdx) => {
              const idx = rowIdx * gameState.gridSize + colIdx;
              const count = gameState.enemies.filter(
                (e) => e.idx === idx
              ).length;
              return (
                <div key={colIdx + rowIdx}
                className="gridTile"
                  onClick={() => {
                    if (!maze[idx].isMaze) {
                      for (const searchIdx of gridSearch(idx)) {
                        if (maze[searchIdx].isMaze) {
                          maze[searchIdx].nextIdx = idx;
                          maze[idx].isMaze = true;
                          return;
                        }
                      }
                    } else {
                      maze[idx].isMaze = !maze[idx].isMaze;
                    }
                  }}
                  style={{
                    display: "inline",
                    background: maze[idx].isMaze && "red",
                  }}
                >{`[${count}]`}</div>
              );
            })}
          </div>
        ))}
      </div>
      <header className="App-header">
        <h3>{`Welcome to Game! ${gameState.tickCount}`}</h3>
        <button
          onClick={() =>
            setGameState((gameState) => ({
              ...gameState,
              enemies: [...gameState.enemies, newEnemy()],
            }))
          }
        >
          Add Normal
        </button>
        <button
          onClick={() =>
            setGameState((gameState) => ({
              ...gameState,
              enemies: [...gameState.enemies, newEnemy({ speed: 0.1 })],
            }))
          }
        >
          Add Slow
        </button>
        <pre>{`Enemies ${JSON.stringify(gameState.enemies, null, 2)}`}</pre>
        <pre>{JSON.stringify(filteredMaze().pick('nextIdx'), null, 2)}</pre>
        <pre>{JSON.stringify(maze, null, 2)}</pre>
      </header>
    </div>
  );
}

Array.prototype.pick = function (key) {
  return this.map((v) => v[key]);
};

Array.prototype.filterBy = function (key, value) {
  return this.filter((v) => v[key] === value);
};

const filteredMaze = () => {
  return maze.filter((t) => t.isMaze);
};

export default App;
