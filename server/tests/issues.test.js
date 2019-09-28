const expect = require('expect')
const request = require('supertest')
const { init } = require('../')

let app, db;

before(async () => {
    const { server, database } = await init;
    app = server;
    db = database;

    db.dropCollection('issues')
    return
})


describe('Issue Tracking', () => {
    it('Should post a new issue', done => {
        const issue = {
            description: 'It broke.',
            code: 'const variable = 1;'
        }
        request(app)
            .post('/issues')
            .send(issue)
            .expect(201)
            .expect(({ body }) => {
                expect(body.description).toBe(issue.description);
                expect(body.code).toBe(issue.code);
            })
            .end(done)
    })
});
