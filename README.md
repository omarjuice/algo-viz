# Algo-Viz

## _Work In Progress_

### The application will take user code and execute it to transform it into a visualization of the involved data structures and expressions. 

## EXAMPLES
![bst](https://res.cloudinary.com/omarjuice/image/upload/v1562778590/algo-viz/algo-viz-example-bst.gif)
![trie](https://res.cloudinary.com/omarjuice/image/upload/v1562778624/algo-viz/algo-viz-example-trie.png)
![riverSizes](https://res.cloudinary.com/omarjuice/image/upload/v1562778624/algo-viz/algo-viz-example-riverSizes.png)
![letterCombinations](https://res.cloudinary.com/omarjuice/image/upload/v1562782410/algo-viz/algo-viz-example-lc.png)
## How it works
The functionality can be broken down into high level steps.

* Accept user code
* Transform it into something that can be read
* Run the code *safely* and create a set of declarative instructions that can be used to reproduce the values and data structures from the code
* Return the instructions and use them to create a visualization

*breakdowns of these steps will come when I have a working prototype as they are subject to change*

### Transforming code

"Something that can be read" is quite vague. What we really need is to transform your code into code that will allow the values inside it to be extracted from the code. How do we do that?

Babel is a JS to JS transpiler that gives us the power to do exactly this. It is most popularly used with Webpack in front-end JavaScript to transform code from more recent ECMAScript standards to be compatible with older standards. 

For our purposes, we need to be able to interact with it programatically, in Node.js. Luckily, it is quite straightforward to use Babel this way.

In particular, we need to interact with Babel's Abstract Syntax Tree(AST). Babel will parse the code into an AST for us, and then we will pass a function to it that makes use of the AST to create, modify, and delete nodes on the tree.
For more reading on Babel's AST, see [this helful article](https://www.sitepoint.com/understanding-asts-building-babel-plugin/)
and Babels [plugin handbook](https://github.com/jamiebuilds/babel-handbook/blob/master/translations/en/plugin-handbook.md).

Algo-viz's plugin wraps every expression in an external function call. These calls will take the values and metadata from the code. Of course, the values will be passed back into the code.

Here is an example of the output:
![transpiled](https://res.cloudinary.com/omarjuice/image/upload/v1562786375/algo-viz/transpiled.png)
