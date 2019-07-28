const { default: instantiateViz } = require('../../builtins/js/dist/index')
module.exports = async function (___code) {
    let ___name;
    let Viz;
    try {
        eval(await (async function (func) {
            const fs = require('fs')
            const input = { _name: null, references: {} }
            const code = await require('../transpile')(func, input)
            const { _name } = input
            global[_name] = new (require('./runner'))(_name, func)
            Viz = instantiateViz(global[_name])
            fs.writeFile('transpiled.js', code, () => { })
            const key = require('./utils/key')
            global[key] = () => ___name = _name
            return code
        })(___code))
    } catch (error) {
        console.log(error);
        global[require('./utils/key')]()
        if (global[___name]) {

            global[___name].steps.push({
                type: 'ERROR',
                error: error.message
            })
        } else {
            throw error
        }
    }
    global[require('./utils/key')]()
    const fs = require('fs')
    const { types, objects, steps } = global[___name]
    delete global[___name]
    fs.writeFile('executed.json', JSON.stringify({
        steps, objects, types
    }), () => { })
    return { types, objects, steps }

}