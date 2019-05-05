
// const { parseExpression } = require('@babel/parser')
// const { CodeGenerator } = require('@babel/generator')
const ASThelpers = require('./ast-helpers')
const t = require('@babel/types')

module.exports = function ({ types }) {
    let Node,
        _name,
        execute,
        code,
        traverseCall,
        traverseBinary,
        reducePropExpressions,
        getAccessorProxy,
        reassignComputedProperty,
        construct,
        computeAccessor,
        proxyAssignment,
        proxy,
        randomString,
        TYPES;

    return {
        visitor: {
            Program(path, { file: { code: original }, opts }) {
                Node = path.node.constructor
                _name = opts.spyName
                code = original
                const helpers = ASThelpers({ t, _name, code, Node })
                traverseCall = helpers.traverseCall
                traverseBinary = helpers.traverseBinary
                reducePropExpressions = helpers.reducePropExpressions
                getAccessorProxy = helpers.getAccessorProxy
                reassignComputedProperty = helpers.reassignComputedProperty
                construct = helpers.construct
                computeAccessor = helpers.computeAccessor
                proxyAssignment = helpers.proxyAssignment
                proxy = helpers.proxy
                randomString = helpers.randomString
                TYPES = helpers.TYPES
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
                            if (t.isLiteral(init)) return
                            newNodes.push(proxy(identifier, construct({ type: TYPES.DECLARATION, name: identifier.name, scope: path.scope.uid })))
                        }
                    });
                    newNodes.forEach(node => path.insertAfter(node))
                }

            },
            AssignmentExpression: {
                exit(path) {
                    if (!t.isMemberExpression(path.parent)) {
                        const name = path.node.left.start && code.slice(path.node.left.start, path.node.left.end)
                        const details = { type: TYPES.ASSIGNMENT, scope: path.scope.uid }
                        if (name) details.name = name
                        if (t.isMemberExpression(path.node.left)) {
                            const { object, expression } = computeAccessor(path, path.node.left)
                            details.type = TYPES.PROP_ASSIGNMENT;
                            details.object = object
                            details.access = expression
                        }
                        if (t.isExpressionStatement(path.parent)) {
                            const nearestSibling = path.findParent((parent) => t.isBlockStatement(parent.parent) || t.isProgram(parent.parent))
                            let i = 0;
                            while (nearestSibling.parent.body[i] !== path.parent) i++
                            const newNode = proxy(reducePropExpressions(path.node.left), construct(details))
                            nearestSibling.parent.body.splice(i + 1, 0, newNode)
                        } else {
                            path.node.right = proxy(path.node.right, construct(details))
                        }
                    }
                }
            },
            UpdateExpression: {
                exit(path) {
                    const name = path.node.argument.start && code.slice(path.node.argument.start, path.node.argument.end)
                    const details = { type: TYPES.ASSIGNMENT, scope: path.scope.uid }
                    if (name) details.name = name
                    if (t.isMemberExpression(path.node.argument)) {
                        const { object, expression } = computeAccessor(path, path.node.argument)
                        details.type = TYPES.PROP_ASSIGNMENT;
                        details.object = object
                        details.access = expression
                    }
                    if (t.isExpressionStatement(path.parent)) {
                        const nearestSibling = path.findParent((parent) => t.isBlockStatement(parent.parent) || t.isProgram(parent.parent))
                        let i = 0;
                        while (nearestSibling.parent.body[i] !== path.parent) i++
                        const newNode = proxy(reducePropExpressions(path.node.argument), construct(details))
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
                    const { object, expression } = computeAccessor(path, path.node)
                    if (!object.name || (object.name !== _name && object.name[0] !== '_')) {
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
                if (t.isBlockStatement(path.node.body)) {
                    if (path.node.init) {
                        if (t.isDeclaration(path.node.init)) {
                            const name = path.node.init.declarations[0].id.name
                            path.node.body.body.unshift(proxy(t.identifier(name), construct({ type: TYPES.ASSIGNMENT, name, scope: path.scope.uid + 1 })))
                        } else if (t.isAssignmentExpression(path.node.init)) {
                            const name = path.node.init.left.name
                            path.node.body.body.unshift(proxy(t.identifier(name), construct({ type: TYPES.ASSIGNMENT, name, scope: path.scope.uid + 1 })))
                        }
                    }
                }
            },
            "ForOfStatement|ForInStatement"(path) {
                if (t.isBlockStatement(path.node.body)) {
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
                }
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

                    if (t.isBinaryExpression(path) || t.isLogicalExpression(path)) {
                        path.replaceWith(traverseBinary(path, path.node))
                    } else if (t.isCallExpression(path)) {
                        path.replaceWith(traverseCall(path, path.node))
                    } else {
                        const name = code.slice(path.node.start, path.node.end)
                        const details = {
                            scope: path.scope.uid
                        }
                        details.type = TYPES.EXPRESSION
                        if (path.node.start) details.name = name;
                        const node = proxy(path.node, construct(details))
                        path.replaceWith(node)
                    }
                    path.skip()
                },
            },
        }
    }
}