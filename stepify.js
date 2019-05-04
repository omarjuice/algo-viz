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
    let Node, execute, code;
    const randomString = (l = 3) => {
        let id = (Math.random() * 26 + 10 | 0).toString(36)
        for (let i = 1; i < l; i++)
            id += (Math.random() * 26 | 0).toString(36)
        return id
    }
    let _name = '__' + randomString()


    const proxy = (node, details) => {
        const _wrapper_id = t.identifier(_name)
        return t.callExpression(
            t.memberExpression(_wrapper_id, t.identifier('__')),
            [node, details || t.nullLiteral()]
        )
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

        let expression;
        for (let i = 1; i < props.length; i++) {
            if (!computed[i]) {
                expression = t.binaryExpression('+',
                    expression || t.stringLiteral(""),
                    t.binaryExpression('+',
                        t.stringLiteral('.'),
                        t.stringLiteral(props[i].property.name),
                    )
                )
            } else {
                expression = t.binaryExpression('+',
                    expression || t.stringLiteral(""),
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
        return { object, expression }
    }
    const _keys = ['_exec', 'access']
    const construct = (obj) => {
        obj._exec = t.memberExpression(t.identifier(_name), t.identifier('execute'))
        const props = []
        for (let key in obj) {
            const val = obj[key];

            let value;
            if (_keys.includes(key)) {
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
    const reassignComputedProperty = (path, node) => {
        if (!t.isIdentifier((node.property))) {
            if (!t.isLiteral(node.property) && !t.isUpdateExpression(node.property)) {
                const nearestSibling = path.findParent((parent) => t.isBlockStatement(parent.parent) || t.isProgram(parent.parent))
                let i = 0;
                while (nearestSibling.parent.body[i] !== nearestSibling.node) i++
                const newAssignment = proxyAssignment(node.property, code, { scope: path.scope.uid })
                nearestSibling.parent.body.splice(i, 0, newAssignment)
                node.property = newAssignment.declarations[0].id
            }
        }
    }
    const getAccessorProxy = (path, node) => {
        const { object, expression } = computeAccessor(node)
        const details = {
            type: TYPES.ACCESSOR,
            scope: path.scope.uid,

        }
        const name = node.start && code.slice(node.start, node.end)
        if (name) details.name = name
        details.object = object;
        details.access = expression
        return (proxy(node,
            construct(details)))
    }
    return {
        visitor: {
            Program(path, { file: { code: original }, opts }) {
                Node = path.node.constructor
                _name = opts.spyName || _name
                code = original
            },
            Function(path, { opts }) {
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
            VariableDeclaration(path) {
                if (t.isFor(path.parent) || t.isWhile(path.parent) || t.isIfStatement(path.parent) || t.isDoWhileStatement(path.parent)) {
                    path.node.declarations.forEach((declaration) => {
                        const { id: identifier, init } = declaration
                        if (identifier.name[0] !== '_' && init && !t.isFunction(init)) {
                            if (t.isCallExpression(init) && t.isMemberExpression(init.callee) && [_name].includes(init.callee.object.name)) {
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
                            if (t.isCallExpression(init) && t.isMemberExpression(init.callee) && [_name].includes(init.callee.object.name)) {
                                return
                            }
                            newNodes.push(proxy(identifier, construct({ type: TYPES.DECLARATION, name: identifier.name, scope: path.scope.uid })))
                        }
                    });
                    newNodes.forEach(node => path.insertAfter(node))
                }

            },
            AssignmentExpression: {
                exit(path) {
                    const name = path.node.left.start && code.slice(path.node.left.start, path.node.left.end)
                    const details = { type: TYPES.ASSIGNMENT, scope: path.scope.uid }
                    if (name) details.name = name
                    if (t.isMemberExpression(path.node.left)) {
                        const { object, expression } = computeAccessor(path.node.left)
                        details.type = TYPES.PROP_ASSIGNMENT;
                        details.object = object
                        details.access = expression
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
            UpdateExpression: {
                exit(path) {
                    const name = path.node.argument.start && code.slice(path.node.argument.start, path.node.argument.end)
                    const details = { type: TYPES.ASSIGNMENT, scope: path.scope.uid }
                    if (name) details.name = name
                    if (t.isMemberExpression(path.node.argument)) {
                        reassignComputedProperty(path, path.node.argument)
                        const { object, expression } = computeAccessor(path.node.argument)
                        details.type = TYPES.PROP_ASSIGNMENT;
                        details.object = object
                        details.access = expression
                    }
                    if (t.isExpressionStatement(path.parent)) {
                        const nearestSibling = path.findParent((parent) => t.isBlockStatement(parent.parent) || t.isProgram(parent.parent))
                        let i = 0;
                        while (nearestSibling.parent.body[i] !== path.parent) i++
                        const newNode = proxy(path.node.argument, construct(details))
                        nearestSibling.parent.body.splice(i + 1, 0, newNode)
                    }
                }
            },
            MemberExpression: {
                enter(path) {
                    if (path.node.object.name !== _name) {
                        reassignComputedProperty(path, path.node)
                    }
                },
                exit(path) {
                    const { object, expression } = computeAccessor(path.node)
                    if (object.name !== _name) {
                        if (!t.isMemberExpression(path.parent)) {
                            if (t.isAssignmentExpression(path.parent) && path.parent.left === path.node || t.isUpdateExpression(path.parent)) return
                            const details = {
                                type: TYPES.ACCESSOR,
                                scope: path.scope.uid,

                            }
                            const name = path.node.start && code.slice(path.node.start, path.node.end)
                            if (name) details.name = name
                            details.object = object;
                            details.access = expression
                            path.replaceWith(proxy(path.node,
                                construct(details)))
                        }
                    } else {
                        path.stop()
                    }
                }
            },
            ForStatement(path) {
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
            "ForOfStatement|ForInStatement"(path) {
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
                enter(path) {
                    if (t.isObjectProperty(path.parent) && path.parent.key.name === '_exec') {
                        return
                    }
                    if (t.isMemberExpression(path) && path.node.object.name === _name) path.stop()
                    if (t.isUpdateExpression(path) && t.isForStatement(path.parent)) return
                    if (t.isUpdateExpression(path) && t.isMemberExpression(path.node.argument)) return
                    if (t.isThisExpression(path)) return
                    if (t.isCallExpression(path) && t.isMemberExpression(path.node.callee) && [_name, 'console'].includes(path.node.callee.object.name)) {
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
                    if (t.isBinaryExpression(path)) {
                        if (t.isMemberExpression(path.node.right)) {
                            if (path.node.right.object.name !== _name) {
                                path.node.right = getAccessorProxy(path, path.node.right)
                            }
                        }
                        if (t.isMemberExpression(path.node.left)) {
                            if (path.node.left.object.name !== _name) {
                                path.node.left = getAccessorProxy(path, path.node.left)
                            }
                        }
                    }
                    if (t.isCallExpression(path)) {
                        if (t.isMemberExpression(path.node.callee)) {
                            details.type = TYPES.METHODCALL
                            const { object, expression } = computeAccessor(path.node.callee)
                            details.object = object
                            details.access = expression
                        } else {
                            details.type = TYPES.CALL
                        }
                        path.node.arguments = path.node.arguments.map(node => {
                            if (t.isMemberExpression(node)) {
                                reassignComputedProperty(path, node)
                                node = getAccessorProxy(path, node)
                            }
                            return node
                        })
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