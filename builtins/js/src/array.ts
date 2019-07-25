const check = (length: number) => {
    if (typeof length !== 'number') throw new Error('length must be a number')
    if (length > 1000) throw new Error('Requested length is too high. length < 1000')
}
const array = {
    sortedInts: (length: number = 10, random: boolean = false) => {
        check(length)
        const arr = []
        for (let i = 0; i < length; i++) {
            arr.push(random ? Math.round(Math.random() * length) : i + 1)
        }
        return arr.sort((a, b) => a - b)

    },
    randomInts: (length: number = 10, allowNegative: boolean = true) => {
        check(length)
        const len = allowNegative ? Math.floor(length / 2) : length
        const arr = []
        for (let i = 0; i < length; i++) {
            const negator = allowNegative ? Math.random() > .5 ? 1 : -1 : 1
            arr.push(Math.round(Math.random() * len * negator))
        }
        return arr
    },
    filterDuplicates: (arr: any[], mutate: boolean = true) => {
        if (!Array.isArray(arr)) throw new Error('Input must be an array')
        if (!mutate) return [...new Set(arr)]
        const set = new Set()
        let last: number = 0

        for (let i = 0; i < arr.length; i++) {
            if (i in arr) {
                const el = arr[i]
                if (!set.has(el)) {
                    set.add(el)
                    if (last !== i) {
                        const lastExists = last in arr;
                        [arr[last], arr[i]] = [arr[i], arr[last]]
                        if (!lastExists) {
                            delete arr[i]
                        }
                    }
                    last++
                } else {
                    delete arr[i]
                }
            }
        }
        arr.length = last
        return arr
    },
    matrix: (rows: number, cols: number, callbackOrVal?: (row: number, col: number, matrix?: any[][]) => any) => {
        if (typeof rows !== 'number') throw new Error('rows must be a number')
        if (typeof cols !== 'number') throw new Error('cols must be a number')
        const cb =
            typeof callbackOrVal === 'function' ?
                callbackOrVal :
                callbackOrVal === undefined ?
                    (i: number, j: number) => (i + 1) * (j + 1) :
                    () => callbackOrVal
        const matrix: any[][] = []
        for (let row = 0; row < rows; row++) {
            matrix.push([])
            for (let col = 0; col < cols; col++) {
                matrix[row].push(cb(row, col, matrix))
            }
        }
        return matrix
    }

}
export default array