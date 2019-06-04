import { TileType } from "./renderGrid";
import uuid from "./uuid";

export interface Item {
  type: TileType

  key: string

  held: boolean

  // By convention, (0, 0) is the bottom left of the item
  // If in the world, a map position
  // If on a player, an offset from the player tile
  x: number
  y: number

  // A single (non-HTML) character for now, will swap out with an image
  tile: string
}

export function ItemFactory(x: number, y: number, tile: string, type: TileType) {
  return {
    x,
    y,
    tile,
    type,

    key: uuid(),
    held: false
  }
}