import { TileType } from "./renderGrid";
import uuid from "./uuid";
import { GameObject } from "./GameObject";

export interface Item extends GameObject {
  type: TileType

  held: boolean

  // Not all item types have charges, but I think this is a useful abstraction?
  charges: number
}

const sprite = (obj: GameObject) => {
  let i = obj as Item

  const map: { [key: string]: string } = {
    [TileType.Sword]: "sword.png",
    [TileType.Shield]: "shield.png",
    [TileType.Money]: "shield.png", // TODO,
    [TileType.Wand]: "shield.png" // TODO
  }

  if (i.type === TileType.Potion) {
    // TODO: We eventually want a better system for special-casing these functions
    if (i.charges === 0) {
      return "potion-empty.png"
    } else if (i.charges === 1) {
      return "potion-half.png"
    } else {
      return "potion-full.png"
    }
  } else {
    return map[i.type]
  }
}
/** Please please please pass in at least x, y, tile, type. */
export function ItemFactory(props: any): Item {
  return {
    x: -1, y: -1, tile: " ", type: TileType.UnknownItem,
    ...props,
    key: uuid(),
    sprite: sprite,
    held: false,
    health: 1
  }
}