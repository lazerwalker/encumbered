import { RenderObject } from "../renderGrid";
import * as React from 'react'

export default function (props: { obj: RenderObject }) {
  const { obj } = props
  const style: React.CSSProperties = {
    top: `${5 + obj.y * 60}px`,
    left: `${5 + obj.x * 50}px`
  }

  if (obj.isPlayer) {
    style.backgroundColor = 'rgba(255, 255, 255, 0.3)'
  }

  let text = obj.tile

  if (!obj.tile) { console.log(obj) }
  if (obj.tile && obj.tile.indexOf && obj.tile.indexOf(".png") !== -1) {
    text = ""
    style.backgroundImage = `url('assets/${obj.tile}')`
  }

  if (obj.animation) {
    style.animation = `${obj.animation} 0.2s`
  }

  return (
    <span
      className="symbol"
      key={obj.key}
      style={style}>
      {text}
    </span>
  )
}