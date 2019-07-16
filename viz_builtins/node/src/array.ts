const array = {
    sortedInts: (length = 10) => {
        if (typeof length !== 'number') throw new Error('length must be a number')
        if (length > 1000) throw new Error('Requested length is too high. length < 1000')
        const arr = []
        for (let i = 0; i < length; i++) {
            arr.push(Math.round(Math.random() * length))
        }
        return arr.sort((a, b) => a - b)

    }
}
export default array