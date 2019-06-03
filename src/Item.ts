import { TileType } from "./GridCalculator";
import uuid from "./uuid";

export interface Item {
  type: TileType
  heldType: TileType

  key: string

  held: boolean

  // By convention, (0, 0) is the bottom left of the item
  // If in the world, a map position
  // If on a player, an offset from the player tile
  x: number
  y: number
}

export function ItemFactory(x: number, y: number, type: TileType, heldType: TileType) {
  return {
    x,
    y,
    type,
    heldType,

    key: uuid(),
    held: false
  }
}