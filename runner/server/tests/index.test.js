const expect = require('expect')
const request = require('supertest')
const app = require('../')

const funcs = require('../../execute/tests/funcs')

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
                // const body = JSON.parse(JSON.parse(text))

                expect(Array.isArray(body.steps)).toBe(true)
                expect(typeof body.objects).toBe('object')
                expect(typeof body.types).toBe('object')
                console.log(body.types)
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
})