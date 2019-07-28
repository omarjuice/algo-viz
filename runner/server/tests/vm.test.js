const expect = require('expect')
const execute = require('../../execute/vm')

describe('VM code execution', () => {
    it('Should run code in a VM', async () => {
        const body = await execute(`  function twoNumberSum(array, targetSum) {
            const hash = {}
            for(let number of array){
                if(hash[number]){
                    return number > hash[number] ? [hash[number], number] : [number, hash[number]]
                }
                hash[targetSum - number] = number;
            }
            return []
        }
        twoNumberSum([1,2,3,4,5], 5)`)
        expect(Array.isArray(body.steps)).toBe(true)
        expect(typeof body.objects).toBe('object')
        expect(typeof body.types).toBe('object')
    })
    it('Can access custom builtins', async () => {
        const body = await execute(`const result = Viz.SLL.create([1,2,3,4,5]);`)
        expect(Array.isArray(body.steps)).toBe(true)
        expect(typeof body.objects).toBe('object')
        expect(typeof body.types).toBe('object')
    })
    it('Can cannot access restricted objects', async () => {
        const body = await execute(`const result = process;`)
        expect(Array.isArray(body.steps)).toBe(true)
        expect(typeof body.objects).toBe('object')
        expect(typeof body.types).toBe('object')
        expect(body.steps[body.steps.length - 1].type).toBe('ERROR')
    })
})