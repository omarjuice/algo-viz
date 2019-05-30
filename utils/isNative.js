

const NATIVE_OBJECTS = [
    Object,
    Function,
    Boolean,
    Symbol,
    Error,
    EvalError,
    RangeError,
    ReferenceError,
    SyntaxError,
    TypeError,
    URIError,
    Number,
    BigInt,
    Math,
    Date,
    String,
    RegExp,
    Array,
    Int8Array,
    Uint8Array,
    Int16Array,
    Uint16Array,
    Int32Array,
    Uint32Array,
    Float32Array,
    Float64Array,
    Map,
    Set,
    WeakMap,
    WeakSet,
    ArrayBuffer,
    SharedArrayBuffer,
    Atomics,
    DataView,
    JSON,
    Promise,
    Reflect,
    Proxy,
    Intl
]

module.exports = function isNative(object) {
    return NATIVE_OBJECTS.includes(object)
}