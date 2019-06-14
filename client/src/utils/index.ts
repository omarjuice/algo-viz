import store from '../store'
export const getVal = (value: any) => {
    if (typeof value === 'boolean') {
        return value.toString()
    } else if (value === null) {
        return 'null'
    } else if (typeof value === 'string') {
        if (value.slice(0, 1) === '_') {
            return store.viz.types[value]
        }
    }
    return value
}