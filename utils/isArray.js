const arraySet = new Set()
for (const arr of ['Int8Array',
    'Uint8Array',
    'Int16Array',
    'Uint16Array',
    'Int32Array',
    'Uint32Array',
    'Float32Array',
    'Float64Array']) {
    arraySet.add(arr)
}
module.exports = (obj) => Array.isArray(obj) || arraySet.has(obj.constructor.name)