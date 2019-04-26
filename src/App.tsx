import React from 'react';
import logo from './logo.svg';
import './App.css';
import GridCalculator, { TileType } from './GridCalculator';
import { Player, Item } from './Player';

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
        { x: 1, y: 1 },
        { x: 2, y: 1 }
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
}

export default App;
