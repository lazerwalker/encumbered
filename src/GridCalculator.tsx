import { State } from "./App";
import _ from "lodash";

export enum TileType {
  Floor = "&nbsp;",
  Wall = "█",
  Player = "<span style='background-color: #aaa'>@</span>",
  Door = "#",

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
  const { size, exits, walls, player } = state

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

  state.items.forEach(i => {
    safeSet(i.x, i.y, i.type)
  })

  state.player.items.forEach(i => {
    safeSet(i.x + state.player.x, i.y + state.player.y, i.heldType)
  })
  safeSet(player.x, player.y, TileType.Player)

  return result
}

// Coords of all room wall tiles, without the corridors
export function boundsCoordinates(state: State): GamePosition[] {
  let result: GamePosition[] = []

  for (let i = -1; i <= state.size; i++) {
    result.push({ x: -1, y: i })
    result.push({ x: state.size, y: i })
    result.push({ x: i, y: -1 })
    result.push({ x: i, y: state.size })
  }

  return _.differenceWith(result, state.exits, _.isEqual)
}

export function playerScoreForCurrentRoom(state: State): number {
  return state.player.items.length - 1
}