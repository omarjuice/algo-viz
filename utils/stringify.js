
const stringify = {
    value(val) {
        const final = { stringified: true, val }
        if (typeof val === 'boolean') {
            final.val = String(val)
        } else if (typeof val === 'undefined') {
            final.val = 'undefined'
        } else if (typeof val === 'function') {
            final.val = val.name && val.name[0] !== '_' ? val.name : 'function'
        } else {
            final.stringified = false
        }
        return final

    },
    object(original, map = new Map()) {
        const obj = { ...original }
        for (let key in obj) {
            const { stringified, val } = this.value(obj[key])
            if (stringified) {
                obj[key] = val
            } else {

            }
        }
    },
    array(arr, map = new Map) {

    }

}

console.log(typeof Symbol('hello'))