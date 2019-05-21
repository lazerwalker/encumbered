import React from 'react';
import './App.css';
import GridCalculator, { TileType } from './GridCalculator';
import { Player } from './Player';
import { moveLeft, GameReducer, moveUp, moveDown, moveRight, release, wait } from './stateManager';
import _ from 'lodash';
import { Room, generateRoom } from './Room';
import EditorButton from './components/EditorButton'
import { Dungeon, generateDungeon, dungeonRoomAt } from './Dungeon';

const nipplejs = require('nipplejs')

// TODO: Looool, this should be properly React Component-ified
const printGrid = (props: { tiles: TileType[][], size: number, onClick: (x: number, y: number) => void }) => {
  const grid = props.tiles.map((row, rowIdx) => {
    const mappedRow = row.map((tile, colIdx) => {
      return <span
        data-x={colIdx - 1}
        data-y={props.size - rowIdx}
        dangerouslySetInnerHTML={{ __html: tile }}
        onTouchStart={() => props.onClick(colIdx - 1, props.size - rowIdx)}
        onClick={() => props.onClick(colIdx - 1, props.size - rowIdx)}
      />
    })
    return <div>{mappedRow}</div>
  })

  return <div id='grid'>{grid}</div>
}

export interface State {
  player: Player

  hp: number
  maxHP: number

  exited: boolean
  gameOver: boolean

  dungeon: Dungeon
  currentRoom: Room

  selectedEditorButton?: TileType
}

class App extends React.Component<{}, State> {
  joystickTimerId: NodeJS.Timeout | undefined
  maybeTouch: boolean = false

  initialState: State
  undoStack: GameReducer[] = []

  constructor(props: any) {
    super(props)

    const dungeon = generateDungeon()

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
      dungeon,
      currentRoom: dungeonRoomAt(dungeon, { x: 1, y: 1 })
    }

    console.log(dungeon.rooms)
    this.state = _.cloneDeep(this.initialState)
  }

  componentDidMount() {
    window.addEventListener('keydown', this.handleKeyDown)

    // This touch detector stolen from Modernizr
    // Detecting touch this way is normally a bad idea!
    // in our case, I don't want to allow joystick movement on non-touch.
    const isTouch = (('ontouchstart' in window) || (window as any).TouchEvent || (window as any).DocumentTouch && document instanceof (window as any).DocumentTouch)

    if (isTouch) {
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
  }

  componentWillUnmount() {
    window.removeEventListener('keydown', this.handleKeyDown)
  }

  render() {
    const grid = printGrid({ tiles: GridCalculator(this.state), size: this.state.currentRoom.size, onClick: this.handleEditorBoardClick })

    const score = this.state.player.items.filter(i => i.type === TileType.ItemMoney).length

    const editorButtons = [
      TileType.Player,
      TileType.Enemy,
      TileType.ItemBlock,
      TileType.ItemMoney,
      TileType.ItemNormal,
      TileType.ItemSword,
      TileType.Wall,
      TileType.Door
    ].map(t => <EditorButton type={t} onClick={this.handleEditorButtonClick} selected={this.state.selectedEditorButton === t} />)

    return (
      <div className="App">
        <div id='score-and-hp'>${score} | {this.state.hp}/{this.state.maxHP}</div>
        {grid}

        <div id='level-editor'>
          {editorButtons}
        </div>
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

  handleEditorButtonClick = (t: TileType) => {
    this.setState({ selectedEditorButton: t })
  }

  handleEditorBoardClick = (x: number, y: number) => {
    const type = this.state.selectedEditorButton
    if (!type) return

    if (type === TileType.Player) {
      this.setState({
        selectedEditorButton: undefined,
        player: { ...this.state.player, x, y }
      })
    } else if (type === TileType.Enemy) {
      const enemies = [...this.state.currentRoom.enemies, { x, y, type }]
      this.setState({
        selectedEditorButton: undefined,
        currentRoom: { ...this.state.currentRoom, enemies }
      })
    } else if (type === TileType.Door) {
      const exits = [...this.state.currentRoom.exits, { x, y }]
      this.setState({
        selectedEditorButton: undefined,
        currentRoom: { ...this.state.currentRoom, exits }
      })
    } else if (type === TileType.Wall) {
      const walls = [...this.state.currentRoom.walls, { x, y }]
      this.setState({
        selectedEditorButton: undefined,
        currentRoom: { ...this.state.currentRoom, walls }
      })
    } else {
      const heldType = (type: TileType): TileType => {
        if (type === TileType.ItemBlock) return TileType.HeldItemBlock
        if (type === TileType.ItemNormal) return TileType.HeldItemNormal
        if (type === TileType.ItemMoney) return TileType.HeldItemMoney
        if (type === TileType.ItemSword) return TileType.HeldItemSword
        if (type === TileType.ItemPush) return TileType.HeldItemPush
        return type
      }

      const item = { x, y, type, heldType: heldType(type) }
      const items = [...this.state.currentRoom.items, item]
      this.setState({
        selectedEditorButton: undefined,
        currentRoom: { ...this.state.currentRoom, items }
      })
    }
  }
}

export default App;
