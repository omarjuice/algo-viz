
// const { parseExpression } = require('@babel/parser')
// const { CodeGenerator } = require('@babel/generator')
const ASThelpers = require('./ast-helpers')
const t = require('@babel/types')

module.exports = function ({ types }) {
    let Node,
        _name,
        execute,
        code,
        willTraverse,
        traverseCall,
        traverseBinary,
        traverseConditional,
        reducePropExpressions,
        traverseAssignment,
        traverseUnary,
        traverseArray,
        traverseObject,
        getAccessorProxy,
        reassignComputedValue,
        construct,
        computeAccessor,
        proxyAssignment,
        proxy,
        randomString,
        isBarredObject,
        getScope,
        TYPES;

    return {
        visitor: {
            Program(path, { file: { code: original }, opts }) {
                Node = path.node.constructor
                _name = opts.spyName
                code = original
                const helpers = ASThelpers({ t, _name, code, Node })
                willTraverse = helpers.willTraverse
                traverseCall = helpers.traverseCall
                traverseBinary = helpers.traverseBinary
                traverseConditional = helpers.traverseConditional
                traverseAssignment = helpers.traverseAssignment
                traverseUnary = helpers.traverseUnary
                traverseArray = helpers.traverseArray
                traverseObject = helpers.traverseObject
                reducePropExpressions = helpers.reducePropExpressions
                getAccessorProxy = helpers.getAccessorProxy
                reassignComputedValue = helpers.reassignComputedValue
                construct = helpers.construct
                computeAccessor = helpers.computeAccessor
                proxyAssignment = helpers.proxyAssignment
                proxy = helpers.proxy
                randomString = helpers.randomString
                TYPES = helpers.TYPES
                isBarredObject = helpers.isBarredObject
                getScope = helpers.getScope
            },
            Function(path, { opts }) {
                if (path.node.id && path.node.id.name && path.node.id.name[0] === '_' && !t.isAssignmentExpression(path.parent) && !t.variableDeclarator(path.parent)) {
                    return path.stop()
                }
                if (path.node.async && opts.disallow.async) throw new Error('async functions are disallowed')
                if (path.node.generator && opts.disallow.generator) throw new Error('generators are disallowed')
                const params = path.node.params.map(param => param.name && param.name[0] !== '_' && t.expressionStatement(
                    proxy(
                        param,
                        {
                            type: TYPES.DECLARATION,
                            name: param.name,
                            scope: getScope(path),
                        }
                    )
                ) || param);
                if (t.isBlockStatement(path.node.body)) {
                    path.node.body.body = [...params.filter(p => p), ...path.node.body.body]
                }
            },
            VariableDeclaration(path) {
                if (t.isFor(path.parent) || t.isWhile(path.parent) || t.isIfStatement(path.parent) || t.isDoWhileStatement(path.parent)) {
                    path.node.declarations.forEach((declaration) => {
                        const { id: identifier, init } = declaration
                        if (identifier.name[0] !== '_' && init && !t.isFunction(init)) {
                            if (t.isCallExpression(init) && t.isMemberExpression(init.callee) && isBarredObject(init.callee.object.name)) {
                                return
                            }
                            declaration.init = proxy(init, { type: TYPES.DECLARATION, name: identifier.name, scope: getScope(path) })
                        }
                    });
                } else {
                    const newNodes = []
                    path.node.declarations.forEach((declaration) => {
                        const { id: identifier, init } = declaration
                        if (identifier.name[0] !== '_' && init && !t.isFunction(init)) {
                            if (t.isCallExpression(init) && t.isMemberExpression(init.callee) && isBarredObject(init.callee.object.name)) {
                                return
                            }
                            newNodes.push(proxy(identifier, { type: TYPES.DECLARATION, name: identifier.name, scope: getScope(path) }))
                        }
                    });
                    newNodes.forEach(node => path.insertAfter(node))
                }
            },
            AssignmentExpression: {
                exit(path) {
                    if (!t.isMemberExpression(path.parent)) {
                        if (t.isMemberExpression(path.node.left)) {
                            let obj = path.node.left.object
                            while (t.isMemberExpression(obj)) {
                                obj = obj.object
                            }
                            if (isBarredObject(obj.name)) return
                        }

                        path.replaceWith(traverseAssignment(path, path.node))
                    }
                }
            },
            UpdateExpression: {
                exit(path) {
                    const name = path.node.argument.start && code.slice(path.node.argument.start, path.node.argument.end)
                    const details = { type: TYPES.ASSIGNMENT, scope: getScope(path) }
                    if (name) details.name = name
                    if (t.isMemberExpression(path.node.argument)) {
                        const { object, expression } = computeAccessor(path, path.node.argument)
                        details.type = TYPES.PROP_ASSIGNMENT;
                        details.object = object
                        details.access = expression
                    }
                    if (t.isExpressionStatement(path.parent)) {
                        const blockParent = path.findParent((parent) => t.isBlockStatement(parent) || t.isProgram(parent))
                        let i = 0;
                        while (blockParent.node.body[i] !== path.parent) i++
                        const newNode = proxy(reducePropExpressions(path.node.argument), details)
                        blockParent.node.body.splice(i + 1, 0, newNode)
                    }
                }

            },
            "For|While|DoWhileStatement"(path) {
                if (!t.isBlockStatement(path.node.body)) {
                    path.node.body = t.blockStatement([path.node.body])
                }
            },
            IfStatement(path) {
                if (!t.isBlockStatement(path.node.consequent)) {
                    path.node.consequent = t.blockStatement([path.node.consequent])
                }
            },
            MemberExpression: {
                enter(path) {
                    if (!isBarredObject(path.node.object.name)) {
                        reassignComputedValue(path, path.node)
                    }
                },
                exit(path) {
                    const { object, expression } = computeAccessor(path, path.node)
                    if (!isBarredObject(object.name)) {
                        if (!t.isMemberExpression(path.parent)) {
                            if (t.isAssignmentExpression(path.parent) && path.parent.left === path.node || t.isUpdateExpression(path.parent)) return
                            const details = {
                                type: TYPES.ACCESSOR,
                                scope: getScope(path),

                            }
                            const name = path.node.start && code.slice(path.node.start, path.node.end)
                            if (name) details.name = name
                            details.object = object instanceof Node ? object : object.name ? object.name : 'this'
                            details.access = expression
                            path.replaceWith(proxy(path.node, details))
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
                            if (name[0] === '_') return
                            path.node.body.body.unshift(proxy(t.identifier(name), { type: TYPES.ASSIGNMENT, name, scope: t.arrayExpression([t.numericLiteral(path.scope.uid), t.numericLiteral(path.scope.uid + 1)]) }))
                        } else if (t.isAssignmentExpression(path.node.init)) {
                            const name = path.node.init.left.name
                            path.node.body.body.unshift(proxy(t.identifier(name), { type: TYPES.ASSIGNMENT, name, scope: t.arrayExpression([t.numericLiteral(path.scope.uid), t.numericLiteral(path.scope.uid + 1)]) }))
                        }
                    }
                }
            },
            ForOfStatement: {
                enter(path) {
                    reassignComputedValue(path, path.node, 'right', true)
                },
                exit(path) {
                    if (t.isBlockStatement(path.node.body)) {
                        const iterationName = '_' + randomString(5)
                        const nearestSibling = path.findParent((parent) => t.isBlockStatement(parent) || t.isProgram(parent))
                        let i = 0;
                        while (nearestSibling.node.body[i] !== path.node) i++
                        const newNode = t.variableDeclaration('let', [t.variableDeclarator(t.identifier(iterationName), t.numericLiteral(-1))])
                        // const newNode = t.assignmentExpression('=', t.memberExpression(t.identifier(_name), t.identifier(iterationName)), t.numericLiteral(-1))
                        nearestSibling.node.body.splice(i, 0, newNode)
                        const variables = (path.node.left.declarations || [{ id: path.node.left }]).map((declaration) => {
                            const { id: identifier } = declaration
                            return t.expressionStatement(proxy(
                                identifier,
                                {
                                    type: TYPES.ACCESSOR,
                                    name: identifier.name,
                                    object: t.isAssignmentExpression(path.node.right) ? path.node.right.left : path.node.right,
                                    access: t.arrayExpression([newNode.declarations[0].id]),
                                    scope: t.arrayExpression([t.numericLiteral(path.scope.uid), t.numericLiteral(path.scope.uid + 1)])
                                }))
                        })
                        path.node.body.body = [t.expressionStatement(t.updateExpression('++', newNode.declarations[0].id)), ...variables, ...path.node.body.body]
                    }
                }
            },
            "BinaryExpression|LogicalExpression"(path) {
                path.replaceWith(traverseBinary(path, path.node))
            },
            "CallExpression|NewExpression"(path) {
                path.replaceWith(traverseCall(path, path.node))
            },
            ConditionalExpression(path) {
                path.replaceWith(traverseConditional(path, path.node))
            },
            UnaryExpression(path) {
                path.replaceWith(traverseUnary(path, path.node))
            },
            ObjectExpression(path) {
                traverseObject(path, path.node)
            },
            ArrayExpression(path) {
                traverseArray(path, path.node)
            },
            Expression: {
                enter(path) {
                    if (t.isMemberExpression(path) && path.node.object.name === _name) return
                    if (t.isObjectProperty(path.parent) && path.parent.key.name === '_exec') return
                    if (t.isUpdateExpression(path)) return
                    if (t.isThisExpression(path)) return
                    if (t.isCallExpression(path) && t.isMemberExpression(path.node.callee) && isBarredObject(path.node.callee.object.name)) return

                    if (t.isCallExpression(path) && t.isIdentifier(path.node.callee) && path.node.callee.name[0] === '_') return
                    if (t.isLiteral(path)) return
                    if (t.isArrayExpression(path) && !t.isAssignmentExpression(path.parent) && !t.isReturnStatement(path.parent)) {
                        return
                    }
                    if (t.isObjectExpression(path) && !t.isVariableDeclarator(path.parent)) {
                        return
                    }
                    if (t.isLVal(path) || t.isAssignmentExpression(path) || t.isFunction(path)) {
                        return
                    };

                    if (willTraverse(path)) {
                        return
                    } else {
                        console.log(path.node)
                        const name = code.slice(path.node.start, path.node.end)
                        const details = {
                            scope: getScope(path)
                        }
                        details.type = TYPES.EXPRESSION
                        if (path.node.start) details.name = name;
                        const node = proxy(path.node, details)
                        path.replaceWith(node)
                        path.skip()
                    }
                },
            },
        }
    }
}