import { GameObject } from "./GameObject";
import uuid from "./uuid";

const sprite = (obj: GameObject) => {
  const map: { [health: number]: string } = {
    4: "fountain-full.png",
    3: "fountain-three-quarters.png",
    2: "fountain-half.png",
    1: "fountain-quarter.png",
    0: "fountain-empty.png"
  }

  return map[obj.health] || map[0]
}

export function FountainFactory(x: number, y: number): GameObject {
  return {
    x,
    y,
    sprite,
    key: uuid(),
    health: 4,
  }
}