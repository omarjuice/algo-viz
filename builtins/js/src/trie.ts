// class Trie {

//     constructor(letter = '') {
//         this.value = letter;
//         this.children = {};
//         this.isWord = false;
//     }

//     add(word, node = this) {
//         for (const letter of word) {
//             if (node.children[letter]) {
//                 node = node.children[letter];
//             } else {

//                 node.children[letter] = new Trie(letter);
//                 node = node.children[letter];
//             }
//         }
//         node.isWord = true;
//     };
//     find(word, node = this) {
//         let value = ''

//         for (const letter of word) {
//             if (node.children[letter]) {
//                 node = node.children[letter];
//                 value += letter;
//             }
//         }
//         return value === word ? node : null;
//     };
//     findWords(value = '', words = [], node = this.find(value), ) {
//         if (node) {
//             if (node.isWord) words.push(value)
//             for (const letter in node.children) {
//                 const child = node.children[letter]
//                 child.findWords(value + child.value, words, child);
//             };
//         }

//         return words;
//     };
// }

// export default Trie