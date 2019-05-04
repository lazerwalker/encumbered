import { GamePosition, TileType } from "./GridCalculator";
import { Player, Item } from "./Player";
import _ from "lodash";
import { number } from "prop-types";
import { isOptionalMemberExpression } from "@babel/types";

export interface Room {
  exits: GamePosition[]
  items: Item[]
  size: number
  enemies: GamePosition[]
  tiredEnemies: GamePosition[]
  walls: GamePosition[]
}

export function generateRoom(entrance: GamePosition[]): Room {
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

  let exits = [...entrance]
  const directions: GamePosition[] = _.shuffle([
    { x: -1, y: Infinity },
    { x: size, y: Infinity },
    { x: Infinity, y: -1 },
    { x: Infinity, y: size }
  ])!

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
    enemies: [],
    tiredEnemies: [],
    walls: []
  }
}

function randomItem(pos: GamePosition) {
  const types: [TileType, TileType][] = [
    [TileType.ItemSword, TileType.HeldItemSword],
    [TileType.ItemMoney, TileType.HeldItemMoney],
    [TileType.ItemMoney, TileType.HeldItemNormal],
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