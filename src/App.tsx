import React from 'react';
import './App.css';
import GridCalculator, { TileType } from './GridCalculator';
import { Player, Item } from './Player';
import { moveLeft, GameReducer, moveUp, moveDown, moveRight, release } from './stateManager';

function print(tiles: TileType[][]): string {
  return tiles
    .map(t => t.join(""))
    .join("\n")
}

export interface State {
  player: Player
  walls: { x: number, y: number }[]
  items: Item[]
  size: number
}

class App extends React.Component<{}, State> {
  constructor(props: any) {
    super(props)
    this.state = {
      size: 8,
      player: {
        x: 2,
        y: 2,
        items: [{
          x: 1,
          y: 0,
          coordinates: [
            { x: 0, y: 0 },
            { x: 0, y: -1 },
            { x: 1, y: 0 },
            { x: 1, y: -1 }
          ]
        }
        ]
      },
      walls: [
        { x: 0, y: 0 },
        { x: 1, y: 0 }
      ],
      items: [{
        x: 4,
        y: 4,
        coordinates: [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
          { x: 1, y: 1 }
        ]
      }]
    }
  }

  componentDidMount() {
    window.addEventListener('keydown', this.handleKeyDown)
  }

  componentWillUnmount() {
    window.removeEventListener('keydown', this.handleKeyDown)
  }

  render() {
    let grid = GridCalculator(this.state)
    print(grid)

    return (
      <div className="App">
        <pre>
          {print(grid)}
        </pre>
      </div>
    );
  }

  handleKeyDown = (e: KeyboardEvent) => {
    let keyMap: { [keyCode: string]: GameReducer } = {
      "ArrowUp": moveUp,
      "ArrowDown": moveDown,
      "ArrowLeft": moveLeft,
      "ArrowRight": moveRight,
      "Space": release
    }
    const result = keyMap[e.code];
    if (!result) {
      console.log("COULD NOT FIND HANDLER", e)
      return
    }

    this.setState(result(this.state))
  }
}

export default App;
