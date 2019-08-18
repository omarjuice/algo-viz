import { Runner } from './'

function instantiateTrie(runner: Runner) {
    return class Trie {
        value: string
        isWord: boolean
        children: Map<string, Trie>
        constructor(letter = '') {
            this.value = letter;
            this.children = new Map();
            this.isWord = false;
        }
        static create(words: string[]) {
            if (!Array.isArray(words)) {
                throw new Error('Trie.add: words parameter must be an array of words')
            }
            const trie = new Trie();
            runner.ignore(true)
            trie.addMany(words)
            runner.ignore(false)
            return trie;
        }
        add(word: string) {
            if (typeof word !== 'string') {
                throw new Error(`Trie.add: word parameter must be a string. Got ${word}`)
            }
            let node: Trie = this;
            for (const letter of word) {
                if (node.children.has(letter)) {
                    node = node.children.get(letter);
                } else {
                    const newNode = new Trie(letter);
                    node.children.set(letter, newNode)
                    node = newNode
                }
            }
            node.isWord = true;
            return this
        }
        remove(word: string) {
            if (typeof word !== 'string') {
                throw new Error(`Trie.remove: word parameter must be a string. Got ${word}`)
            }
            let value: string = '', node: Trie = this
            const stack: Trie[] = [this]
            for (const letter of word) {
                if (node.children.has(letter)) {
                    node = node.children.get(letter);
                    stack.push(node);
                    value += letter;
                } else {
                    return this;
                }
            }
            if (value !== word) return this;
            let prev = stack.pop()
            if (prev) {
                prev.isWord = false
            }
            while (stack.length) {
                const node = stack.pop()
                if (!prev.isWord && !prev.children.size) {
                    node.children.delete(prev.value)
                } else {
                    break;
                }
                prev = node
            }
            return this

        }
        find(word: string): Trie {
            if (typeof word !== 'string') throw new Error(`Trie.find: word must be a string. Got ${word}`)
            let value: string = '', node: Trie = this

            for (const letter of word) {
                if (node.children.has(letter)) {
                    node = node.children.get(letter);
                    value += letter;
                } else {
                    return null
                }
            }
            return value === word ? node : null;
        }
        findWords(prefix: string = '', words: string[] = [], node = this.find(prefix)) {
            if (node) {
                if (node.isWord) words.push(prefix)
                node.children.forEach((child) => {
                    child.findWords(prefix + child.value, words, child);
                })
            }
            return words;
        };
        addMany(words: string[]) {
            if (!Array.isArray(words)) {
                throw new Error(`Trie.add: words parameter must be an array of words. Got ${words}`)
            }
            for (const word of words) {
                this.add(word);
            }
            return this
        }

    }
}

export default instantiateTrie