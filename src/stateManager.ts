import { State } from "./App";
import GridCalculator, { GamePosition, boundsCoordinates, TileType } from "./GridCalculator";
import { Item, Player } from "./Player";

import _ from "lodash";
const { astar, Graph } = require('javascript-astar')

export type GameReducer = (state: State) => State

export function moveLeft(state: State): State {
  const player = { ...state.player, x: state.player.x - 1 }
  return processPlayerChange(player, state)
}
export function moveRight(state: State): State {
  const player = { ...state.player, x: state.player.x + 1 }
  return processPlayerChange(player, state)
}

export function moveUp(state: State): State {
  const player = { ...state.player, y: state.player.y + 1 }
  return processPlayerChange(player, state)
}

export function moveDown(state: State): State {
  const player = { ...state.player, y: state.player.y - 1 }
  return processPlayerChange(player, state)
}

export function wait(state: State): State {
  return processPlayerChange(state.player, state)
}

export function release(state: State): State {
  let newItems: Item[] = [...state.currentRoom.items]
  let playerItems = state.player.items

  state.player.items.forEach(i => {
    let newItem = dropItem(state.player, i)
    newItems.push(newItem)
    playerItems = _.without(playerItems, i)
  })

  if (newItems.length > 0) {
    return {
      ...state,
      player: { ...state.player, items: playerItems },
      currentRoom: { ...state.currentRoom, items: newItems }
    }
  } else {
    return state
  }
}

function processPlayerChange(player: Player, oldState: State): State {
  let state = resolveItemCollisions({ ...oldState, player }, oldState)

  if (!avoidsWallCollisions(state)) {
    console.log("Wall?")
    return oldState
  }

  if (hasExitedRoom(state)) {
    state.exited = true
  }

  state = moveEnemies(state)

  return state
}

function moveEnemies(state: State): State {
  let newState = _.cloneDeep(state)

  let wallTypes = [
    TileType.Wall,
    TileType.VerticalWall,
    TileType.HorizontalWall,
    TileType.HeldItemSword
  ]

  for (const enemy of newState.currentRoom.enemies) {
    let graph: number[][] = [[]]
    let grid = GridCalculator(newState)
    for (let i = 0; i < grid.length - 2; i++) {
      graph.push([])
      for (let j = 0; j < grid[i].length - 2; j++) {
        if (_.includes(wallTypes, grid[i + 1][j + 1])) {
          graph[i][j] = 0
        } else {
          graph[i][j] = 1
        }
      }
    }
    graph = graph.reverse() // Our y-axis is reversed
    graph.shift()


    console.log("%cPathfinding Grid", "font-weight: bold")
    console.log(`%c${graph.map((g, i) => `${i}: ${g.join("")}`).join("\n")}`, "font-family: monospace")
    let searchGraph = new Graph(graph)

    console.log(`(${state.player.x}, ${state.player.y})`, `(${enemy.x}, ${enemy.y})`)
    const result = astar.search(
      searchGraph,
      searchGraph.grid[enemy.y][enemy.x],
      searchGraph.grid[state.player.y][state.player.x],
      { heuristic: astar.heuristics.manhattan }
    );

    console.log(result.map((r: any) => `(${r.x}, ${r.y})`).join(" "))

    if (result.length > 0) {
      const newPos = { x: result[0].y, y: result[0].x }
      const oldPos = { x: enemy.x, y: enemy.y }
      enemy.x = newPos.x
      enemy.y = newPos.y
      console.log(newPos)


      const item = newState.player.items.find(i => newState.player.x + i.x === enemy.x && newState.player.y + i.y === enemy.y)
      if (item) {
        newState.currentRoom.enemies = _.without(newState.currentRoom.enemies, enemy)
        enemy.x = oldPos.x
        enemy.y = oldPos.y
        newState.currentRoom.tiredEnemies.push(enemy)
        newState.player.items = _.without(newState.player.items, item)
      }
    }


    if (state.player.x === enemy.x && state.player.y === enemy.y) {
      newState.gameOver = true
    }
  }

  for (const tiredEnemy of state.currentRoom.tiredEnemies) {
    newState.currentRoom.tiredEnemies = _.without(newState.currentRoom.enemies, tiredEnemy)
    newState.currentRoom.enemies.push(tiredEnemy)
  }

  console.log(newState)
  return newState
}

function avoidsWallCollisions(state: State): boolean {
  let playerCoordinates: GamePosition[] = state.player.items.map(i => {
    return { x: i.x + state.player.x, y: i.y + state.player.y }
  })
  playerCoordinates.push({ x: state.player.x, y: state.player.y })

  // If any player bit intersects with a wall, collide
  if (_.intersectionWith(playerCoordinates, state.currentRoom.walls, _.isEqual).length > 0) {
    return false
  }

  // If any player bit is over an edge, collide
  let edgeTiles = boundsCoordinates(state)
  if (_.intersectionWith(playerCoordinates, edgeTiles, _.isEqual).length > 0) {
    return false
  }

  // Check if the player is holding any Block tiles
  let blockTiles = state.player.items
    .filter(i => i.type === TileType.ItemBlock)
    .map(i => ({ x: i.x + state.player.x, y: i.y + state.player.y }))

  for (let heldItem of blockTiles) {
    let blocker = state.currentRoom.items.find(i => i.x === heldItem.x && i.y === heldItem.y)
    if (blocker) {
      return false
    }
  }

  return true
}

function resolveItemCollisions(state: State, oldState: State): State {
  let player = state.player
  let enemies = _.cloneDeep(state.currentRoom.enemies)
  let destroyedItems: Item[] = []
  let pickedUpItems: Item[] = []
  let destroyedHeldItems: Item[] = []

  let stopMovement = false

  // Player
  let i = _.find(state.currentRoom.items, i => i.x === player.x && i.y === player.y)
  if (i) {
    destroyedItems.push(i)
    pickedUpItems.push(pickUpItem(oldState.player, i))
    stopMovement = true
  }

  player.items.forEach(heldItem => {
    // Pick up items
    let i = _.find(state.currentRoom.items, i => i.x === heldItem.x + player.x && i.y === heldItem.y + player.y)
    if (i) {
      stopMovement = true
      destroyedItems.push(i)
      pickedUpItems.push(pickUpItem(oldState.player, i))
    }

    // Kill enemy!
    if (heldItem.type === TileType.ItemSword) {
      let e = _.find(enemies, e => e.x === heldItem.x + player.x && e.y === heldItem.y + player.y)
      if (e) {
        destroyedHeldItems.push(heldItem)
        enemies = _.without(enemies, e)
        stopMovement = true
      }
    }

  })

  if (stopMovement) {
    player.x = oldState.player.x
    player.y = oldState.player.y
  }

  const items = _.without(state.currentRoom.items, ...destroyedItems)
  player.items.push(...pickedUpItems)
  player.items = _.without(player.items, ...destroyedHeldItems)

  return { ...state, player, currentRoom: { ...state.currentRoom, enemies, items } }
}

function hasExitedRoom(state: State): boolean {
  const result = _.flatten(GridCalculator(state))
  return !_.find(result, t => t === TileType.Player || t === TileType.PlayerItem)
}

function pickUpItem(player: Player, item: Item): Item {
  return {
    ...item,
    x: item.x - player.x,
    y: item.y - player.y
  }
}

function dropItem(player: Player, item: Item): Item {
  return {
    ...item,
    x: item.x + player.x,
    y: item.y + player.y
  }
}