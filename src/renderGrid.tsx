import { State } from "./State";
import _ from "lodash";
import { GameAnimation } from "./GameAnimation";
import { GameObject } from "./GameObject";
import { Item } from "./Item";
import { Enemy } from "./Enemy";

export enum TileType {
  Door = "#",

  Enemy = "K",
  EnemyTired = "k",

  Sword = "†",
  Money = "$",
  Potion = "!",
  Wand = "/",
  Shield = "]",
  UnknownItem = "?",

  VerticalWall = "│",
  HorizontalWall = "─",
  TopLeftCorner = "┌",
  TopRightCorner = "┐",
  BottomLeftCorner = "└",
  BottomRightCorner = "┘",
}

export interface GamePosition {
  x: number, y: number
}


export interface RenderObject {
  tile: string
  isPlayer: boolean
  x: number
  y: number
  key: string
  animation?: GameAnimation
}


// (0, 0) is bottom-left
export default function renderGrid(state: State): RenderObject[] {
  const { size, enemies, exits, player, items } = state

  function toRenderObject(obj: GameObject): RenderObject {
    let isPlayer = false
    if ((obj as Item).held) {
      isPlayer = (obj as Item).held
    }

    if (obj.key === "player") {
      isPlayer = true
    }

    let animation: GameAnimation | undefined
    if ((obj as Enemy).currentAnimation) {
      animation = (obj as Enemy).currentAnimation
    }

    return {
      x: obj.x + 1,
      y: size - obj.y,
      key: obj.key,
      isPlayer,
      animation,
      tile: obj.sprite(obj)
    }
  }

  function makeWall(x: number, y: number, sprite: string, key: string): GameObject | undefined {
    if (_.find(exits, e => e.x === x && e.y === y)) {
      return
    } else {
      return {
        x, y, key,
        sprite: (obj) => sprite
      }
    }
  }

  const gameObjects: (GameObject | undefined)[] = [player, ...exits, ...enemies, ...items]

  for (let i = 0; i <= size - 1; i++) {
    gameObjects.push(makeWall(i, -1, "wall-horizontal.png", `bottomWall-${i}`))
    gameObjects.push(makeWall(i, size, "wall-horizontal.png", `topWall-${i}`))

    gameObjects.push(makeWall(-1, i, "wall-vertical.png", `leftWall-${i}`))
    gameObjects.push(makeWall(size, i, "wall-vertical.png", `rightWall-${i}`))
  }

  gameObjects.push(makeWall(-1, -1, "wall-bottom-left.png", 'bottomLeft'))
  gameObjects.push(makeWall(size, -1, "wall-bottom-right.png", 'bottomRight'))
  gameObjects.push(makeWall(-1, size, "wall-top-left.png", 'topLeft'))
  gameObjects.push(makeWall(size, size, "wall-top-right.png", 'topRight'))

  let trimmedObjects: GameObject[] = gameObjects.filter(o => !_.isUndefined(o)) as GameObject[]

  return trimmedObjects
    .map(toRenderObject)
    .filter(r => {
      return (r.x >= 0
        && r.x <= size + 1
        && r.y >= 0
        && r.y <= size + 1)
    })
}


// Coords of all room wall tiles, without the corridors
export function boundsCoordinates(state: State): GamePosition[] {
  let result: GamePosition[] = []

  for (let i = -1; i <= state.size; i++) {
    result.push({ x: -1, y: i })
    result.push({ x: state.size, y: i })
    result.push({ x: i, y: -1 })
    result.push({ x: i, y: state.size })
  }

  const unkeyedExits = state.exits.map((e) => { return { x: e.x, y: e.y } })
  return _.differenceWith(result, unkeyedExits, _.isEqual)
}