import * as React from 'react'
import { TileType } from '../GridCalculator';

interface Props {
  type: TileType
  selected: boolean
  onClick: (type: TileType) => void
}

class EditorButton extends React.Component<Props> {
  render() {
    return (
      <div
        className={this.props.selected ? "selected" : ""}
        data-tiletype={this.props.type}
        key={`editorButton-${this.props.type}`}
        dangerouslySetInnerHTML={{ __html: this.props.type }}
        onTouchStart={this.handleClick}
        onClick={this.handleClick}
      />
    )
  }

  handleClick = () => {
    this.props.onClick(this.props.type)
  }
}

export default EditorButton