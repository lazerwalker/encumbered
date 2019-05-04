import React from 'react';
import './App.css';
import GridCalculator, { TileType, GamePosition } from './GridCalculator';
import { Player, Item } from './Player';
import { moveLeft, GameReducer, moveUp, moveDown, moveRight, release, wait } from './stateManager';
import _ from 'lodash';
import { Room, generateRoom } from './Room';

const nipplejs = require('nipplejs')

function print(tiles: TileType[][]): string {
  return tiles
    .map(t => t.join(""))
    .join("<br/>")
}

export interface State {
  currentRoom: Room
  player: Player

  hp: number
  maxHP: number

  exited: boolean
  gameOver: boolean
}

class App extends React.Component<{}, State> {
  joystickTimerId: NodeJS.Timeout | undefined
  maybeTouch: boolean = false

  initialState: State
  undoStack: GameReducer[] = []

  constructor(props: any) {
    super(props)
    this.initialState = {
      exited: false,
      gameOver: false,
      hp: 3,
      maxHP: 3,
      player: {
        x: 2,
        y: 2,
        items: []
      },
      currentRoom: generateRoom({ x: -1, y: 4 })
    }

    this.state = _.cloneDeep(this.initialState)
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

    const score = this.state.player.items.filter(i => i.type === TileType.ItemMoney).length

    return (
      <div className="App">
        <div id='score-and-hp'>${score} | {this.state.hp}/{this.state.maxHP}</div>
        <div id='grid' dangerouslySetInnerHTML={{ __html: print(grid) }} />
        <button id='drop'>Drop</button>
      </div>
    );
  }

  perform = (action: GameReducer, state: State = this.state): State => {
    let result = action(state)

    if (!_.isEqual(result, state)) {
      this.undoStack.push(action)
    }

    // TODO: This should live elsewhere
    if (result.gameOver) {
      console.log(result, this.initialState)
      return _.cloneDeep(this.initialState)
    }

    return result
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
      this.setState(this.perform(result))
      this.joystickTimerId = setTimeout(repeat, 150)
    }

    this.joystickTimerId = setTimeout(repeat, 300)
    this.setState(this.perform(result))
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
      "Space": release,
      "Period": wait
    }

    if (e.code === 'KeyU' || e.code === "KeyZ") {
      let state = _.cloneDeep(this.initialState)
      this.undoStack.pop()
      for (let a of this.undoStack) {
        state = a(state)
      }
      this.setState(state)
      return
    }

    const result = keyMap[e.code];
    if (!result) {
      console.log("COULD NOT FIND HANDLER", e)
      return
    }

    this.setState(this.perform(result))
  }

  didTapDrop = () => {
    this.setState(this.perform(release))
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
