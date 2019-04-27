console.log('------------------------------------------------')
const { parse } = require('@babel/parser');
const generate = require('@babel/generator');
const { default: traverse } = require('@babel/traverse')
const t = require('@babel/types');
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
    let proxyAssigments = 0
    const proxyAssignment = (node) => {
        return t.assignmentExpression(
            "=",
            t.memberExpression(_wrapper_id, t.identifier('_' + proxyAssigments++)
            ),
            proxy(node, t.stringLiteral(code.slice(node.start, node.end)))
        )
    }
    const construct = (node) => {
        const props = []
        // if(t.isIdentifier(node))
        return t.objectExpression(props)
    }

    traverse(ast, {
        Function(path) {
            const params = path.node.params.map(param => t.expressionStatement(
                proxy(param, t.stringLiteral(param.name))))
            if (t.isBlockStatement(path.node.body)) {
                path.node.body.body = [...params, ...path.node.body.body]
            }
        },
        VariableDeclaration(path) {
            const newNodes = []
            path.node.declarations.forEach((declaration) => {
                const { id: identifier, init } = declaration
                if (init && !t.isFunction(init)) {
                    declaration.init = proxy(init, t.stringLiteral(identifier.name))
                }
            });
            newNodes.forEach(node => path.insertAfter(node))
        },
        AssignmentExpression(path) {
            path.node.right = proxy(path.node.right, t.stringLiteral(code.slice(path.node.left.start, path.node.left.end)))
        },
        MemberExpression: {
            enter(path) {
                if (path.node.object.name !== _name) {
                    if (!t.isIdentifier((path.node.property))) {
                        console.log(code.slice(path.node.property.start, path.node.property.end))
                        const nearestSibling = path.findParent((parent) => t.isBlockStatement(parent.parent) || t.isProgram(parent.parent))
                        let i = 0;
                        while (nearestSibling.parent.body[i] !== nearestSibling.node) {
                            i++
                        }
                        const newAssignment = proxyAssignment(path.node.property)
                        nearestSibling.parent.body.splice(i, 0, newAssignment)
                        path.node.property = newAssignment.left
                    }

                }
            }
        },
        "ForOfStatement|ForInStatement"(path) {
            const variables = path.node.left.declarations.map((declaration) => {
                const { id: identifier } = declaration
                return t.expressionStatement(proxy(identifier, t.stringLiteral(identifier.name)))
            })
            path.node.body.body = [...variables, ...path.node.body.body]
        },
        Expression: {
            enter(path) {
                if (t.isCallExpression(path) && t.isMemberExpression(path.node.callee) && path.node.callee.object.name === _name) {
                    return
                }
                if (t.isLiteral(path) && !t.isVariableDeclarator(path.parent)) return
                if (t.isArrayExpression(path) && !t.isAssignmentExpression(path.parent) && !t.isReturnStatement(path.parent)) return
                if (t.isObjectExpression(path) && !t.isVariableDeclarator(path.parent)) return
                if (t.isCallExpression(path) && path.node.callee.name === "_wrapper") return
                if (t.isLVal(path) || t.isAssignmentExpression(path) || t.isFunction(path)) return;

                path.replaceWith(proxy(path.node, t.stringLiteral(code.slice(path.node.start, path.node.end))))
                path.skip()
            },
        },
    })
    console.log('============================================')
    return new generate.CodeGenerator(ast).generate().code
}


