export interface GameObject {
  x: number
  y: number

  key: string

  sprite: ((obj: GameObject) => string)

  health: number
}