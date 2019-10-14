import store from '../store'
export default function getType(value: any): Viz.valType {
    if (value === null || value === undefined) return 'null';
    const typeOf: string = typeof value
    if (typeOf === 'string') {
        const type = store.viz.types[value];
        if (!type) return typeOf;
        let count = 0;
        while (value[count] === '_') count++
        if (count === 1) {
            return 'special'
        }
        if (count === 2) {
            return 'func'
        }
        if (count === 3) {
            return 'object'
        }
        if (count === 4) {
            return 'native'
        }
        if (count === 5) {
            return "other"
        }
    }
    return typeof value as Viz.valType
}
