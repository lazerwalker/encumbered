import { Player, Item } from "./Player";
import { State } from "./App";
import _ from "lodash";

export enum TileType {
  Floor = " ",
  Wall = "█",
  Player = "@",
  PlayerItem = "$",
  Item = "!"
}

export interface GamePosition {
  x: number, y: number
}

// (0, 0) is top-left
export default function (state: State): TileType[][] {
  const { size, walls, items, player } = state

  let result: TileType[][] = []

  for (let i = 0; i < size; i++) {
    result[i] = []
    for (let j = 0; j < size; j++) {
      result[i][j] = TileType.Floor
    }
  }

  walls.forEach(w => {
    result[size - 1 - w.y][w.x] = TileType.Wall
  })

  itemCoordinates(state).forEach(i => {
    result[size - 1 - i.y][i.x] = TileType.Item
  })

  playerItemCoordinates(state).forEach(i => {
    result[size - 1 - i.y][i.x] = TileType.PlayerItem
  })
  result[size - 1 - player.y][player.x] = TileType.Player

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