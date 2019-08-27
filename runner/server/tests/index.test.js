const expect = require('expect')
const request = require('supertest')
const { init } = require('../')
const funcs = require('../../execute/tests/funcs')
const execSync = require('../../execute/execSync')

let agent;
before(async () => {
    const { server, database } = await init
    agent = request.agent(server)
    await database.collection('sessions').drop()
    return;
})


describe('SERVER', function () {
    this.timeout(5000)
    it('should return 200', done => {
        agent
            .get('/')
            .expect(200)
            .end(done)
    })
    it('Posting code returns results', done => {
        agent
            .post('/execute')
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
    if (process.env.VERSION >= 11) {
        it('can handle multiple concurrent requests', async () => {
            const responses = []
            const start = Date.now()
            for (const name in funcs) {
                responses.push(agent
                    .post('/execute')
                    .send({
                        code: funcs[name]
                    })
                )
            }

            const results = await Promise.all(responses)
            const end = Date.now()
            for (const res of results) {
                const { body } = res
                expect(Array.isArray(body.steps)).toBe(true)
                expect(typeof body.objects).toBe('object')
                expect(typeof body.types).toBe('object')
            }
            // console.log(results.reduce((a, v) => a + v.body.steps.length, 0) / results.length, (end - start) / results.length);
        })
    }
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
        const result = JSON.parse(await execSync(code))
        console.log(result)
        expect(Array.isArray(result.steps)).toBe(true)
        expect(result.steps.length > 0).toBe(true)
        expect(typeof result.objects).toBe('object')
        expect(typeof result.types).toBe('object')
    })
})