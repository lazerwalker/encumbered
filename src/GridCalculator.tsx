import { Player, Item } from "./Player";
import { State } from "./App";
import _ from "lodash";
import { switchStatement } from "@babel/types";

export enum TileType {
  Floor = "&nbsp;",
  Wall = "█",
  Player = "<span style='background-color: #aaa'>@</span>",
  Door = "#",

  ItemSword = "<span style='color: red'>†</span>",
  ItemFragile = "<span style='color: green'>$</span>",
  ItemNormal = "<span style='color: lightblue'>!</span>",
  ItemNoAttach = "<span style='color: yellow'>☯</span>",

  HeldItemSword = "<span style='color: red; background-color: #aaa'>†</span>",
  HeldItemFragile = "<span style='color: green; background-color: #aaa'>$</span>",
  HeldItemNormal = "<span style='color: lightblue; background-color: #aaa'>!</span>",
  HeldItemNoAttach = "<span style='color: yellow; background-color: #aaa'>☯</span>",

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

  itemPositions(state).forEach(i => {
    safeSet(i.x, i.y, i.type)
  })

  playerItemPositions(state).forEach(i => {
    safeSet(i.x, i.y, i.heldType)
  })
  safeSet(player.x, player.y, TileType.Player)

  return result
}

export function coordinatesForItem(item: Item): GamePosition[] {
  let result: GamePosition[] = []

  item.coordinates.forEach(c => {
    result.push({ y: item.y + c.y, x: item.x + c.x })
  })

  return result
}

export function pickUpItem(player: Player, item: Item): Item {
  return {
    ...item,
    x: item.x - player.x,
    y: item.y - player.y
  }
}

export function dropItem(player: Player, item: Item): Item {
  return {
    ...item,
    x: item.x + player.x,
    y: item.y + player.y
  }
}

/** HOPEFULLY TEMPORARY HACK */
// This distinction between a GamePosition and an ItemPosition (the latter of which has a tile) is bad.
interface ItemPosition {
  x: number
  y: number
  heldType: TileType
  type: TileType
}

export function itemPositions(state: State): ItemPosition[] {
  return _.flatten(state.items.map(positionsForItem))
}

export function itemCoordinates(state: State): GamePosition[] {
  return _.flatten(state.items.map(coordinatesForItem))
}

export function positionsForItem(item: Item): ItemPosition[] {
  let result: ItemPosition[] = []

  item.coordinates.forEach(c => {
    result.push({
      y: item.y + c.y,
      x: item.x + c.x,
      type: item.type,
      heldType: item.heldType
    })
  })

  return result
}

export function playerItemPositions(state: State): ItemPosition[] {
  let result: ItemPosition[] = []

  state.player.items.forEach(i => {
    i.coordinates.forEach(c => {
      result.push({
        x: state.player.x + i.x + c.x,
        y: state.player.y + i.y + c.y, type: i.type,
        heldType: i.heldType
      })
    })
  })

  return result
}

/** END HACK */

export function playerItemCoordinates(state: State): GamePosition[] {
  let result: GamePosition[] = []

  state.player.items.forEach(i => {
    i.coordinates.forEach(c => {
      result.push({ y: state.player.y + i.y + c.y, x: state.player.x + i.x + c.x })
    })
  })

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
  return _(state.player.items)
    .map(i => i.coordinates.length)
    .sum() - 1
}