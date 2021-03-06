import { GamePosition, TileType } from "./renderGrid";
import { Item, ItemFactory } from "./Item";
import _ from "lodash";
import { Enemy, EnemyFactory } from "./Enemy";
import { ExitFactory } from "./Exit";
import { GameObject } from "./GameObject";
import { FountainFactory } from "./Fountain";


export interface Room {
  exits: GameObject[]
  items: Item[]
  floorItems: GameObject[],
  size: number
  enemies: Enemy[]

  pos: GamePosition
}

export enum Direction {
  Up = "up",
  Down = "down",
  Left = "left",
  Right = "right",
}

function wrap(pos: GamePosition): GamePosition {
  const size = 8 // TODO

  if (pos.x <= -1) {
    return { x: size, y: pos.y }
  } else if (pos.x >= size) {
    return { x: -1, y: pos.y }
  } else if (pos.y <= -1) {
    return { x: pos.x, y: size }
  } else if (pos.y >= size) {
    return { x: pos.x, y: -1 }
  } else {
    return pos
  }
}

export function keyedWrap(obj: GameObject): GameObject {
  return { ...obj, ...wrap(obj) }
}

function clamp(pos: GamePosition, size: number = 8): GamePosition {
  if (pos.x <= -1) {
    return { x: -1, y: pos.y }
  } else if (pos.x >= size) {
    return { x: size, y: pos.y }
  } else if (pos.y <= -1) {
    return { x: pos.x, y: -1 }
  } else if (pos.y >= size) {
    return { x: pos.x, y: size }
  } else {
    return pos
  }
}

export function keyedClamp(obj: GameObject): GameObject {
  return { ...obj, ...clamp(obj) }
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

export function generateRoom(coord: GamePosition, entrance?: GameObject[], forbiddenSides: Direction[] = []): Room {
  const size = 8

  console.log("GENERATEROOM!", coord, entrance, forbiddenSides)

  let allCoordinates: GamePosition[] = []
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      allCoordinates.push({ x: j, y: i })
    }
  }

  allCoordinates = _.shuffle(allCoordinates)

  const numberOfItems = _.random(3, 8) + 1
  let items: Item[] = []

  let floorItems: GameObject[] = []

  let fountainCoords = allCoordinates.shift()!
  floorItems.push(FountainFactory(fountainCoords.x, fountainCoords.y))

  for (let i = 0; i < numberOfItems; i++) {
    let pos = allCoordinates.shift()!
    items.push(randomItem(pos))
  }


  let enemies: Enemy[] = []
  const numberOfEnemies = 1 //_.filter(items, i => i.type === TileType.Sword).length
  for (let i = 0; i < numberOfEnemies; i++) {
    let pos = allCoordinates.shift()!
    enemies.push(EnemyFactory(pos.x, pos.y))
  }

  let exits: GameObject[] = []
  if (entrance && entrance.length > 0) {
    exits = [...entrance]

    entrance.forEach(e => {
      forbiddenSides.push(sideFromExit(e, size))
    })
    console.log("Adding entrance: ", entrance)
  }
  console.log("Disallowing sides: ", forbiddenSides)

  forbiddenSides = _.uniq(forbiddenSides)

  const directionMap = {
    [Direction.Up]: { x: Infinity, y: size },
    [Direction.Down]: { x: Infinity, y: -1 },
    [Direction.Left]: { x: -1, y: Infinity },
    [Direction.Right]: { x: size, y: Infinity },
  }

  let directions: GamePosition[] = []

  _.forEach(directionMap, (value, key) => {
    if (!_.includes(forbiddenSides, key)) {
      directions.push(value)
    }
  })

  directions = _.shuffle(directions)

  const numberOfExits = Math.min(_.random(1, 3), directions.length)
  for (let i = 0; i < numberOfExits; i++) {
    const template = directions.shift()!

    const doorSize = _.sample([1, 2, 2, 2, 3, 3, 4])!
    const start = _.random(0, size - 1 - doorSize)
    for (let j = 0; j < doorSize; j++) {
      let x = template.x
      let y = template.y
      if (x === Infinity) {
        x = start + j
      } else if (y === Infinity) {
        y = start + j
      }

      exits.push(ExitFactory(x, y))
    }
  }

  return {
    size,
    exits,
    items,
    floorItems,
    enemies,
    pos: coord
  }

  function randomItem(pos: GamePosition) {
    const factories = [
      { type: TileType.Sword, tile: TileType.Sword },
      { type: TileType.Money, tile: TileType.Money },
      { type: TileType.Potion, tile: TileType.Potion, charges: 0 },
      { type: TileType.Wand, tile: TileType.Wand },
      { type: TileType.Shield, tile: TileType.Shield }
    ]

    const data = { ..._.sample(factories)!, ...pos }

    return ItemFactory(data)
  }
}