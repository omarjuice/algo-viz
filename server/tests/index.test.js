const expect = require('expect')
const request = require('supertest')
const { init } = require('..')
const funcs = require('../../runners/js/execute/tests/funcs')

let agent;
before(async () => {
    const { server, database } = await init
    agent = request.agent(server)
    await database.collection('sessions').drop().catch(e => { })
    return;
})


describe.only('SERVER', function () {
    this.timeout(20000)
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
            console.log((body.runtime));
        }
        console.log((end - start) / results.reduce((a, v) => a + v.body.steps.length, 0) / results.length);
    })


})