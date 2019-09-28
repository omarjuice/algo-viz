

const NATIVE_OBJECTS_NAMES = [
    'Object',
    'Function',
    'Boolean',
    'Symbol',
    'Error',
    'EvalError',
    'RangeError',
    'ReferenceError',
    'SyntaxError',
    'TypeError',
    'URIError',
    'Number',
    'BigInt',
    'Math',
    'Date',
    'String',
    'RegExp',
    'Array',
    'Int8Array',
    'Uint8Array',
    'Int16Array',
    'Uint16Array',
    'Int32Array',
    'Uint32Array',
    'Float32Array',
    'Float64Array',
    'Map',
    'Set',
    'WeakMap',
    'WeakSet',
    'ArrayBuffer',
    'SharedArrayBuffer',
    'Atomics',
    'DataView',
    'JSON',
    'Promise',
    'Reflect',
    'Proxy',
    'Intl',
    'global',
]
const natives = new Set()
for (let i = 0, name = NATIVE_OBJECTS_NAMES[i]; i < NATIVE_OBJECTS_NAMES.length; name = NATIVE_OBJECTS_NAMES[i++]) {
    natives.add(name)
}


module.exports = natives