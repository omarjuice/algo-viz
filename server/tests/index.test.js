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


describe('SERVER', function () {
    this.timeout(20000)
    it('should return 200', done => {
        agent
            .get('/')
            .expect(200)
            .end(done)
    })
    it('Posting javascript code returns results', done => {
        agent
            .post('/execute')
            .send({
                language: 'javascript',
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
    it.only('Posting python code returns results', done => {
        agent
            .post('/execute')
            .send({
                language: 'python',
                code: `

class Solution(object):
    def __init__(self):
        self.directions = [(1,0), (0,1), (-1,0), (0,-1)]

    def pacificAtlantic(self, matrix):         
        if not matrix: return []
        po_set = set()
        ao_set = set()
        def dfs(r,c, s):
                            
            if (r,c) in s: return
            s.add((r,c))
            for v, h in self.directions:
                i = r + v
                j = c + h
                if i >= len(matrix) or i < 0: continue
                if j >= len(matrix[i]) or j < 0: continue
                val = matrix[i][j]
                if val >= matrix[r][c]:
                    dfs(i,j,s)
                                    
                                
                            
        for r in range(len(matrix)):
            dfs(r,0, po_set)
            dfs(r, len(matrix[0]) - 1, ao_set)
                                
        for c in range(len(matrix[0])):
            dfs(0, c, po_set)
            dfs(len(matrix) - 1, c, ao_set)
                            
        return list(po_set & ao_set)

Solution().pacificAtlantic(
    [[1,2,2,3,5],[3,2,3,4,4],[2,4,5,3,1],[6,7,1,4,5],[5,1,1,2,4]]
)
                        `
            })
            .expect(200)
            .expect(({ body }) => {
                require('fs').writeFileSync('executed.json', JSON.stringify(body))
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
                    language: 'javascript',
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