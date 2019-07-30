const expect = require('expect')
const request = require('supertest')
const app = require('../')
const funcs = require('../../execute/tests/funcs')
const execSync = require('../../execute/execSync')

describe('SERVER', function () {
    this.timeout(5000)
    it('should return 200', done => {
        request(app)
            .get('/')
            .expect(200)
            .end(done)
    })
    it('Posting code returns results', done => {
        request(app)
            .post('/')
            .send({
                code: `
                class MyClass{
                    constructor(){
                        this.value = 5
                    }
                }   
                const result = new MyClass();         
            `})
            .expect(200)
            .expect(({ body }) => {
                expect(Array.isArray(body.steps)).toBe(true)
                expect(typeof body.objects).toBe('object')
                expect(typeof body.types).toBe('object')
            })
            .end(done)
    })
    it('can handle multiple concurrent requests', async () => {
        const responses = []
        for (const name in funcs) {
            responses.push(request(app)
                .post('/')
                .send({
                    code: funcs[name]
                })
            )
        }
        responses.push(request(app)
            .post('/')
            .send({
                code: `while(true){}`
            })
        )

        const results = await Promise.all(responses)
        for (const res of results) {
            const { body } = res
            expect(Array.isArray(body.steps)).toBe(true)
            expect(typeof body.objects).toBe('object')
            expect(typeof body.types).toBe('object')
        }
    })
    it('execSync can execute code in the main thread', async () => {
        const code = `
            function twoNumberSum(array, targetSum) {
                const hash = {}
                for(let number of array){
                    if(hash[number]){
                        return number > hash[number] ? [hash[number], number] : [number, hash[number]]
                    }
                    hash[targetSum - number] = number;
                }
                return []
            }
            twoNumberSum([1,2,3,4,5], 5)
        `
        const result = await execSync(code)
        expect(Array.isArray(result.steps)).toBe(true)
        expect(result.steps.length > 0).toBe(true)
        expect(typeof result.objects).toBe('object')
        expect(typeof result.types).toBe('object')
    })
})