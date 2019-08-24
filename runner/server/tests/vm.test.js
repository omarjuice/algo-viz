const expect = require('expect')
const execute = process.env.version > 10 ? require('../../execute') : require('../../execute/execSync')

describe('VM code execution', () => {
    it('Should run code in a VM', async () => {
        let body = await execute(`  function twoNumberSum(array, targetSum) {
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
        body = JSON.parse(body)
        expect(Array.isArray(body.steps)).toBe(true)
        expect(typeof body.objects).toBe('object')
        expect(typeof body.types).toBe('object')
    })
    it('Can access custom builtins', async () => {
        let body = await execute(`const result = Viz.SLL.create([1,2,3,4,5]);`)
        body = JSON.parse(body)
        expect(Array.isArray(body.steps)).toBe(true)
        expect(typeof body.objects).toBe('object')
        expect(typeof body.types).toBe('object')
    })
    it('Can cannot access restricted objects', async () => {
        let body = await execute(`const result = process;`)
        body = JSON.parse(body)
        expect(Array.isArray(body.steps)).toBe(true)
        expect(typeof body.objects).toBe('object')
        expect(typeof body.types).toBe('object')
        expect(body.steps[body.steps.length - 1].type).toBe('ERROR')
    })
    it('respects timeouts', async () => {
        let body = await execute(`while(true){}`)
        body = JSON.parse(body)
        expect(Array.isArray(body.steps)).toBe(true)
        expect(typeof body.objects).toBe('object')
        expect(typeof body.types).toBe('object')
        expect(body.steps[body.steps.length - 1].type).toBe('ERROR')
    })
    it('restricted objects cannot be accessed from callbacks', async () => {
        let body = await execute(`
            const matrix = Viz.array.matrix(5,5, () => {
                return require('fs')
            })
        `)
        body = JSON.parse(body)
        expect(Array.isArray(body.steps)).toBe(true)
        expect(typeof body.objects).toBe('object')
        expect(typeof body.types).toBe('object')
        expect(body.steps[body.steps.length - 1].type).toBe('ERROR')
    })
    it('natives', async () => {
        let body = await execute(`
            const p = Proxy;
        `)
        // require('fs').writeFileSync('executed.json', body)
        body = JSON.parse(body)
        expect(Array.isArray(body.steps)).toBe(true)
        expect(typeof body.objects).toBe('object')
        expect(typeof body.types).toBe('object')



    })
})