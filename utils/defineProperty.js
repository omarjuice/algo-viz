const TYPES = require('./types')
module.exports = function (__, stringify) {
    return function (obj, property, value) {
        Object.defineProperty(obj, property, {
            get() {
                return __(value, {
                    type: TYPES.GET,
                    scope: null,
                    object: stringify(obj),
                    access: [property],
                })
            },
            set(val) {
                return __(value = val, {
                    type: TYPES.SET,
                    scope: null,
                    object: stringify(obj),
                    access: [property],
                })
            }
        })
    }
}