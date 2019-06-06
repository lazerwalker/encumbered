import { GameObject } from "./GameObject";

export function PlayerFactory(x: number, y: number): GameObject {
  return {
    x, y,
    key: "player",
    sprite: () => "@.png"
  }
}