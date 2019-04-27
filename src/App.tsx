import React from 'react';
import './App.css';
import GridCalculator, { TileType, GamePosition } from './GridCalculator';
import { Player, Item } from './Player';
import { moveLeft, GameReducer, moveUp, moveDown, moveRight, release } from './stateManager';

const nipplejs = require('nipplejs')

function print(tiles: TileType[][]): string {
  return tiles
    .map(t => t.join(""))
    .join("<br/>")
}

export interface State {
  exits: GamePosition[]
  player: Player
  items: Item[]
  size: number
  walls: GamePosition[]

  score: number,
  exited: boolean
}

class App extends React.Component<{}, State> {
  joystickTimerId: NodeJS.Timeout | undefined
  maybeTouch: boolean = false

  constructor(props: any) {
    super(props)
    this.state = {
      size: 8,
      exited: false,
      score: 0,
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
      }],
      exits: [
        { x: 4, y: -1 },
        { x: 8, y: 7 },
        { x: 8, y: 6 },
        { x: -1, y: 2 },
        { x: 4, y: 8 }
      ]
    }
  }

  componentDidMount() {
    window.addEventListener('keydown', this.handleKeyDown)

    window.addEventListener('touchstart', this.handleTouchStart)
    window.addEventListener('touchmove', this.handleTouchMove)
    window.addEventListener('touchend', this.handleTouchEnd)

    var manager = nipplejs.create({
      color: "#000",
      dataOnly: true,
      fadeTime: 0,
    });

    manager.on('added', (evt: any, nipple: any) => {
      nipple.on('dir', this.handleJoystickMove)
      nipple.on('end', this.handleJoystickEnd)
    })
  }

  componentWillUnmount() {
    window.removeEventListener('keydown', this.handleKeyDown)
  }

  render() {
    let grid = GridCalculator(this.state)
    print(grid)

    return (
      <div className="App">
        <div id='score'>{this.state.score}</div>
        <div id='grid' dangerouslySetInnerHTML={{ __html: print(grid) }} />
        <button id='drop'>Drop</button>
      </div>
    );
  }

  handleJoystickMove = (e: any) => {
    if (this.joystickTimerId) {
      clearTimeout(this.joystickTimerId)
    }

    console.log(e.target.direction.angle)
    let keyMap: { [dir: string]: GameReducer } = {
      "up": moveUp,
      "down": moveDown,
      "left": moveLeft,
      "right": moveRight,
    }
    const result = keyMap[e.target.direction.angle];
    if (!result) {
      console.log("COULD NOT FIND HANDLER", e)
      return
    }

    const repeat = () => {
      this.setState(result(this.state))
      this.joystickTimerId = setTimeout(repeat, 150)
    }

    this.joystickTimerId = setTimeout(repeat, 300)

    this.setState(result(this.state))
  }

  handleJoystickEnd = (e: any) => {
    if (this.joystickTimerId) {
      clearTimeout(this.joystickTimerId)
    }
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

  didTapDrop = () => {
    this.setState(release(this.state))
  }

  handleTouchStart = (e: any) => {
    this.maybeTouch = true
  }

  handleTouchMove = (e: any) => {
    this.maybeTouch = false
  }

  handleTouchEnd = (e: any) => {
    if (this.maybeTouch) {
      this.didTapDrop()
    }
    this.maybeTouch = false
  }
}

export default App;
