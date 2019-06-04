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

  // Not all item types have charges, but I think this is a useful abstraction?
  charges: number
}

/** Please please please pass in at least x, y, tile, type. */
export function ItemFactory(props: any): Item {
  return {
    x: -1, y: -1, tile: " ", type: TileType.UnknownItem,
    ...props,
    key: uuid(),
    held: false
  }
}