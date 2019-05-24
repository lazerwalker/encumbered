import { State } from "./App";
import _ from "lodash";

export enum TileType {
  Floor = "&nbsp;",
  Wall = "█",
  Player = "<span style='background-color: #aaa'>@</span>",
  Door = "#",

  Enemy = "<span style='color: red'>k</span>",
  EnemyTired = "<span style='color: darkred'>k</span>",

  ItemSword = "<span style='color: red'>†</span>",
  ItemMoney = "<span style='color: green'>$</span>",
  ItemNormal = "<span style='color: lightblue'>!</span>",
  ItemPush = "<span style='color: yellow'>O</span>",
  ItemBlock = "<span style='color: saddlebrown'>+</span>",


  HeldItemSword = "<span style='color: red; background-color: #aaa'>†</span>",
  HeldItemMoney = "<span style='color: green; background-color: #aaa'>$</span>",
  HeldItemNormal = "<span style='color: lightblue; background-color: #aaa'>!</span>",
  HeldItemPush = "<span style='color: yellow; background-color: #aaa'>O</span>",
  HeldItemBlock = "<span style='color: saddlebrown; background-color: #aaa''>+</span>",

  PlayerItem = "$",
  Item = "!",


  VerticalWall = "│",
  HorizontalWall = "─",
  TopLeftCorner = "┌",
  TopRightCorner = "┐",
  BottomLeftCorner = "└",
  BottomRightCorner = "┘",
}

export interface GamePosition {
  x: number, y: number
}

// (0, 0) is bottom-left
export default function (state: State): TileType[][] {
  const { size, enemies, tiredEnemies, exits, walls } = state.currentRoom
  const player = state.player

  let result: TileType[][] = []

  function safeSet(x: number, y: number, type: TileType) {
    if (x < -1
      || x > size
      || y < -1
      || y > size) { return }

    result[size - y][x + 1] = type
  }

  for (let i = 0; i <= size + 1; i++) {
    result[i] = []
    for (let j = 0; j <= size + 1; j++) {
      result[i][j] = TileType.Floor
    }
  }

  for (let i = -1; i <= size; i++) {
    safeSet(i, -1, TileType.HorizontalWall)
    safeSet(i, size, TileType.HorizontalWall)

    safeSet(-1, i, TileType.VerticalWall)
    safeSet(size, i, TileType.VerticalWall)
  }

  safeSet(-1, -1, TileType.BottomLeftCorner)
  safeSet(size, -1, TileType.BottomRightCorner)
  safeSet(-1, size, TileType.TopLeftCorner)
  safeSet(size, size, TileType.TopRightCorner)

  walls.forEach(w => {
    safeSet(w.x, w.y, TileType.Wall)
  })

  exits.forEach(e => {
    safeSet(e.x, e.y, TileType.Door)
  })

  state.currentRoom.items.forEach(i => {
    safeSet(i.x, i.y, i.type)
  })

  state.player.items.forEach(i => {
    safeSet(i.x + state.player.x, i.y + state.player.y, i.heldType)
  })
  safeSet(player.x, player.y, TileType.Player)

  tiredEnemies.forEach(e => {
    safeSet(e.x, e.y, TileType.EnemyTired)
  })

  enemies.forEach(e => {
    safeSet(e.x, e.y, TileType.Enemy)
  })

  return result
}

export interface RenderObject {
  tile: TileType
  x: number
  y: number
  key: string
}

/** Tech debt warning!
 * We originally rendered a grid (TileType[][]). To allow for animations, we now instead render specific objects
 * but currently maintain the old grid-calculation logic as a means of knowing which objects are visible
 * This should definitely be refactored.
 */

// (0, 0) is bottom-left
export function PrintGridCalculator(state: State): RenderObject[] {
  const { size, enemies, tiredEnemies, exits, walls } = state.currentRoom
  const player = state.player

  let result: { [pos: string]: RenderObject } = {}

  function safeSet(x: number, y: number, type: TileType, key: string) {
    if (x < -1
      || x > size
      || y < -1
      || y > size) { return }

    result[`${size - y},${x + 1}`] = {
      key,
      tile: type,
      y: size - y,
      x: x + 1
    }
  }

  for (let i = 0; i <= size + 1; i++) {
    for (let j = 0; j <= size + 1; j++) {
      safeSet(j, i, TileType.Floor, `floor-${i},${j}`)
    }
  }

  for (let i = -1; i <= size; i++) {
    safeSet(i, -1, TileType.HorizontalWall, `leftWall-${i}`)
    safeSet(i, size, TileType.HorizontalWall, `rightWall-${i}`)

    safeSet(-1, i, TileType.VerticalWall, `bottomWall-${i}`)
    safeSet(size, i, TileType.VerticalWall, `topWall-${i}`)
  }

  safeSet(-1, -1, TileType.BottomLeftCorner, 'bottomLeft')
  safeSet(size, -1, TileType.BottomRightCorner, 'bottomRight')
  safeSet(-1, size, TileType.TopLeftCorner, 'topLeft')
  safeSet(size, size, TileType.TopRightCorner, 'topRight')

  walls.forEach((w, idx) => {
    safeSet(w.x, w.y, TileType.Wall, w.key)
  })

  exits.forEach((e, idx) => {
    safeSet(e.x, e.y, TileType.Door, e.key)
  })

  state.currentRoom.items.forEach((i, idx) => {
    safeSet(i.x, i.y, i.type, i.key)
  })

  state.player.items.forEach((i, idx) => {
    safeSet(i.x + state.player.x, i.y + state.player.y, i.heldType, i.key)
  })

  safeSet(player.x, player.y, TileType.Player, player.key)

  tiredEnemies.forEach((e, idx) => {
    safeSet(e.x, e.y, TileType.EnemyTired, e.key)
  })

  enemies.forEach((e, idx) => {
    safeSet(e.x, e.y, TileType.Enemy, e.key)
  })

  // TODO: May need to do some work to ensure that enemies/tiredEnemies and items/heldItems maintain keys

  return Object.values(result).filter(o => o.tile !== TileType.Floor)
}


// Coords of all room wall tiles, without the corridors
export function boundsCoordinates(state: State): GamePosition[] {
  let result: GamePosition[] = []

  for (let i = -1; i <= state.currentRoom.size; i++) {
    result.push({ x: -1, y: i })
    result.push({ x: state.currentRoom.size, y: i })
    result.push({ x: i, y: -1 })
    result.push({ x: i, y: state.currentRoom.size })
  }

  const unkeyedExits = state.currentRoom.exits.map((e) => { return { x: e.x, y: e.y } })
  return _.differenceWith(result, unkeyedExits, _.isEqual)
}