const pickerOptions = {
  shortcuts: [{
    text: '今天',
    onClick (picker) {
      const end = new Date()
      const start = new Date()
      picker.$emit('pick', [start, end])
    }
  }, {
    text: '昨天',
    onClick (picker) {
      const start = new Date()
      start.setTime(start.getTime() - 1000 * 60 * 60 * 24)
      picker.$emit('pick', [start, start])
    }
  }, {
    text: '最近一周',
    onClick (picker) {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 7)
      picker.$emit('pick', [start, end])
    }
  }, {
    text: '最近一个月',
    onClick (picker) {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 30)
      picker.$emit('pick', [start, end])
    }
  }, {
    text: '最近三个月',
    onClick (picker) {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 90)
      picker.$emit('pick', [start, end])
    }
  }, {
    text: '最近六个月',
    onClick (picker) {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 180)
      picker.$emit('pick', [start, end])
    }
  }, {
    text: '最近一年',
    onClick (picker) {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 365)
      picker.$emit('pick', [start, end])
    }
  }]
}

const createChildren = (h, el, column, valueKey) => {
  const list = column.dataList || column.list || []
  return list.map(item => {
    let children
    if (column.slots && column.slots.default) {
      children = [column.slots.default.call(null, h, item)]
    } else {
      children = item[valueKey.label]
    }

    return h(el, {
      props: {
        ...column,
        label: column.props ? item[column.props.value] : item[valueKey.value]
      },
      key: item[valueKey.label]
    }, children)
  })
}

export default {
  name: 'MItem',
  props: {
    row: {
      type: Object,
      required: true
    },
    column: {
      type: Object,
      required: true
    },
    $index: Number
  },
  data () {
    return {
      isForce: false
    }
  },
  watch: {
    row () {
      if (this.$parent.clearValidate) {
        this.$nextTick(this.$parent.clearValidate)
      }
    }
  },
  computed: {
    computedColumn () {
      return {
        ...this.column,
        ...((this.column.getColumn && this.column.getColumn(this.row)) || {})
      }
    },
    componentType () {
      const { el } = this.computedColumn
      if (!el) return null
      if (el === 'mSelect' || el === 'MSelect' || el === 'select' || el === 'el-select') {
        return 'm-select'
      } else {
        return el.startsWith('el-') ? el : ('el-' + el)
      }
    },
    valueKey () {
      if (this.computedColumn.valueKey) return this.computedColumn.valueKey
      return {
        label: 'label',
        value: 'value'
      }
    },
    modelComputed: {
      get () {
        let val = null
        try {
          val = this.getStrFunction(`this.row.${this.column.prop}`)
        } catch (error) {
          this.setRowKey(null)
        }
        if (this.column.type === 'currency' && val) {
          return this.isForce ? val : this.currency(val, this.column.currency, this.column.decimals)
        }
        return val
      },
      set (value) {
        if (this.computedColumn.rules) {
          let isNumber = false
          if (Array.isArray(this.computedColumn.rules)) {
            isNumber = this.computedColumn.rules.some(obj => obj.type === 'number')
          } else {
            isNumber = this.computedColumn.rules.type === 'number'
          }
          if (isNumber && !isNaN(value) && this.componentType === 'el-input') value = Number(value)
        }
        if (this.computedColumn.type === 'currency') {
          isNaN(value) ? (value = 0) : (value = Number(value))
        }
        try {
          if (this.getStrFunction(`this.row.${this.computedColumn.prop}`) === undefined) {
            this.setRowKey(value)
          } else this.getStrFunction(`this.row.${this.computedColumn.prop} = value`)
        } catch (error) {
          this.setRowKey(value)
        }
      }
    }
  },
  methods: {
    getStrFunction (str) {
      str = str.replace(/(\.\d)/g, '[$1]').replace(/\.\[/g, '[')
      const Fn = Function
      return new Fn(`return ${str}`).call(this)
    },
    setRowKey (value) {
      if (this.computedColumn.prop && this.row) {
        let path = this.computedColumn.prop.replace(/\[(\w+)\]/g, '.$1').replace(/^\./, '')
        let arr = path.split('.')
        let firstKey = arr.shift()
        let lastIndex = arr.length - 1
        if (lastIndex >= 0) {
          let emptyObj = this.row[firstKey] || {}
          const val = arr.reduce((x, y, index) => {
            if (index === lastIndex) {
              x[y] = value
              return emptyObj
            }
            if (!x[y])x[y] = {}
            return x[y]
          }, emptyObj)
          this.$set(this.row, firstKey, JSON.parse(JSON.stringify(val)))
        } else {
          this.$set(this.row, firstKey, value)
        }
      }
    },
    getParams () {
      let newObj = {}
      if (this.computedColumn.params && typeof this.computedColumn.params === 'object') {
        for (let key in this.computedColumn.params) {
          let value
          try {
            value = this.getStrFunction(`this.row.${this.computedColumn.params[key]}`)
          } catch (err) { }
          newObj[key] = value !== undefined ? value : this.computedColumn.params[key]
        }
      }
      return newObj
    },
    getpickerOptions (type, flag) {
      if (type === 'daterange' && flag !== false) {
        return pickerOptions
      }
    },
    currency (value, currency = '¥', decimals = 2) {
      const digitsRE = /(\d{3})(?=\d)/g
      value = parseFloat(value)
      if (!isFinite(value) || (!value && value !== 0)) return ''
      currency = currency != null ? currency : ''
      decimals = decimals != null ? decimals : 2
      const stringified = Math.abs(value).toFixed(decimals)
      const _int = decimals
        ? stringified.slice(0, -1 - decimals)
        : stringified
      const i = _int.length % 3
      const head = i > 0
        ? (_int.slice(0, i) + (_int.length > 3 ? ',' : ''))
        : ''
      const _float = decimals
        ? stringified.slice(-1 - decimals)
        : ''
      const sign = value < 0 ? '-' : ''
      return sign + currency + head +
      _int.slice(i).replace(digitsRE, '$1,') +
      _float
    }
  },
  render (h) {
    const { row, $index, computedColumn, modelComputed, componentType, valueKey, getParams } = this
    if (componentType) {
      const placeholder = computedColumn.placeholder !== undefined
        ? computedColumn.placeholder : computedColumn.label
      let listeners = {
        ...(computedColumn.listeners || {}),
        input: (val) => {
          this.modelComputed = val
          computedColumn.listeners && computedColumn.listeners.input && computedColumn.listeners.input(val)
        }
      }
      if (computedColumn.listeners && computedColumn.listeners.currentObj) {
        listeners.currentObj = data => computedColumn.listeners.currentObj(data, row, $index)
      }
      let arr = ['m-select', 'el-checkbox-group', 'el-radio-group']
      if (arr.includes(componentType)) {
        let str = ''
        if (computedColumn.type === 'button') {
          str = '-button'
        }
        let children = componentType !== 'm-select'
          ? createChildren(
            h,
            componentType === 'el-checkbox-group' ? `el-checkbox${str}` : `el-radio${str}`,
            computedColumn,
            valueKey
          ) : null
        return h(componentType, {
          props: {
            ...computedColumn,
            placeholder,
            params: componentType === 'm-select' ? getParams(computedColumn) : null,
            value: modelComputed,
            customRender: (computedColumn.slots && computedColumn.slots.default) ? computedColumn.slots.default : null
          },
          attrs: computedColumn,
          on: listeners
        }, children)
      } else {
        if (componentType === 'el-input' && computedColumn.type === 'currency') {
          listeners.blur = (...args) => {
            this.isForce = false
            computedColumn.listeners && computedColumn.listeners.blur && computedColumn.listeners.blur(...args)
          }
          listeners.focus = (...args) => {
            this.isForce = true
            computedColumn.listeners && computedColumn.listeners.focus && computedColumn.listeners.focus(...args)
          }
        }
        let slots = computedColumn.slots || {}
        let children = Object.keys(slots).map(key => {
          if (typeof slots[key] !== 'function') throw new Error(`slots ${key} 必须为函数返回VNode`)
          let VNode = slots[key](h, { row, computedColumn, $index })
          VNode.data = {
            ...(VNode.data || {}),
            slot: key
          }
          return VNode
        })

        return h(componentType, {
          props: {
            ...computedColumn,
            filterable: true,
            value: modelComputed,
            label: (componentType === 'el-checkbox' || componentType === 'el-radio') ? null : computedColumn.label
          },
          attrs: {
            placeholder
          },
          on: listeners
        }, children)
      }
    } else {
      const VNode = typeof computedColumn.render === 'function' ? computedColumn.render(h, { row, computedColumn, $index }) : computedColumn.render
      return VNode || h('span', {
        style: {
          'word-break': 'break-all'
        }
      }, computedColumn.format ? computedColumn.format(row) : modelComputed)
    }
  }
}
