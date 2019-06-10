const _ = require('lodash')
const TYPES = require('./utils/types')
module.exports = function ({ types, steps, objects, primitives }) {
    const finalObjs = _.cloneDeep(objects)
    const seen = new Set()

    const reconstruct = (object) => {
        if (seen.has(object)) return object
        seen.add(object)
        for (const key in object) {
            const original = object[key]
            object[key] = getValue(object[key])
            if (object[key] && typeof object[key] === "object") {
                reconstruct(object[key], seen)
            }
        }
        return object
    }


    const getValue = (value) => {
        if (typeof value === 'string') {
            let _counter = 0
            while (value[_counter] === '_') {
                _counter++
            }
            if (_counter === 0) {
                return value
            } else if (_counter === 1) {
                const strVal = primitives[value]
                if (strVal === 'undefined') return undefined
                if (strVal === 'null') return null
                if (strVal === 'NaN') return NaN
                if (strVal === '<empty>') return '<empty>'
            } else if (_counter === 2) {
                return finalObjs[value]
            } else if (_counter === 3) {
                let obj = finalObjs[value]
                if (types[value] === 'Array') {
                    delete obj.final
                    obj = Array.from(obj)
                }
                return obj
            }
        } else {
            return value
        }
    }

    for (const key in finalObjs) {
        reconstruct(finalObjs[key])
    }
    for (const step of steps) {
        if (step.type === TYPES.SET) {
            const { object, access, value } = step
            finalObjs[object][access[0]] = reconstruct(value)
        }
        if (step.type === TYPES.DELETE) {
            const { object, access, value } = step
            if (value) {
                delete finalObjs[object][access[0]]
            }
        }
        if (step.type === TYPES.CLEAR) {
            finalObjs[object] = {}
        }
        if (step.type === TYPES.GET) {
            console.log('GET', finalObjs[step.object][step.access[0]], step.value);
        }
    }
    for (let key in finalObjs) {
        if (types[key] === 'Circular') {
            console.log(finalObjs[key]);
        }
    }
}

