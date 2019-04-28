const t = require('@babel/types')
const { parseExpression } = require('@babel/parser')
const { CodeGenerator } = require('@babel/generator')
const TYPES = {
    DECLARATION: 'DECLARATION',
    ASSIGNMENT: 'ASSIGNMENT',
    PROP_ASSIGNMENT: 'PROP_ASSIGNMENT',
    ACCESSOR: 'ACCESSOR',
    EXPRESSION: 'EXPRESSION',
    METHODCALL: 'METHODCALL',
    CALL: 'CALL'
}

module.exports = function ({ types }) {
    let Node, execute;
    const randomString = (l = 3) => {
        let id = (Math.random() * 26 + 10 | 0).toString(36)
        for (let i = 1; i < l; i++)
            id += (Math.random() * 26 | 0).toString(36)
        return id
    }
    let _name = '__' + randomString()

    const constructCall = (_wrapper_id, node, args) => {
        return (_id) => t.callExpression(
            t.memberExpression(_wrapper_id, t.identifier(_id)),
            [node, args || t.nullLiteral()]
        )
    }
    const proxy = (node, details, type) => {
        const _wrapper_id = t.identifier(_name)
        const call = constructCall(_wrapper_id, node, details)
        if (t.isObjectExpression(node)) {
            return call('_o')
        } else if (t.isArrayExpression(node)) {
            return call('_a')
        } else if (t.isCallExpression(node)) {
            return call('_c')
        } else if (t.isMemberExpression(node)) {
            return call('_p')
        } else {
            return call('__')
        }
    }
    const proxyAssignment = (node, code, details) => {
        const varName = '_' + randomString(6);
        const id = t.identifier(varName)
        return t.variableDeclaration(
            "const",
            [t.variableDeclarator(
                id,
                proxy(
                    proxy(node, construct({ type: TYPES.EXPRESSION, name: code.slice(node.start, node.end), ...details })),
                    construct({
                        type: TYPES.DECLARATION,
                        name: varName,
                        scope: details.scope,
                    })
                )
            )]
        )
    }
    const computeAccessor = (memberExpression) => {
        let props = [memberExpression]
        let computed = [memberExpression.computed]
        let object = memberExpression.object
        while (t.isMemberExpression(object)) {
            props.unshift(object)
            computed.unshift(object.computed)
            object = object.object
        }
        props.unshift(object)
        computed.unshift(object.computed)
        let expression = t.stringLiteral(object.name)
        for (let i = 1; i < props.length; i++) {
            if (!computed[i]) {
                expression = t.binaryExpression('+',
                    expression,
                    t.binaryExpression('+',
                        t.stringLiteral('.'),
                        t.stringLiteral(props[i].property.name),
                    )
                )
            } else {
                expression = t.binaryExpression('+',
                    expression,
                    t.binaryExpression('+',
                        t.binaryExpression('+',
                            t.stringLiteral('['),
                            props[i].property
                        ),
                        t.stringLiteral(']')
                    )
                )
            }
        }
        return expression
    }
    const construct = (obj) => {
        obj._exec = t.memberExpression(t.identifier(_name), t.identifier('execute'))
        const props = []
        for (let key in obj) {
            const val = obj[key];

            let value;
            if (key === '_exec' || key === 'actual') {
                value = val
            } else if (val instanceof Node) {
                value = val
            } else if (typeof val === 'string') {
                value = t.stringLiteral(val)
            } else if (typeof val === 'number') {
                value = t.numericLiteral(val)
            }
            else if (typeof val === 'boolean') {
                value = t.booleanLiteral(val)
            } else if (Array.isArray(val)) {
                value = t.arrayExpression(val)
            } else if (typeof val === 'object') {
                value = construct(val)
            }
            props.push(t.objectProperty(t.identifier(key), value))
        }
        return t.objectExpression(props)
    }
    return {
        visitor: {
            Program(path, { opts }) {
                Node = path.node.constructor
                _name = opts.spyName || _name
            },
            Function(path, { file: { code }, opts }) {
                if (t.isObjectProperty(path.parent) && path.parent.key.name === '_exec') {
                    return
                }
                if (path.node.id && path.node.id.name && path.node.id.name[0] === '_') {
                    return path.stop()
                }
                if (path.node.async && opts.disallow.async) throw new Error('async functions are disallowed')
                if (path.node.generator && opts.disallow.generator) throw new Error('generators are disallowed')
                const params = path.node.params.map(param => param.name && param.name[0] !== '_' && t.expressionStatement(
                    proxy(
                        param,
                        construct({
                            type: TYPES.DECLARATION,
                            name: param.name,
                            scope: path.scope.uid,
                        })
                    )
                ));
                if (t.isBlockStatement(path.node.body)) {
                    path.node.body.body = [...params.filter(p => p), ...path.node.body.body]
                }
            },
            VariableDeclaration(path, { opts }) {
                if (t.isFor(path.parent) || t.isWhile(path.parent) || t.isIfStatement(path.parent) || t.isDoWhileStatement(path.parent)) {
                    path.node.declarations.forEach((declaration) => {
                        const { id: identifier, init } = declaration
                        if (identifier.name[0] !== '_' && init && !t.isFunction(init)) {
                            if (t.isCallExpression(init) && t.isMemberExpression(init.callee) && [opts.spyName || _name].includes(init.callee.object.name)) {
                                return
                            }
                            declaration.init = proxy(init, construct({ type: TYPES.DECLARATION, name: identifier.name, scope: path.scope.uid }))
                        }
                    });
                } else {
                    const newNodes = []
                    path.node.declarations.forEach((declaration) => {
                        const { id: identifier, init } = declaration
                        if (identifier.name[0] !== '_' && init && !t.isFunction(init)) {
                            if (t.isCallExpression(init) && t.isMemberExpression(init.callee) && [opts.spyName || _name].includes(init.callee.object.name)) {
                                return
                            }
                            newNodes.push(proxy(identifier, construct({ type: TYPES.DECLARATION, name: identifier.name, scope: path.scope.uid })))
                        }
                    });
                    newNodes.forEach(node => path.insertAfter(node))
                }

            },
            AssignmentExpression: {
                exit(path, { file: { code }, opts }) {
                    const name = path.node.left.start && code.slice(path.node.left.start, path.node.left.end)
                    const details = { type: TYPES.ASSIGNMENT, scope: path.scope.uid }
                    if (name) details.name = name
                    // if (t.isThisExpression(path.node.left)) {
                    //     console.log(path.node.left)
                    // }
                    if (t.isMemberExpression(path.node.left)) {
                        details.type = TYPES.PROP_ASSIGNMENT;
                        details.actual = computeAccessor(path.node.left)
                    }
                    if (t.isExpressionStatement(path.parent)) {
                        const nearestSibling = path.findParent((parent) => t.isBlockStatement(parent.parent) || t.isProgram(parent.parent))
                        let i = 0;
                        while (nearestSibling.parent.body[i] !== path.parent) i++
                        const newNode = proxy(path.node.left, construct(details))
                        nearestSibling.parent.body.splice(i + 1, 0, newNode)
                    } else {
                        path.node.right = proxy(path.node.right, construct(details))
                    }
                }
            },
            MemberExpression: {
                enter(path, { file: { code }, opts }) {
                    if (path.node.object.name !== _name) {
                        if (!t.isIdentifier((path.node.property))) {
                            if (!t.isLiteral(path.node.property) && !t.isUpdateExpression(path.node.property)) {
                                const nearestSibling = path.findParent((parent) => t.isBlockStatement(parent.parent) || t.isProgram(parent.parent))
                                let i = 0;
                                while (nearestSibling.parent.body[i] !== nearestSibling.node) i++
                                const newAssignment = proxyAssignment(path.node.property, code, { scope: path.scope.uid })
                                nearestSibling.parent.body.splice(i, 0, newAssignment)
                                path.node.property = newAssignment.declarations[0].id
                            }
                        }
                    }
                },
                exit(path, { file: { code }, opts }) {
                    // if (path.node.object.name !== _name) {
                    //     if (!t.isMemberExpression(path.parent)) {
                    //         if (t.isAssignmentExpression(path.parent) && path.parent.left === path.node) return
                    //         path.replaceWith(proxy(path.node, construct({ type: TYPES.ACCESSOR })))
                    //     }
                    // }
                }
            },
            ForStatement(path, { file: { code }, opts }) {
                if (path.node.init) {
                    if (t.isDeclaration(path.node.init)) {
                        const name = path.node.init.declarations[0].id.name
                        path.node.body.body.unshift(proxy(t.identifier(name), construct({ type: TYPES.ASSIGNMENT, name, scope: path.scope.uid + 1 })))
                    } else if (t.isAssignmentExpression(path.node.init)) {
                        const name = path.node.init.left.name
                        path.node.body.body.unshift(proxy(t.identifier(name), construct({ type: TYPES.ASSIGNMENT, name, scope: path.scope.uid + 1 })))
                    }
                }
            },
            "ForOfStatement|ForInStatement"(path, { opts }) {
                const variables = path.node.left.declarations.map((declaration) => {
                    const { id: identifier } = declaration
                    return t.expressionStatement(proxy(
                        identifier,
                        construct({
                            type: TYPES.ASSIGNMENT,
                            name: identifier.name,
                            iterates: {
                                over: path.node.right,
                            },
                            scope: path.scope.uid + 1
                        })))
                })
                path.node.body.body = [...variables, ...path.node.body.body]
            },
            Expression: {
                enter(path, { file: { code }, opts }) {
                    if (t.isObjectProperty(path.parent) && path.parent.key.name === '_exec') {
                        return
                    }
                    if (t.isUpdateExpression(path) && t.isForStatement(path.parent)) return
                    if (t.isThisExpression(path)) return
                    if (t.isCallExpression(path) && t.isMemberExpression(path.node.callee) && [opts.spyName || _name, 'console'].includes(path.node.callee.object.name)) {
                        return
                    }
                    if (t.isCallExpression(path) && t.isIdentifier(path.node.callee) && path.node.callee.name[0] === '_') {
                        return
                    }
                    if (t.isLiteral(path)) return
                    if (t.isArrayExpression(path) && !t.isAssignmentExpression(path.parent) && !t.isReturnStatement(path.parent)) return
                    if (t.isObjectExpression(path) && !t.isVariableDeclarator(path.parent)) return
                    if (t.isLVal(path) || t.isAssignmentExpression(path) || t.isFunction(path)) return;
                    const name = code.slice(path.node.start, path.node.end)
                    const details = {
                        scope: path.scope.uid
                    }
                    if (t.isCallExpression(path)) {
                        if (t.isMemberExpression(path.node.callee)) {
                            details.type = TYPES.METHODCALL
                            details.object = path.node.callee
                        } else {
                            details.type = TYPES.CALL
                        }
                    } else {
                        details.type = TYPES.EXPRESSION
                    }
                    if (path.node.start) details.name = name;
                    const node = proxy(path.node, construct(details))
                    path.replaceWith(node)
                    path.skip()
                },
            },
        }
    }
}