'use strict'

const React = require('react')
const { PureComponent, PropTypes } = React
const { func, node, bool, number, oneOf, oneOfType } = PropTypes
const { Draggable } = require('./draggable')
const cx = require('classnames')
const { bounds } = require('../dom')
const { noop, restrict } = require('../common/util')
const { keys } = Object


const DIR = {
  top: 'row', right: 'col', bottom: 'row', left: 'col'
}

const DIM = {
  top: 'height', right: 'width', bottom: 'height', left: 'width'
}

const OPP = {
  top: 'bottom', right: 'left', bottom: 'top', left: 'right'
}

const AXS = {
  top: 'pageY', right: 'pageX', bottom: 'pageY', left: 'pageX'
}


class Resizable extends PureComponent {
  constructor(props) {
    super(props)

    this.state = {
      value: props.value
    }
  }

  componentWillReceiveProps(props) {
    this.setState({ value: props.value })
  }

  get classes() {
    return {
      resizable: true,
      disabled: this.props.isDisabled,
      fixed: this.props.isFixed,
      flex: this.isFlex
    }
  }

  get dimension() {
    return DIM[this.props.edge]
  }

  get value() {
    return `${this.state.value}${this.props.isRelative ? '%' : 'px'}`
  }

  get style() {
    return this.isFlex ? null : {
      [this.dimension]: this.value
    }
  }

  getMax(event) {
    const { max } = this.props
    return (typeof max === 'function') ? max(event, this) : max
  }

  get isFlex() {
    return this.state.value == null
  }

  get isInverse() {
    return this.props.edge === 'left' || this.props.edge === 'top'
  }

  setContainer = (container) => {
    this.container = container
  }

  handleDragStart = (event) => {
    if (this.props.onResizeStart) {
      return this.props.onResizeStart(event, this)
    }
  }

  handleDrag = (event) => {
    const { edge, min, isFixed, isRelative, onValidate } = this.props
    const max = this.getMax(event)

    let origin = bounds(this.container)[OPP[edge]]
    let value = event[AXS[edge]] - origin

    if (this.isInverse) {
      value = -value
    }

    value = restrict(value, min, max)

    if (isRelative) {
      value = value / bounds(this.container.parentElement)[DIM[edge]] * 100
      value = restrict(value, null, 100)
    }

    if (onValidate(value, event, this)) {
      if (!isFixed) this.setState({ value })
      this.props.onResize(value, event, this)
    }
  }

  handleDragStop = () => {
    if (this.props.onResizeStop) {
      this.props.onResizeStop(this)
    }

    if (this.props.value !== this.state.value) {
      this.props.onChange(this.state.value, this)
    }
  }


  renderHandle() {
    const { edge, isDisabled } = this.props

    return (
      <Draggable
        isDisabled={isDisabled || this.isFlex}
        onDragStart={this.handleDragStart}
        onDrag={this.handleDrag}
        onDragStop={this.handleDragStop}
        classes={cx([
          `resizable-handle-${DIR[edge]}`,
          `resizable-handle-${edge}`
        ])}/>
    )
  }

  render() {
    return (
      <div
        className={cx(this.classes)}
        ref={this.setContainer}
        style={this.style}>
        {this.props.children}
        {this.renderHandle()}
      </div>
    )
  }

  static propTypes = {
    children: node,
    edge: oneOf(keys(DIM)).isRequired,
    id: number,
    isDisabled: bool,
    isFixed: bool,
    isRelative: bool,
    value: number,
    min: number.isRequired,
    max: oneOfType([number, func]),
    onChange: func.isRequired,
    onResize: func.isRequired,
    onResizeStart: func,
    onResizeStop: func,
    onValidate: func.isRequired
  }

  static defaultProps = {
    min: 0,
    onResize: noop,
    onValidate: () => true
  }
}


module.exports = {
  Resizable
}
