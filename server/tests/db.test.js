const expect = require('expect')
const request = require('supertest')
const { init } = require('..')

let app, db;

before(async () => {
    const { server, database } = await init;
    app = server;
    db = database;

    db.dropCollection('issues').catch(e => { })
    db.dropCollection('submissions').catch(e => { })
    return
})

describe('Database', () => {

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
    })

    describe('Submissions tracking', () => {
        it('Should post a submission', done => {
            const code = `
            const hello = 'HELLO WORLD';
        `
            request(app)
                .post('/execute')
                .send({
                    code,
                    language: 'javascript'
                })
                .expect(200)
                .expect(() => {
                    return db.collection('submissions')
                        .find().toArray()
                        .then(([result]) => {
                            expect(result.code).toBe(code)
                            expect(result.date instanceof Date).toBe(true)
                            done()
                        })
                }).catch(e => done(e))
        })
    })
})
