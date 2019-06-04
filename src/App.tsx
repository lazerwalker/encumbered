import React from 'react';
import './App.css';
import { TileType, RenderObject, PrintGridCalculator } from './GridCalculator';
import { reducer } from './reducer';
import _ from 'lodash';
import EditorButton from './components/EditorButton'
import uuid from './uuid';
import GridSymbol from './components/GridSymbol'
import { State } from './State';
import { EnemyFactory } from './Enemy';
import { ItemFactory } from './Item';
import { generateDungeon, dungeonRoomAt } from './Dungeon';
import { Action, ActionType } from './actions';

const nipplejs = require('nipplejs')

// TODO: Looool, this should be properly React Component-ified
const printGrid = (props: { tiles: RenderObject[], size: number, onClick: (x: number, y: number) => void }) => {
  let grid = []
  for (let i = 0; i < props.size + 2; i++) {
    let row = []
    for (let j = 0; j < props.size + 2; j++) {
      row.push(<span
        className="bg"
        key={`empty-${i},${j}`}
        data-x={j - 1}
        data-y={props.size - i}
        onTouchStart={() => props.onClick(j - 1, props.size - i)}
        onClick={() => props.onClick(j - 1, props.size - i)}
      >&nbsp;</span>)
    }
    grid.push(<div key={`row-${i}`}>{row}</div>)
  }

  // TODO: We need to sort this in order for animations to work.
  // That's a small our key logic isn't working properly.
  const objects = _.sortBy(props.tiles, t => t.key)
    .map(obj => {
      return <GridSymbol obj={obj} key={obj.key} />
    })

  return <div id='grid'>{grid}{objects}</div>
}

class App extends React.Component<{}, State> {
  joystickTimerId: NodeJS.Timeout | undefined
  maybeTouch: boolean = false

  initialState: State
  undoStack: Action[] = []

  constructor(props: any) {
    super(props)

    const dungeon = generateDungeon()
    const room = dungeonRoomAt(dungeon, { x: 1, y: 1 })

    this.initialState = {
      exited: false,
      gameOver: false,
      hp: 3,
      maxHP: 3,
      player: {
        x: 2,
        y: 2,
        key: "player"
      },
      enemies: room.enemies,
      items: room.items,
      size: room.size,
      exits: room.exits,


      dungeon,
      currentRoom: room
    }

    this.state = _.cloneDeep(this.initialState)
  }

  componentDidMount() {
    window.addEventListener('keydown', this.handleKeyDown)

    // This touch detector stolen from Modernizr
    // Detecting touch this way is normally a bad idea!
    // in our case, I don't want to allow joystick movement on non-touch.
    const isTouch = (
      ('ontouchstart' in window) ||
      (window as any).TouchEvent ||
      ((window as any).DocumentTouch && document instanceof (window as any).DocumentTouch)
    )

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
    const grid = printGrid({ tiles: PrintGridCalculator(this.state), size: this.state.size, onClick: this.handleEditorBoardClick })

    const score = this.state.items.filter(i => i.held && i.type === TileType.ItemMoney).length

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

  dispatch = (state: State, action: Action, addToStack: boolean = true): State => {
    let result = reducer(state, action)

    if (addToStack && !_.isEqual(result, state)) {
      this.undoStack.push(action)
    }

    // TODO: This should live elsewhere
    if (result.gameOver) {
      console.log(result, this.initialState)
      return _.cloneDeep(this.initialState)
    }

    return result
  }

  replayedDispatch = (state: State, action: Action): State => {
    return this.dispatch(state, action, false)
  }

  handleJoystickMove = (e: any) => {
    if (this.joystickTimerId) {
      clearTimeout(this.joystickTimerId)
    }

    let keyMap: { [dir: string]: Action } = {
      "up": { type: ActionType.MoveUp },
      "down": { type: ActionType.MoveDown },
      "left": { type: ActionType.MoveLeft },
      "right": { type: ActionType.MoveRight },
    }
    const result = keyMap[e.target.direction.angle];
    if (!result) {
      console.log("COULD NOT FIND ACTION", e)
      return
    }

    const repeat = () => {
      this.setState(this.dispatch(this.state, result))
      this.joystickTimerId = setTimeout(repeat, 150)
    }

    this.joystickTimerId = setTimeout(repeat, 300)
    this.setState(this.dispatch(this.state, result))
  }

  handleJoystickEnd = (e: any) => {
    if (this.joystickTimerId) {
      clearTimeout(this.joystickTimerId)
    }
  }

  handleKeyDown = (e: KeyboardEvent) => {
    let keyMap: { [keyCode: string]: Action } = {
      "ArrowUp": { type: ActionType.MoveUp },
      "ArrowDown": { type: ActionType.MoveDown },
      "ArrowLeft": { type: ActionType.MoveLeft },
      "ArrowRight": { type: ActionType.MoveRight },
      "Space": { type: ActionType.Release },
      "Period": { type: ActionType.Wait }
    }

    if (e.code === 'KeyU' || e.code === "KeyZ") {
      let state = _.cloneDeep(this.initialState)
      this.undoStack.pop()
      for (let a of this.undoStack) {
        state = this.replayedDispatch(state, a)
      }
      this.setState(state)
      return
    }

    const result = keyMap[e.code];
    if (!result) {
      console.log("COULD NOT FIND HANDLER", e)
      return
    }

    this.setState(this.dispatch(this.state, result))
  }

  didTapDrop = () => {
    this.setState(this.dispatch(this.state, { type: ActionType.Release }))
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
      const enemies = [...this.state.enemies, EnemyFactory(x, y)]
      this.setState({
        selectedEditorButton: undefined,
        enemies
      })
    } else if (type === TileType.Door) {
      const exits = [...this.state.exits, { x, y, key: uuid() }]
      this.setState({
        selectedEditorButton: undefined,
        exits
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

      const item = ItemFactory(x, y, type, heldType(type))
      const items = [...this.state.items, item]
      this.setState({
        selectedEditorButton: undefined,
        items
      })
    }
  }
}

export default App;
