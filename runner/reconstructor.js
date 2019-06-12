const _ = require('lodash')
const TYPES = require('./utils/types')

module.exports = function ({ types, steps, objects, code }) {
    const finalObjs = _.cloneDeep(objects)
    const seen = new Set()

    const reconstruct = (object) => {
        if (seen.has(object)) return object
        seen.add(object)
        for (const key in object) {
            const val = object[key]
            object[key] = getValue(val)
            if (val && typeof val === "object") {
                reconstruct(val, seen)
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
                const strVal = types[value]
                if (strVal === 'undefined') return undefined
                if (strVal === 'null') return null
                if (strVal === 'NaN') return NaN
                if (strVal === '<empty>') return undefined
            } else if (_counter === 2) {
                return finalObjs[value]
            } else if (_counter === 3) {
                let obj = finalObjs[value]
                if (types[value] === 'Array') {
                    delete obj.final
                    obj = Array.from(obj)
                }
                return obj
            } else {
                return value
            }
        } else {
            return value
        }
    }

    for (const key in finalObjs) {
        const val = getValue(key)
        finalObjs[key] = reconstruct(val)
    }
    for (const step of steps) {
        if (step.type === TYPES.SET) {
            const { object, access, value } = step
            if (access[0] in finalObjs[object]) {
                step.prev = finalObjs[object][access[0]]
            }
            finalObjs[object][access[0]] = getValue(value)
        }
        if (step.type === TYPES.DELETE) {
            const { object, access, value } = step
            if (value) {
                const original = finalObjs[object][access[0]]
                step.prev = original
                delete finalObjs[object][access[0]]
            }
        }
        if (step.type === TYPES.CLEAR) {
            const { object } = step
            step.prev = finalObjs[object]
            finalObjs[object] = {}
        }
        if (step.type === TYPES.GET) {
            // console.log('GET', finalObjs[step.object][step.access[0]], step.value);
        }
        // if (step.access) {
        //     console.log(step.type, step.access[0], step.value, finalObjs[step.object]);
        // } else {
        //     console.log(step.type, step.name && code.slice(step.name[0], step.name[1]), step.value)
        // }
    }
    return {
        objects: finalObjs,
        reverse: function () {
            for (let i = steps.length - 1, step = steps[i]; i > -1; step = steps[--i]) {
                if (step.type === TYPES.SET) {
                    const { object, access } = step
                    if ('prev' in step) {
                        finalObjs[object][access[0]] = getValue(step.prev)
                    } else {
                        delete finalObjs[object][access[0]]
                    }
                }
                if (step.type === TYPES.DELETE) {
                    const { object, access, value } = step
                    if (value) {
                        finalObjs[object][access[0]] = step.prev
                    }
                }
                if (step.type === TYPES.CLEAR) {
                    const { object } = step
                    finalObjs[object] = step.prev
                }
                if (step.type === TYPES.GET) {
                    const { object, access, value } = step
                    finalObjs[object][access[0]] = getValue(value)
                }
                // console.log(JSON.stringify(finalObjs));
            }
        }
    }
}

