import 'mocha'
import expect from 'expect'
import instantiateViz from '../src';

const Viz = instantiateViz()

describe.only('Trie', () => {
    describe('construction', () => {
        it('Should create a trie', () => {
            const words = ['apple', 'bottom', 'jeans']
            const trie = Viz.Trie.create(words)
            expect(trie.findWords()).toEqual(words)
        })
    })
    describe('add', () => {
        it('Should add a new word', () => {
            const words = ['apple', 'bottom', 'jeans']
            const trie = Viz.Trie.create(words)
            const newWord = 'boots';
            trie.add(newWord)
            expect(trie.findWords(newWord)).toEqual([newWord])
        })
    })
    describe('findWords', () => {
        it('should find words with a specific prefix', () => {
            const words = ['apple', 'application', 'apply', 'apparatus', 'appearance', 'appalling']

            const trie = Viz.Trie.create(words)
            expect(trie.findWords('appl').length).toBe(3)
        })
    })
    describe('remove', () => {
        it('Should remove a word from the trie', () => {
            const words = ['boots', 'with', 'the', 'fur'];
            const trie = Viz.Trie.create(words)
            trie.remove('boots');
            expect(trie.findWords().includes('boots')).toBe(false)
        })
        it('Should not remove the node if it is part of another word', () => {
            {
                const words = ['nice', 'nicely'];
                const trie = Viz.Trie.create(words)
                trie.remove('nice');
                const found = trie.findWords()
                expect(found.includes('nice')).toBe(false)
                expect(found.includes('nicely')).toBe(true)
            }
            {
                const words = ['nice', 'nicely'];
                const trie = Viz.Trie.create(words)
                trie.remove('nicely');
                const found = trie.findWords()
                expect(found.includes('nice')).toBe(true)
                expect(found.includes('nicely')).toBe(false)
            }
        })
    })
})