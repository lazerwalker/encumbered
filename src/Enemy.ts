import uuid from "./uuid";
import { State } from "./State";
import { GamePosition, boundsCoordinates } from "./renderGrid";
import _ from "lodash";
import { GameAnimation } from "./GameAnimation";
import { GameObject } from "./GameObject";

const { astar, Graph } = require('javascript-astar')

export interface Enemy extends GameObject {
  stunned: boolean
  stunnedThisTurn: boolean

  currentAnimation?: GameAnimation
}

export function moveEnemy(state: State, e: Enemy): State {
  const newState = _.cloneDeep(state)
  const enemy = newState.enemies.find(f => e.key === f.key)
  if (!enemy) return state

  delete enemy.currentAnimation

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

  let graph: number[][] = [[]]
  for (let i = 0; i < state.size + 2; i++) {
    graph.push([])
    for (let j = 0; j < state.size + 2; j++) {
      graph[i][j] = 1
    }
  }

  // Loop through all objects, set to 0 where they shouldn't be passable
  state.items.forEach(i => {
    if (i.held) return
    // We offset things
    graph[i.y + 1][i.x + 1] = 0
  })

  // All the walls, not including exits
  boundsCoordinates(state).forEach(pos => {
    graph[pos.y + 1][pos.x + 1] = 0
  })

  graph.pop()


  console.log("%cPathfinding Grid", "font-weight: bold")
  console.log(`%c${graph.map((g, i) => `${i}: ${g.join("")}`).join("\n")}`, "font-family: monospace")
  let searchGraph = new Graph(graph)

  console.log(`(${state.player.x}, ${state.player.y})`, `(${enemy.x}, ${enemy.y})`)
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
      enemy.currentAnimation = attackAnimation(enemy, newState.player)
      if (newState.hp <= 0) {
        newState.gameOver = true
      }
    }

    const item = newState.items.find(i => i.held && i.x === enemy.x && i.y === enemy.y)
    if (item) {
      console.log("Found item")
      enemy.x = oldPos.x
      enemy.y = oldPos.y
      enemy.currentAnimation = attackAnimation(enemy, item)
      enemy.stunned = true
      newState.items = _.without(newState.items, item)
    }
  }

  enemy.stunnedThisTurn = false

  return newState
}

// Returns an animation representing a direction of attack
// Diagonals aren't supported. Prioritizes x-axis over y.
function attackAnimation(from: GamePosition, to: GamePosition): GameAnimation | undefined {
  if (from.x > to.x) {
    return GameAnimation.AttackLeft
  } else if (from.x < to.x) {
    return GameAnimation.AttackRight
  } else if (from.y > to.y) {
    return GameAnimation.AttackDown
  } else if (from.y < to.y) {
    return GameAnimation.AttackUp
  }

  return undefined
}

export function EnemyFactory(x: number, y: number) {
  return {
    x,
    y,
    stunned: false,
    stunnedThisTurn: false,
    tile: "k",
    key: uuid()
  }
}