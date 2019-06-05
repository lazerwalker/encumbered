import { TileType } from "./renderGrid";
import uuid from "./uuid";
import { GameObject } from "./GameObject";

export interface Item extends GameObject {
  type: TileType

  held: boolean

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