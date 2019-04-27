const t = require('@babel/types')
module.exports = function ({ types }) {
    const randomString = (l = 3) => {
        let id = (Math.random() * 26 + 10 | 0).toString(36)
        for (let i = 1; i < l; i++)
            id += (Math.random() * 26 | 0).toString(36)
        return id
    }
    const _name = '__' + randomString()
    const proxy = (name, node, ...args) => {
        const _wrapper_id = t.identifier(name || _name)
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
    const proxyAssignment = (name, node, code) => {
        return t.variableDeclaration(
            "const",
            [t.variableDeclarator(
                t.identifier('_' + randomString(6)),
                proxy(name, node)
            )]
        )
    }
    const construct = (obj) => {
        const props = []
        for (let key in obj) {
            const val = obj[key];
            let value;
            if (typeof val === 'string') value = t.stringLiteral(val)
            if (typeof val === 'number') value = t.numericLiteral(val)
            if (Array.isArray(val)) value = t.arrayExpression(val)
            if (typeof val === 'object') value = construct(val)
            props.push(t.objectProperty(t.identifier(key), value))
        }
        return t.objectExpression(props)
    }
    return {
        visitor: {
            Function(path, { file: { code }, opts }) {
                if (path.node.id && path.node.id.name && path.node.id.name[0] === '_') {
                    return path.stop()
                }
                if (path.node.async && opts.disallow.async) throw new Error('async functions are disallowed')
                if (path.node.generator && opts.disallow.generator) throw new Error('generators are disallowed')
                const params = path.node.params.map(param => param.name && param.name[0] !== '_' && t.expressionStatement(
                    proxy(opts.spyName, param)));
                if (t.isBlockStatement(path.node.body)) {
                    path.node.body.body = [...params.filter(p => p), ...path.node.body.body]
                }
            },
            VariableDeclaration(path, { opts }) {
                const newNodes = []
                path.node.declarations.forEach((declaration) => {
                    const { id: identifier, init } = declaration

                    if (identifier.name[0] !== '_' && init && !t.isFunction(init)) {
                        if (t.isCallExpression(init) && t.isMemberExpression(init.callee) && [opts.spyName || _name].includes(init.callee.object.name)) {
                            return
                        }
                        declaration.init = proxy(opts.spyName, init)
                    }
                });
                newNodes.forEach(node => path.insertAfter(node))
            },
            AssignmentExpression(path, { file: { code }, opts }) {
                // const name =  t.stringLiteral(path.node.left.start && code.slice(path.node.left.start, path.node.left.end || '')
                path.node.right = proxy(opts.spyName, path.node.right)
            },
            MemberExpression: {
                enter(path, { file: { code }, opts }) {
                    if (path.node.object.name !== _name) {
                        if (!t.isIdentifier((path.node.property))) {
                            if (!t.isLiteral(path.node.property)) {
                                const nearestSibling = path.findParent((parent) => t.isBlockStatement(parent.parent) || t.isProgram(parent.parent))
                                let i = 0;
                                while (nearestSibling.parent.body[i] !== nearestSibling.node) {
                                    i++
                                }
                                const newAssignment = proxyAssignment(opts.spyName, path.node.property, code)
                                nearestSibling.parent.body.splice(i, 0, newAssignment)
                                path.node.property = newAssignment.declarations[0].id
                            }
                        }

                    }
                }
            },
            "ForOfStatement|ForInStatement"(path, { opts }) {
                const variables = path.node.left.declarations.map((declaration) => {
                    const { id: identifier } = declaration
                    // const name =t.stringLiteral(identifier.name)
                    return t.expressionStatement(proxy(opts.spyName, identifier))
                })
                path.node.body.body = [...variables, ...path.node.body.body]
            },
            Expression: {
                enter(path, { file: { code }, opts }) {
                    if (t.isThisExpression(path)) return
                    if (t.isCallExpression(path) && t.isMemberExpression(path.node.callee) && [opts.spyName || _name, 'console'].includes(path.node.callee.object.name)) {
                        return
                    }
                    if (t.isCallExpression(path) && t.isIdentifier(path.node.callee) && path.node.callee.name[0] === '_') {
                        return
                    }
                    if (t.isLiteral(path) && !t.isVariableDeclarator(path.parent)) return
                    if (t.isArrayExpression(path) && !t.isAssignmentExpression(path.parent) && !t.isReturnStatement(path.parent)) return
                    if (t.isObjectExpression(path) && !t.isVariableDeclarator(path.parent)) return
                    if (t.isLVal(path) || t.isAssignmentExpression(path) || t.isFunction(path)) return;
                    // const name = t.stringLiteral(code.slice(path.node.start, path.node.end))
                    const node = path.node.start ? proxy(opts.spyName, path.node) : proxy(opts.spyName, path.node)
                    path.replaceWith(node)
                    path.skip()
                },
            },
        }
    }
}