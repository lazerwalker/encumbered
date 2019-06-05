import { State } from "./State";
import _ from "lodash";
import { GameAnimation } from "./GameAnimation";

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
  const { size, enemies, exits } = state
  const player = state.player

  let result: { [pos: string]: RenderObject } = {}

  function safeSet(x: number, y: number, tile: string, key: string, isPlayer: boolean = false, animation?: GameAnimation) {
    if (x < -1
      || x > size
      || y < -1
      || y > size) { return }

    result[`${size - y},${x + 1}`] = {
      key,
      tile,
      y: size - y,
      x: x + 1,
      animation,
      isPlayer: isPlayer
    }
  }

  for (let i = -1; i <= size; i++) {
    safeSet(i, -1, TileType.HorizontalWall, `leftWall-${i}`)
    safeSet(i, size, TileType.HorizontalWall, `rightWall-${i}`)

    safeSet(-1, i, TileType.VerticalWall, `bottomWall-${i}`)
    safeSet(size, i, TileType.VerticalWall, `topWall-${i}`)
  }

  safeSet(-1, -1, TileType.BottomLeftCorner, 'bottomLeft')
  safeSet(size, -1, TileType.BottomRightCorner, 'bottomRight')
  safeSet(-1, size, TileType.TopLeftCorner, 'topLeft')
  safeSet(size, size, TileType.TopRightCorner, 'topRight')

  exits.forEach((e, idx) => {
    safeSet(e.x, e.y, TileType.Door, e.key)
  })

  state.items.forEach(i => {
    safeSet(i.x, i.y, i.tile!, i.key, i.held)
  })

  safeSet(player.x, player.y, player.sprite!, player.key, true)

  enemies.forEach(e => {
    // TODO: This loses 'stunned' state
    safeSet(e.x, e.y, e.tile!, e.key, false, e.currentAnimation)
  })

  // TODO: May need to do some work to ensure that enemies/tiredEnemies and items/heldItems maintain keys

  return Object.values(result)
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