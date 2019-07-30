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
    it.only('Posting code returns results', done => {
        request(app)
            .post('/')
            .send({
                code: `
                class Trie {

                    constructor(letter = '') {
                        this.value = letter;
                        this.children = {};
                        this.isWord = false;
                    }
                
                    add(word, node = this) {
                        for (const letter of word) {
                            if (node.children[letter]) {
                                node = node.children[letter];
                            } else {
                
                                node.children[letter] = new Trie(letter);
                                node = node.children[letter];
                            }
                        }
                        node.isWord = true;
                    };
                    find(word, node = this) {
                        let value = ''
                
                        for (const letter of word) {
                            if (node.children[letter]) {
                                node = node.children[letter];
                                value += letter;
                            }
                        }
                        return value === word ? node : null;
                    };
                    findWords(value = '', words = [], node = this.find(value), ) {
                        if (node) {
                            if (node.isWord) words.push(value)
                            for (const letter in node.children) {
                                const child = node.children[letter]
                                child.findWords(value + child.value, words, child);
                            };
                        }
                
                        return words;
                    };
                }
                const trie = new Trie()
                const _ls =
                    ["lab",
                  
                        "long"];
                _ls.forEach(w => trie.add(w))                
            `})
            .expect(200)
            .expect(({ body }) => {
                // const body = JSON.parse(JSON.parse(text))

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
})