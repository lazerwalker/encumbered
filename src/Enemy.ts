import uuid from "./uuid";
import { State } from "./State";
import GridCalculator, { TileType } from "./GridCalculator";
import _ from "lodash";

const { astar, Graph } = require('javascript-astar')

export interface Enemy {
  x: number
  y: number

  key: string

  stunned: boolean
  stunnedThisTurn: boolean
}

export function moveEnemy(state: State, e: Enemy): State {
  let passableTypes = [
    TileType.Floor,
    TileType.Player,

    TileType.Door,

    TileType.HeldItemBlock,
    TileType.HeldItemMoney,
    TileType.HeldItemNormal,
    TileType.HeldItemPush
  ]

  const newState = _.cloneDeep(state)
  const enemy = newState.enemies.find(e => e.key === e.key)
  if (!enemy) return state

  // Tired enemies ready up
  if (enemy.stunned && !enemy.stunnedThisTurn) {
    enemy.stunned = false
    return newState
  }

  // Before moving:
  // It's possible that the player moved one of their items into the enemy.
  // If that's the case, resolve that rather than do anything fancier.
  // (We could resolve this when we resolve item movement, but that also feels weird?)
  const item = state.items.find(i => i.held && i.x === enemy.x && i.y === enemy.y)
  if (item) {
    console.log("Tiring out")
    enemy.stunned = true
    newState.items = _.without(state.items, item)
    return newState
  }


  // Okay, now that's over with, let's do normal pathfinding.

  // TODO: Here's where the frustrating math changes need to go to allow players to be in doorways
  let graph: number[][] = [[]]
  let grid = GridCalculator(state)
  for (let i = 0; i < grid.length; i++) {
    graph.push([])
    for (let j = 0; j < grid[i].length; j++) {
      if (_.includes(passableTypes, grid[i][j])) {
        graph[i][j] = 1
      } else {
        graph[i][j] = 0
      }
    }
  }
  graph = graph.reverse() // Our y-axis is reversed
  graph.shift()


  // console.log("%cPathfinding Grid", "font-weight: bold")
  // console.log(`%c${graph.map((g, i) => `${i}: ${g.join("")}`).join("\n")}`, "font-family: monospace")
  let searchGraph = new Graph(graph)

  // console.log(`(${state.player.x}, ${state.player.y})`, `(${enemy.x}, ${enemy.y})`)
  const result = astar.search(
    searchGraph,
    searchGraph.grid[enemy.y + 1][enemy.x + 1],
    searchGraph.grid[state.player.y + 1][state.player.x + 1],
    { heuristic: astar.heuristics.manhattan }
  );

  // console.log(result.map((r: any) => `(${r.x}, ${r.y})`).join(" "))

  if (result.length > 0) {
    const newPos = { x: result[0].y - 1, y: result[0].x - 1 }
    const oldPos = { x: enemy.x, y: enemy.y }

    enemy.x = newPos.x
    enemy.y = newPos.y
    console.log(newPos)

    if (newState.player.x === enemy.x && newState.player.y === enemy.y) {
      newState.hp -= 1
      enemy.x = oldPos.x
      enemy.y = oldPos.y
      if (newState.hp <= 0) {
        newState.gameOver = true
      }
    }

    const item = newState.items.find(i => i.held && i.x === enemy.x && i.y === enemy.y)
    if (item) {
      console.log("Found item")
      enemy.x = oldPos.x
      enemy.y = oldPos.y
      enemy.stunned = true
      newState.items = _.without(newState.items, item)
    }
  }

  enemy.stunnedThisTurn = false

  return newState
}

export function EnemyFactory(x: number, y: number) {
  return {
    x,
    y,
    stunned: false,
    stunnedThisTurn: false,
    key: uuid()
  }
}