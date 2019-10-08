const banned = ['Int8Array',
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
    'BigUint64Array',
    'WeakMap',
    'WeakSet',
]



module.exports = (runner) => {
    const map = new Map(banned.map((name) => [runner.global[name], name]))
    return (obj) => {
        if (map.has(obj.constructor)) {
            runner.throw(new Error(`${map.get(obj.constructor)}s are not supported`))
        }
    }
}