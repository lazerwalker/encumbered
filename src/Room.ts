import { GamePosition, TileType } from "./GridCalculator";
import { Player, Item } from "./Player";
import _ from "lodash";

export interface Room {
  exits: GamePosition[]
  items: Item[]
  size: number
  enemies: GamePosition[]
  tiredEnemies: GamePosition[]
  walls: GamePosition[]

  pos: GamePosition
}

export enum Direction {
  Up = "up",
  Down = "down",
  Left = "left",
  Right = "right",
}

export function sideFromExit(exit: GamePosition, size: number = 8): Direction {
  if (exit.x <= -1) {
    return Direction.Left
  } else if (exit.x >= size) {
    return Direction.Right
  } else if (exit.y <= -1) {
    return Direction.Down
  } else if (exit.y >= size) {
    return Direction.Up
  }

  console.log("WARNING: Bad direction")
  return Direction.Left
}

export function generateRoom(coord: GamePosition, entrance?: GamePosition[], forbiddenSides: Direction[] = []): Room {
  const size = 8

  let allCoordinates: GamePosition[] = []
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      allCoordinates.push({ x: j, y: i })
    }
  }

  allCoordinates = _.shuffle(allCoordinates)

  const numberOfItems = _.random(3, 8)
  let items: Item[] = []

  for (let i = 0; i < numberOfItems; i++) {
    let pos = allCoordinates.shift()!
    items.push(randomItem(pos))
  }

  let enemies: GamePosition[] = []
  const numberOfEnemies = _.filter(items, i => i.type === TileType.ItemSword).length
  for (let i = 0; i < numberOfEnemies; i++) {
    let pos = allCoordinates.shift()!
    enemies.push(pos)
  }

  let exits: GamePosition[] = []
  if (entrance) {
    exits = [...entrance]
    forbiddenSides.push(sideFromExit(entrance[0], size))
    console.log("Adding entrance: ", entrance)
  }
  console.log("Disallowing sides: ", forbiddenSides)

  const directionMap = {
    [Direction.Up]: { x: Infinity, y: size },
    [Direction.Down]: { x: Infinity, y: -1 },
    [Direction.Left]: { x: -1, y: Infinity },
    [Direction.Right]: { x: size, y: Infinity },
  }

  // TODO: Remove the direction that represents the existing entrance

  let directions: GamePosition[] = []

  _.forEach(directionMap, (value, key) => {
    if (!_.includes(forbiddenSides, key)) {
      directions.push(value)
    }
  })

  directions = _.shuffle(directions)

  const numberOfExits = _.random(1, 3)
  for (let i = 0; i < numberOfExits; i++) {
    const template = directions.shift()!

    const doorSize = _.sample([1, 2, 2, 2, 3, 3, 4])!
    const start = _.random(0, size - 1 - doorSize)
    for (let j = 0; j < doorSize; j++) {
      let e = { x: template.x, y: template.y } // lol TS
      if (e.x === Infinity) {
        e.x = start + j
      } else if (e.y === Infinity) {
        e.y = start + j
      }

      exits.push(e)
    }
  }

  return {
    size,
    exits,
    items,
    enemies,
    tiredEnemies: [],
    walls: [],
    pos: coord
  }

  function randomItem(pos: GamePosition) {
    const types: [TileType, TileType][] = [
      [TileType.ItemSword, TileType.HeldItemSword],
      [TileType.ItemMoney, TileType.HeldItemMoney],
      [TileType.ItemNormal, TileType.HeldItemNormal],
      [TileType.ItemPush, TileType.HeldItemPush],
      [TileType.ItemBlock, TileType.HeldItemBlock],
    ]

    const type = _.sample(types)!

    return {
      ...pos,
      type: type[0],
      heldType: type[1]
    }
  }
}