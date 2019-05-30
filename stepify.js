
// const { parseExpression } = require('@babel/parser')
// const { CodeGenerator } = require('@babel/generator')
const ASThelpers = require('./ast-helpers')
const t = require('@babel/types')

module.exports = function ({ types }) {
    let Node,
        _name,
        code,
        willTraverse,
        reducePropExpressions,
        getAccessorProxy,
        reassignComputedValue,
        construct,
        computeAccessor,
        proxyAssignment,
        proxy,
        randomString,
        isBarredObject,
        getScope,
        reassignSpread,
        TYPES;

    return {
        visitor: {
            Program(path, { file: { code: original }, opts }) {
                Node = path.node.constructor
                _name = opts.spyName
                code = original
                const helpers = ASThelpers({ t, _name, code, Node })
                willTraverse = helpers.willTraverse
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
                reassignSpread = helpers.reassignSpread
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
                    const block = path.node.body
                    block.body = [...params.filter(p => p), ...block.body]
                    if (!t.isReturnStatement(block.body[block.body.length - 1])) {
                        block.body.push(t.returnStatement(t.identifier('undefined')))
                    }
                }
            },
            ReturnStatement: {
                exit(path) {
                    const parent = path.findParent(parent => t.isFunction(parent))
                    path.node.argument = proxy(path.node.argument, {
                        type: TYPES.RETURN,
                        scope: getScope(parent)
                    })
                }
            },
            VariableDeclaration(path) {
                const newNodes = []
                path.node.declarations.forEach((declaration) => {
                    const { id: identifier, init } = declaration
                    if (identifier.name[0] !== '_' && init && !t.isFunction(init)) {
                        if (t.isCallExpression(init) && t.isMemberExpression(init.callee) && isBarredObject(init.callee.object.name)) {
                            return
                        }
                        if (t.isFor(path.parent) || t.isWhile(path.parent) || t.isIfStatement(path.parent) || t.isDoWhileStatement(path.parent)) {
                            declaration.init = proxy(init, { type: TYPES.DECLARATION, name: identifier.name, scope: getScope(path) })
                        } else {
                            newNodes.push(proxy(identifier, { type: TYPES.DECLARATION, name: identifier.name, scope: getScope(path) }))
                        }

                    }
                });
                newNodes.forEach(node => path.insertAfter(node))
            },
            AssignmentExpression: {
                exit(path) {
                    const assignment = path.node
                    if (assignment.left.name && assignment.left.name[0] === '_') return
                    const name = assignment.left.start && code.slice(assignment.left.start, assignment.left.end)
                    const details = { type: TYPES.ASSIGNMENT, scope: getScope(path) }
                    if (name) details.name = name
                    if (t.isMemberExpression(assignment.left)) {
                        const { object, expression } = computeAccessor(path, assignment.left)
                        details.type = TYPES.PROP_ASSIGNMENT;
                        details.object = object
                        details.objectName = object.name
                        details.access = expression
                    }
                    path.replaceWith(proxy(assignment, details))
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
                    if (t.isUnaryExpression(path.parent) && path.parent.operator === 'delete') return
                    const { object, expression } = computeAccessor(path, path.node)
                    if (!isBarredObject(object.name)) {
                        if (!t.isMemberExpression(path.parent)) {
                            if (t.isCallExpression(path.parent)) return
                            if (t.isAssignmentExpression(path.parent) && path.parent.left === path.node || t.isUpdateExpression(path.parent)) return
                            const details = {
                                type: TYPES.ACCESSOR,
                                scope: getScope(path)
                            }
                            const name = path.node.start && code.slice(path.node.start, path.node.end)
                            if (name) details.name = name
                            details.object = object instanceof Node ? object : object.name ? object.name : 'this'
                            if (object.name) details.objectName = object.name
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
            "BinaryExpression|LogicalExpression": {
                exit(path) {
                    const expression = path.node
                    const details = {
                        scope: getScope(path),
                    }
                    if (expression.start) {
                        details.name = code.slice(expression.start, expression.end)
                    } else {
                        return
                    }
                    if (expression.operator === 'in') {
                        details.access = reassignComputedValue(path, expression, 'left') ? expression.left.left : expression.left
                        details.object = reassignComputedValue(path, expression, 'right') ? expression.right.left : expression.right
                        details.type = TYPES.ACCESSOR
                    } else {
                        details.type = TYPES.EXPRESSION
                    }

                    path.replaceWith(proxy(expression, details))
                }
            },
            "CallExpression|NewExpression": {
                exit(path) {
                    const call = path.node
                    if (t.isMemberExpression(call.callee) && isBarredObject(call.callee.object.name)) {
                        return
                    }
                    if (t.isIdentifier(call.callee) && call.callee.name[0] === '_') {
                        return
                    }
                    const details = { scope: getScope(path) }
                    if (call.start) {
                        details.name = code.slice(call.start, call.end)
                    } else {
                        return
                    }
                    if (t.isMemberExpression(call.callee)) {
                        details.type = TYPES.METHODCALL
                        const { object, expression } = computeAccessor(path, call.callee)
                        details.object = object
                        details.objectName = object.name
                        details.access = expression
                    } else {
                        details.type = TYPES.CALL
                    }

                    details.arguments = []
                    call.arguments.forEach((arg, i) => {
                        if (t.isAssignmentExpression(arg)) {
                            call.arguments[i] = assignmentProxy
                            details.arguments.push(reducePropExpressions(assignmentProxy.arguments[0].left))
                        } else if (t.isSpreadElement(arg)) {
                            const object = reassignSpread(path, arg)
                            details.arguments.push(t.spreadElement(object))
                        } else {
                            const reassigned = reassignComputedValue(path, call.arguments, i)
                            details.arguments.push(reassigned ? call.arguments[i].left : arg)
                        }
                    })
                    path.replaceWith(proxy(call, details))
                }
            },
            SpreadElement: {
                exit(path) {
                    if (!t.isCallExpression(path.parent)) {
                        reassignSpread(path, path.node)
                    }
                }
            },
            ConditionalExpression: {
                exit(path) {
                    const conditional = path.node
                    const details = {
                        scope: getScope(path),
                        type: TYPES.EXPRESSION,
                    }
                    if (conditional.start) {
                        details.name = code.slice(conditional.start, conditional.end)
                    } else {
                        return
                    }
                    path.replaceWith(proxy(conditional, details))
                }
            },
            UnaryExpression: {
                exit(path) {
                    const unary = path.node
                    if (unary.operator === 'delete' && t.isMemberExpression(unary.argument)) {
                        const { object, expression } = computeAccessor(path, unary.argument)
                        const details = {
                            type: TYPES.DELETE,
                            scope: getScope(path),
                            object,
                            access: expression,
                            name: code.slice(unary.start, unary.end)
                        }
                        path.replaceWith(proxy(unary, details))
                    }
                }
            },
            Expression: {
                enter(path) {
                    if (t.isMemberExpression(path) && path.node.object.name === _name) return
                    if (t.isUpdateExpression(path)) return
                    if (t.isThisExpression(path)) return
                    if (t.isLiteral(path)) return
                    if (t.isLVal(path) || t.isFunction(path)) {
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
                    }
                },
            },
        }
    }
}