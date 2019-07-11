# Algo-Viz

## _Work In Progress_

### The application will take user code and execute it to transform it into a visualization of the involved data structures and expressions. 

## EXAMPLES
![bst](https://res.cloudinary.com/omarjuice/image/upload/v1562789972/algo-viz/algo-viz-bst.gif)
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

Algo-viz's plugin wraps every expression in an external function call. These calls will take the values and metadata from the code. Of course, the values will be passed back into the code. I will spare you the gory details of that. If you like, see the transpiler [here](https://github.com/omarjuice/algo-viz/blob/master/runner/execute/stepify.js)

Here is an example of the output:
![transpiled](https://res.cloudinary.com/omarjuice/image/upload/v1562786375/algo-viz/transpiled.png)

### Running the code

Running the transpiled code is quite straighforward. An object with the aforementioned function is instantiated in the global scope and extracts the metadata and values as the code executes. 

There is just one problem. What do we do about data structures?

First of all, they can have nesting and circularity, which is not possible to convert to JSON to send to the client.
So we traverse the structure recursively and normalize it, generating unique ids for each object. The code that does this can be found [here](https://github.com/omarjuice/algo-viz/blob/master/runner/execute/utils/stringify.js)


They are also mutable and the code that mutates them may not be visible in the user code (The Array.prototype.sort() for example. We could make the runner aware that this function was executed, but we can't know what is actually happening).

I came up with three viable approaches to tackle this problem:

1. Make copies of objects and store them everytime they get passed through the runner
2. Use the transpiler to keep track of user written gets, sets, and deletes and then rewrite all native mutative methods
3. Find a way to observe changes to properties on objects.

Option 1 would have been quite clean, as each copy would represent the objects state at a given point, but it would take up an unacceptable amount of space. After all, this data will eventually be sent to the front end to create a visualization.

I almost went with option 2. Catching things in the transpiler actually worked quite nicely, although it introduced some other interesting problems, like handling computed property accesses. I did write the code that does that, and I got to the point where I was rewriting all of the Array.prototype methods. Something felt wrong about that. My versions were executing quite fine, but it didnt make sense that I was rewriting code when the whole point of this thing was to see how Node executes the code. I had to find a different way.

Option 3 turned out very nicely. At first, while traversing and normalizing objects, I used Object.defineProperty() to define getters and setters on every property. This introduced some other issues, particularly with Arrays(empty array indices and also length mutative methods). For some time, this was the implementation of object observation in the runner, I even finished a large part of the front-end with this in place. And it worked pefectly fine. However, I wasn't satisfied with the dirty things I had to do to make it work, like creating an "empty" symbol value for empty array values.

After using Mobx extensively on the front end, I decided to borrow its observable creation pattern, using ES6 proxies, to do it in a cleaner way. Now the code is very clean. Essentially, it works by intercepting all objects and returning their virtualized versions back into the user code. The user code cannot know the difference without using some particular function in the Node inspect utility API. The code for that can be found [here](https://github.com/omarjuice/algo-viz/blob/master/runner/execute/utils/virtualize.js)
