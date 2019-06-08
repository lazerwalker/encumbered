import { GameAnimation } from "./GameAnimation";

export interface GameObject {
  x: number
  y: number

  key: string

  sprite: ((obj: GameObject) => string)
  currentAnimation?: GameAnimation

  health: number
}