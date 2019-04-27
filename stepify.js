console.log('------------------------------------------------')
const { parse } = require('@babel/parser');
const generate = require('@babel/generator');
const { default: traverse } = require('@babel/traverse')
const t = require('@babel/types');
// const ast = parse(code);
// // const _wrapper_id = t.identifier('_wrapper')
// const name = t.identifier('name')

// const body = t.blockStatement([])
// const wrapper = t.functionDeclaration(_wrapper_id, [name], body)
// t.callExpression
const randomString = (l = 3) => {
    let id = (Math.random() * 26 + 10 | 0).toString(36)
    for (let i = 1; i < l; i++)
        id += (Math.random() * 26 | 0).toString(36)
    return id
}

module.exports = function (code) {
    const ast = parse(code)

    const _name = '__' + randomString()
    const _wrapper_id = t.identifier(_name)
    const params = {
        name: t.identifier('name')
    }
    const body = t.blockStatement([])
    global[_wrapper_id] = {
        __: function () {

        },
        _o: function () {

        },
        _a: function () {

        }
    }
    const proxy = (node, ...args) => {
        if (t.isObjectExpression(node)) {
            return t.callExpression(
                t.memberExpression(_wrapper_id, t.identifier('_o')),
                [node, ...args]
            )
        } else if (t.isArrayExpression(node)) {
            return t.callExpression(
                t.memberExpression(_wrapper_id, t.identifier('_a')),
                [node, ...args]
            )
        } else {
            return t.callExpression(
                t.memberExpression(_wrapper_id, t.identifier('__')),
                [node, ...args]
            )
        }
    }

    traverse(ast, {
        Function(path) {
            const params = path.node.params.map(param => t.expressionStatement(proxy(param, t.stringLiteral(param.name))));
            if (t.isBlockStatement(path.node.body)) {
                path.node.body.body = [...params, ...path.node.body.body]
            }
        },
        VariableDeclaration(path) {
            const newNodes = []
            path.node.declarations.forEach((declaration) => {
                const { id: identifier, init } = declaration
                if (init && !t.isFunction(init)) {
                    declaration.init = t.expressionStatement(proxy(init, t.stringLiteral(identifier.name)))
                }
            });
            newNodes.forEach(node => path.insertAfter(node))
        },
        "ForOfStatement|ForInStatement"(path) {
            const variables = path.node.left.declarations.map((declaration) => {
                const { id: identifier } = declaration
                return t.expressionStatement(proxy(identifier, t.stringLiteral(identifier.name)))
            })
            path.node.body.body = [...variables, ...path.node.body.body]
        },

        Expression: {
            enter() {
                return
            },
            exit(path) {
                if (t.isCallExpression(path) && t.isMemberExpression(path.node.callee) && path.node.callee.object.name === _name && path.node.callee.object.name === _name) {
                    return
                }
                if (t.isLiteral(path) && !t.isVariableDeclarator(path.parent)) return
                if (t.isArrayExpression(path) && !t.isAssignmentExpression(path.parent) && !t.isReturnStatement(path.parent)) return
                if (t.isObjectExpression(path) && !t.isVariableDeclarator(path.parent)) return
                if (t.isCallExpression(path) && path.node.callee.name === "_wrapper") return
                if (t.isLVal(path) || t.isAssignmentExpression(path) || t.isFunction(path)) return;

                // console.log(code.slice(path.node.start, path.node.end))
                path.replaceWith(proxy(path.node))
                path.stop()
            }
        },
        // ReturnStatement(path) {
        //     path.node.argument = t.expressionStatement(proxy(path.node.argument))
        //     // console.log(path.node)
        // },
        // BinaryExpression(path) {
        //     path.replaceWith(t.expressionStatement(proxy(path.node)))
        //     path.stop()
        // },
        // CallExpression(path) {
        //     if (t.isMemberExpression(path.node.callee) && path.node.callee.object.name === _name) {
        //         return
        //     }
        //     path.replaceWith(t.expressionStatement(t.callExpression(_wrapper_id, [path.node])))
        //     path.stop()
        // }
        // ,
        // MemberExpression(path) {
        //     if (path.node.object.name === _name) return
        // }
        // enter(path) {
        //     path.visited = true
        // },
        // exit(path) {
        //     // console.log(path.visited)
        //     // // if (t.isExpression(path)) {
        //     // //     if (t.isAssignmentExpression(path) || t.isAssignmentPattern(path) || t.isLVal(path)) return
        //     // //     path.replaceWith(t.expressionStatement(t.callExpression(_wrapper_id, [path.node])))
        //     // // }
        //     // path.visited = true
        //     path.stop()
        // }
    })
    return new generate.CodeGenerator(ast).generate().code
}


