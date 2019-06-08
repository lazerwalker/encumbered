import { GameObject } from "./GameObject";
import uuid from "./uuid";

const sprite = () => { return "hash.png" }

export function ExitFactory(x: number, y: number): GameObject {
  return {
    x,
    y,
    sprite: sprite,
    key: uuid()
  }
}