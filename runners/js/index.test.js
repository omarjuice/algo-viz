const expect = require('expect')
const execute = require('./')

describe('VM code execution', function () {
    this.timeout(10000)
    it('Should run code in a VM', async () => {
        process.env.CODE = `function twoNumberSum(array, targetSum) {
            const hash = {}
            for(let number of array){
                if(hash[number]){
                    return number > hash[number] ? [hash[number], number] : [number, hash[number]]
                }
                hash[targetSum - number] = number;
            }
            return []
        }
        twoNumberSum([1,2,3,4,5], 5)`
        let body = execute()

        body = JSON.parse(body)
        expect(Array.isArray(body.steps)).toBe(true)
        expect(typeof body.objects).toBe('object')
        expect(typeof body.types).toBe('object')
        expect(typeof body.objectIndex).toBe('object')
        expect(typeof body.runtime).toBe('number')

    })
    it('Can access custom builtins', async () => {
        process.env.CODE = `const result = Viz.SLL.create([1,2,3,4,5]);`
        let body = execute()
        body = JSON.parse(body)
        expect(Array.isArray(body.steps)).toBe(true)
        expect(typeof body.objects).toBe('object')
        expect(typeof body.types).toBe('object')
        expect(typeof body.objectIndex).toBe('object')
        expect(typeof body.runtime).toBe('number')
    })
    it('Can cannot access restricted objects', async () => {
        process.env.CODE = `const result = process;`
        let body = execute()
        body = JSON.parse(body)
        expect(Array.isArray(body.steps)).toBe(true)
        expect(typeof body.objects).toBe('object')
        expect(typeof body.types).toBe('object')
        expect(typeof body.objectIndex).toBe('object')
        expect(typeof body.runtime).toBe('number')
        expect(body.steps[body.steps.length - 1].type).toBe('ERROR')
    })
    it('respects timeouts', async () => {
        process.env.CODE = `while(true){}`
        let body = execute()
        require('fs').writeFileSync('executed.json', body)
        body = JSON.parse(body)
        expect(Array.isArray(body.steps)).toBe(true)
        expect(typeof body.objects).toBe('object')
        expect(typeof body.types).toBe('object')
        expect(typeof body.objectIndex).toBe('object')
        expect(typeof body.runtime).toBe('number')

        expect(body.steps[body.steps.length - 1].type).toBe('ERROR')
    })
    it('restricted objects cannot be accessed from callbacks', async () => {
        process.env.CODE = `
        const k = 'j'
        const matrix = Viz.array.matrix(5,5, () => {
            return require('fs')
        })

  
    `
        let body = execute()
        // require('fs').writeFileSync('executed.json', body)
        body = JSON.parse(body)
        expect(Array.isArray(body.steps)).toBe(true)
        expect(body.steps[body.steps.length - 1].type).toBe('ERROR')
    })
    it('natives', async () => {
        process.env.CODE = `
        const p = Proxy;
    `
        let body = execute()
        // require('fs').writeFileSync('executed.json', body)
        body = JSON.parse(body)
        expect(Array.isArray(body.steps)).toBe(true)
        expect(typeof body.objects).toBe('object')
        expect(typeof body.types).toBe('object')
        expect(typeof body.objectIndex).toBe('object')
        expect(typeof body.runtime).toBe('number')



    })
    it('Banned try statement', async () => {
        process.env.CODE = `
            try{
                
            }catch(e){

            }

  
    `
        try {
            let body = execute()
        } catch (e) {
            if (!(e instanceof SyntaxError)) {
                throw e
            }
        }

    })
    it('custom test', async () => {
        process.env.CODE = `
        let a = 1
        let b = 2

const arr = [1,2,3,4,5]

for (a of arr){
    a + 1
}
    `
        let body = execute()

        require('fs').writeFileSync('executed.json', body)
        body = JSON.parse(body)
        expect(Array.isArray(body.steps)).toBe(true)
        expect(typeof body.objects).toBe('object')
        expect(typeof body.types).toBe('object')
        expect(typeof body.objectIndex).toBe('object')
        expect(typeof body.runtime).toBe('number')



    })

})