import { TileType } from "./GridCalculator";

export interface Player {
  x: number
  y: number

  items: Item[]
}

export interface Item {
  // By convention, (0, 0) is the bottom left of the item
  coordinates: { x: number, y: number }[]

  type: TileType
  heldType: TileType

  // If in the world, (x, y) is where the origin is on the map
  // If on a player, this will be an offset from the player tile
  x: number
  y: number
}
