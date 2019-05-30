import { State } from "./App";
import GridCalculator, { GamePosition, boundsCoordinates, TileType } from "./GridCalculator";
import { Item, Player } from "./Player";

import _ from "lodash";
import { keyedWrap, keyedClamp } from "./Room";
import { roomByTakingExit, replaceRoom } from "./Dungeon";
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
    return oldState
  }

  if (hasExitedRoom(state)) {
    // state.exited = true

    const playerPos = { ...oldState.player }

    const size = state.currentRoom.size

    const clampedPlayer = keyedClamp(playerPos)

    const exits = state.currentRoom.exits.filter(e => {
      if (e.x <= -1 || e.x >= size) {
        return (e.x === clampedPlayer.x)
      } else {
        return (e.y === clampedPlayer.y)
      }
    }).map(keyedClamp)

    const entrances = exits.map(keyedWrap)

    if (entrances.length === 0) {
      console.log("WHY NO ENTRANCES", state.currentRoom.exits)
    }

    state.dungeon = replaceRoom(state.dungeon, state.currentRoom)
    state.currentRoom = roomByTakingExit(state.dungeon, state.currentRoom, exits[0])
    state.player = { ...state.player, ...keyedWrap(playerPos) }
    console.log("New Room", state.currentRoom.pos)
    return state
  }

  if (state.player.x !== oldState.player.x || state.player.y !== oldState.player.y) {
    state = moveEnemies(state)
  }

  return state
}

// TODO: This should be factored out into an enemy-specific file
function moveEnemies(state: State): State {
  let newState = _.cloneDeep(state)

  let passableTypes = [
    TileType.Floor,
    TileType.Player,

    TileType.Door,

    TileType.HeldItemBlock,
    TileType.HeldItemMoney,
    TileType.HeldItemNormal,
    TileType.HeldItemPush,
    TileType.HeldItemSword
  ]

  newState.currentRoom.enemies = []
  newState.currentRoom.tiredEnemies = []

  for (const enemy of state.currentRoom.enemies) {
    let isActive = true

    // Before moving:
    // It's possible that the player moved one of their items into the enemy.
    // If that's the case, resolve that rather than do anything fancier.
    // (We could resolve this when we resolve item movement, but that also feels weird?)
    const item = newState.player.items.find(i => i.x + newState.player.x === enemy.x && i.y + newState.player.y === enemy.y)
    if (item) {
      newState.currentRoom.tiredEnemies.push(enemy)
      newState.player.items = _.without(newState.player.items, item)
      continue
    }

    // Okay, now that's over with, let's do normal pathfinding.

    // TODO: Here's where the frustrating math changes need to go to allow players to be in doorways
    let graph: number[][] = [[]]
    let grid = GridCalculator(newState)
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
      // console.log(newPos)

      if (state.player.x === enemy.x && state.player.y === enemy.y) {
        newState.hp -= 1
        enemy.x = oldPos.x
        enemy.y = oldPos.y
        if (newState.hp <= 0) {
          newState.gameOver = true
        }
      }

      const item = newState.player.items.find(i => newState.player.x + i.x === enemy.x && newState.player.y + i.y === enemy.y)
      if (item) {
        enemy.x = oldPos.x
        enemy.y = oldPos.y

        if (item.type !== TileType.ItemSword) {
          // If it's a sword, we'll just say they didn't move, rather than them consuming the item
          isActive = false
          newState.currentRoom.tiredEnemies.push(enemy)
          newState.player.items = _.without(newState.player.items, item)
        }
      }

      if (isActive) {
        newState.currentRoom.enemies.push(enemy)
      }
    }
  }

  for (const tiredEnemy of state.currentRoom.tiredEnemies) {
    newState.currentRoom.enemies.push(tiredEnemy)
  }

  // console.log(newState)
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
  let tiredEnemies = _.cloneDeep(state.currentRoom.tiredEnemies)

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

  // Let's treat the enemy as a block
  // That is, if the PLAYER (not their item) bumps into it, ignore
  let enemy = _.find(state.currentRoom.enemies, e => e.x === player.x && e.y === player.y)
  if (enemy) {
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

      let tired = _.find(tiredEnemies, e => e.x === heldItem.x + player.x && e.y === heldItem.y + player.y)
      if (tired) {
        destroyedHeldItems.push(heldItem)
        tiredEnemies = _.without(tiredEnemies, tired)
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

  return { ...state, player, currentRoom: { ...state.currentRoom, enemies, tiredEnemies, items } }
}

function hasExitedRoom(state: State): boolean {
  const result = _.flatten(GridCalculator(state))
  const types = [
    TileType.Player,
    TileType.HeldItemNormal,
    TileType.HeldItemMoney,
    TileType.HeldItemSword,
    TileType.HeldItemPush,
    TileType.HeldItemBlock
  ]
  return !_.find(result, t => _.includes(types, t))
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