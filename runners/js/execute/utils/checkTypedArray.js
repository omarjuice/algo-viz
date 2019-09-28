const arraySet = new Set()
for (const arr of ['Int8Array',
    'Uint8Array',
    'Uint16Array',
    'Uint32Array',
    'Int8Array',
    'Int16Array',
    'Int32Array',
    'Float32Array',
    'Float64Array',
    'Uint8ClampedArray',
    'BigInt64Array',
    'BigUint64Array'
]) {
    arraySet.add(arr)
}
module.exports = (obj) => {
    if (arraySet.has(obj.constructor.name)) {
        throw new Error('Typed Arrays are not supported')
    }
}