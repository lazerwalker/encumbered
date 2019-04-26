import { Player, Item } from "./Player";
import { State } from "./App";
import _ from "lodash";

export enum TileType {
  Floor = " ",
  Wall = "█",
  Player = "@",
  PlayerItem = "$",
  Item = "!",
  Door = "#",

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

  for (let i = 0; i <= size + 1; i++) {
    result[i] = []
    for (let j = 0; j <= size + 1; j++) {
      result[i][j] = TileType.Floor
    }
  }

  for (let i = 0; i <= size; i++) {
    result[0][i] = TileType.HorizontalWall
    result[size + 1][i] = TileType.HorizontalWall

    result[i][0] = TileType.VerticalWall
    result[i][size + 1] = TileType.VerticalWall
  }

  result[size + 1][0] = TileType.BottomLeftCorner
  result[size + 1][size + 1] = TileType.BottomRightCorner
  result[0][0] = TileType.TopLeftCorner
  result[0][size + 1] = TileType.TopRightCorner

  walls.forEach(w => {
    result[size - w.y][w.x + 1] = TileType.Wall
  })

  exits.forEach(e => {
    result[size - e.y][e.x + 1] = TileType.Door
  })

  itemCoordinates(state).forEach(i => {
    result[size - i.y][i.x + 1] = TileType.Item
  })

  playerItemCoordinates(state).forEach(i => {
    result[size - i.y][i.x + 1] = TileType.PlayerItem
  })
  result[size - player.y][player.x + 1] = TileType.Player

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

export function itemCoordinates(state: State): GamePosition[] {
  return _.flatten(state.items.map(coordinatesForItem))
}

export function playerItemCoordinates(state: State): GamePosition[] {
  let result: GamePosition[] = []

  state.player.items.forEach(i => {
    i.coordinates.forEach(c => {
      result.push({ y: state.player.y + i.y + c.y, x: state.player.x + i.x + c.x })
    })
  })

  return result
}