import { Player, Item } from "./Player";
import { State } from "./App";

export enum TileType {
  Floor = " ",
  Wall = "█",
  Player = "@",
  PlayerItem = "$",
  Item = "!"
}

interface Position {
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
    result[w.y][w.x] = TileType.Wall
  })

  items.forEach(i => {
    i.coordinates.forEach(c => {
      result[i.y + c.y][i.x + c.x] = TileType.Item
    })
  })

  player.items.forEach(i => {
    i.coordinates.forEach(c => {
      result[player.y + i.y + c.y][player.x + i.x + c.x] = TileType.PlayerItem
    })
  })
  result[player.y][player.x] = TileType.Player

  return result
}