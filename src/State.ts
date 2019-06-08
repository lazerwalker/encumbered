import { TileType } from "./renderGrid";
import { Enemy } from "./Enemy";
import { Item } from "./Item";
import { Dungeon } from "./Dungeon";
import { Room } from "./Room";
import { GameObject } from "./GameObject";

export interface State {
  player: GameObject

  maxHP: number

  exited: boolean
  gameOver: boolean

  // TODO: Refactor these out
  dungeon: Dungeon
  currentRoom: Room

  enemies: Enemy[]
  items: Item[]
  exits: GameObject[]

  size: number

  selectedEditorButton?: TileType
}