// const print = v => { return console.log(v), v };
module.exports = function () {
    let ___name;
    let ___code;
    let Viz;
    eval((function (func) {
        ___code = func;
        const fs = require('fs')
        const input = { _name: null, references: {} }
        const code = require('../transpile')(func, input)
        const { _name } = input
        global[_name] = new (require('./runner'))(_name, func)
        const { default: instantiateViz } = require('../builtins/dist');
        Viz = instantiateViz(global[_name])
        !process.env.NODE_ENV === 'production' && fs.writeFileSync('transpiled.js', code)
        ___code = func
        return code + `\n___name = '${_name}';`
    })(process.env.CODE))
    console.log('NUMBER OF STEPS ', global[___name].steps.length);
    const fs = require('fs')
    const { types, objects, steps, objectIndex } = global[___name]
    delete global[___name]
    !process.env.NODE_ENV === 'production' && fs.writeFileSync('executed.json', JSON.stringify({
        steps,
        objects,
        types,
        objectIndex,
        code: ___code
    }))
    console.log({ steps, objects, types, objectIndex });
}
