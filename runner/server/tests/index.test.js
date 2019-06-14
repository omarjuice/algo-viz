const expect = require('expect')
const request = require('supertest')
const app = require('../')

describe('SERVER', () => {
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
            `})
            .expect(200)
            .expect(({ body }) => {
                expect(Array.isArray(body.steps)).toBe(true)
                expect(typeof body.objects).toBe('object')
                expect(typeof body.types).toBe('object')
            })
            .end(done)
    })
})