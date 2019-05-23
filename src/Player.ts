import { TileType } from "./GridCalculator";

export interface Player {
  x: number
  y: number

  key: string
  items: Item[]
}

export interface Item {
  type: TileType
  heldType: TileType

  key: string

  // By convention, (0, 0) is the bottom left of the item
  // If in the world, a map position
  // If on a player, an offset from the player tile
  x: number
  y: number
}