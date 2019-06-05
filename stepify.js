
// const { parseExpression } = require('@babel/parser')
// const { CodeGenerator } = require('@babel/generator')
const ASThelpers = require('./ast-helpers')
const t = require('@babel/types')
const TYPES = require('./utils/types')

module.exports = function (input) {
    return function () {
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
            createId;

        return {
            visitor: {
                Program(path, { file: { code: original }, opts }) {
                    Node = path.node.constructor
                    code = original
                    input.references = { ...input.references, ...path.scope.references }
                    const helpers = ASThelpers({ t, input, code, Node })
                    _name = input._name
                    willTraverse = helpers.willTraverse
                    reducePropExpressions = helpers.reducePropExpressions
                    getAccessorProxy = helpers.getAccessorProxy
                    reassignComputedValue = helpers.reassignComputedValue
                    construct = helpers.construct
                    computeAccessor = helpers.computeAccessor
                    proxyAssignment = helpers.proxyAssignment
                    proxy = helpers.proxy
                    randomString = helpers.randomString
                    isBarredObject = helpers.isBarredObject
                    getScope = helpers.getScope
                    reassignSpread = helpers.reassignSpread
                    createId = helpers.createId
                    references = path.scope.references
                    path.node.body.unshift(t.stringLiteral("use strict"), proxy(t.nullLiteral(), { type: TYPES.PROGRAM, scope: getScope(path) }))
                },
                Function: {
                    enter(path, { opts }) {
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
                        const isClassMethod = t.isClassMethod(path.node)
                        path.node.id = path.node.id || t.identifier(createId(4, 1))
                        const details = {
                            type: isClassMethod ? TYPES.METHOD : TYPES.FUNC,
                            scope: getScope(path),
                            name: path.node.id.name,
                        }
                        if (isClassMethod) {
                            details.kind = path.node.kind
                            details.object = t.thisExpression()
                        }
                        const newNode = proxy(t.nullLiteral(), details)
                        if (t.isBlockStatement(path.node.body)) {
                            const block = path.node.body
                            block.body = [newNode, ...params.filter(p => p), ...block.body]
                            if (isClassMethod) {
                                block.body.unshift(proxy(t.nullLiteral(), {
                                    type: TYPES.BLOCK,
                                    scope: t.arrayExpression([t.numericLiteral(path.scope.parent.parent.uid), t.numericLiteral(path.scope.parent.uid)])
                                }))
                            }
                            if (!t.isReturnStatement(block.body[block.body.length - 1])) {
                                block.body.push(t.returnStatement(t.identifier('undefined')))
                            }
                        } else {
                            path.node.body = t.blockStatement([
                                t.expressionStatement(
                                    newNode),
                                t.returnStatement(path.node.body)
                            ])
                        }
                    }
                },
                BlockStatement(path) {
                    if (!t.isFunction(path.parent)) {
                        path.node.body.unshift(proxy(t.nullLiteral(), { type: TYPES.BLOCK, scope: getScope(path) }))
                    }
                },

                ReturnStatement: {
                    exit(path) {
                        const parent = path.findParent(parent => t.isFunction(parent))
                        path.node.argument = proxy(path.node.argument, {
                            type: TYPES.RETURN,
                            scope: getScope(parent),
                            name: parent.node.id.name
                        })
                    }
                },
                VariableDeclaration: {
                    exit(path) {
                        path.node.declarations.forEach((declaration) => {
                            const { id: identifier, init } = declaration
                            if (identifier.name[0] !== '_' && init && !t.isFunction(init)) {
                                if (t.isCallExpression(init) && t.isMemberExpression(init.callee) && isBarredObject(init.callee.object.name)) {
                                    if (init.callee.object.name !== _name) return
                                }
                                if (!declaration.init.visited) declaration.init = proxy(
                                    init, {
                                        type: TYPES.DECLARATION,
                                        name: identifier.name,
                                        scope: getScope(path),
                                        block: path.node.kind !== 'var'
                                    }
                                )
                                declaration.init.visited = true
                                // newNodes.unshift(proxy(identifier, { type: TYPES.DECLARATION, name: identifier.name, scope: getScope(path) }))
                            }

                        });
                    },
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
                        if (name) {
                            details.name = name
                        }
                        if (t.isMemberExpression(path.node.argument)) {
                            const { object, expression } = computeAccessor(path, path.node.argument)
                            if (!object) return
                            details.type = TYPES.PROP_ASSIGNMENT;
                            details.object = object
                            details.objectName = object.name
                            details.access = expression
                            if (object.name) details
                        } else if (t.isIdentifier(path.node.argument)) {
                            if (isBarredObject(path.node.argument.name)) return
                        }
                        if (t.isExpressionStatement(path.parent)) {
                            path.node.prefix = true
                        } else {
                            details.update = path.node.operator === '++' ? 1 : -1
                        }
                        path.replaceWith(proxy(path.node, details))

                    }

                },
                "For|While|DoWhileStatement"(path) {
                    if (!t.isBlockStatement(path.node.body)) {
                        path.node.body = t.blockStatement([path.node.body])
                    }
                    if (t.isFor(path.node)) {
                        const { init, test, update } = path.node
                        if (!t.isExpression(init) && !t.isExpression(update)) {
                            if (t.isIdentifier(test)) {
                                path.node.test = proxy(path.node.test, {
                                    type: TYPES.BLOCK,
                                    scope: getScope(path)
                                })
                            }
                        }
                    }
                    if (t.isWhile(path.node)) {
                        const { test } = path.node
                        if (t.isIdentifier(test)) {
                            path.node.test = proxy(path.node.test, {
                                type: TYPES.BLOCK,
                                scope: getScope(path)
                            })
                        }
                    }
                },
                IfStatement(path) {
                    if (!t.isBlockStatement(path.node.consequent)) {
                        path.node.consequent = t.blockStatement([path.node.consequent])
                    }
                    if (!t.isExpression(path.node.test) || t.isIdentifier(path.node.test)) {
                        path.node.test = proxy(path.node.test, {
                            type: TYPES.BLOCK,
                            scope: getScope(path)
                        })
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
                        if (object) {
                            if (!t.isMemberExpression(path.parent)) {
                                if (t.isCallExpression(path.parent)) return
                                if (t.isAssignmentExpression(path.parent) && path.parent.left === path.node || t.isUpdateExpression(path.parent)) return
                                const details = {
                                    type: TYPES.ACCESSOR,
                                    scope: getScope(path)
                                }
                                const name = path.node.start && code.slice(path.node.start, path.node.end)
                                if (name) details.name = name
                                details.object = object
                                details.objectName = object.name
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
                            let name;
                            if (t.isDeclaration(path.node.init)) {
                                name = path.node.init.declarations[0].id.name
                            } else if (t.isAssignmentExpression(path.node.init)) {
                                name = path.node.init.left.name
                            }
                            if (!name || name[0] === '_') return
                            // path.node.body.body.unshift(proxy(t.identifier(name), { type: TYPES.ASSIGNMENT, name, scope: getScope(path) }))
                        }
                        if (path.node.update && t.isUpdateExpression(path.node.update)) {
                            path.node.update.prefix = true
                        }
                    }
                },
                ForOfStatement: {
                    enter(path) {
                        reassignComputedValue(path, path.node, 'right', true)
                    },
                    exit(path) {
                        if (t.isBlockStatement(path.node.body)) {
                            const iterationName = createId(5, 1)
                            const nearestSibling = path.findParent((parent) => t.isBlockStatement(parent) || t.isProgram(parent))
                            let i = 0;
                            while (nearestSibling.node.body[i] !== path.node) i++
                            const newNode = t.variableDeclaration('let', [t.variableDeclarator(t.identifier(iterationName), t.numericLiteral(-1))])
                            // const newNode = t.assignmentExpression('=', t.memberExpression(t.identifier(_name), t.identifier(iterationName)), t.numericLiteral(-1))
                            nearestSibling.node.body.splice(i, 0, newNode)
                            const variables = [];
                            const accessors = [];
                            (path.node.left.declarations || [{ id: path.node.left }]).forEach(declaration => {
                                const { id: identifier } = declaration
                                variables.push(t.expressionStatement(proxy(
                                    identifier,
                                    {
                                        type: TYPES.DECLARATION,
                                        name: identifier.name,
                                        scope: getScope(path),
                                        block: path.node.left.kind !== 'var'
                                    }
                                )))
                                accessors.push(t.expressionStatement(proxy(
                                    identifier,
                                    {
                                        type: TYPES.ACCESSOR,
                                        name: identifier.name,
                                        object: t.isAssignmentExpression(path.node.right) ? path.node.right.left : path.node.right,
                                        access: t.arrayExpression([t.updateExpression('++', newNode.declarations[0].id, true)]),
                                        scope: getScope(path)
                                    })))
                            })

                            path.node.body.body = [...accessors, ...variables, ...path.node.body.body]
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
                                objectName: object.name,
                                access: expression,
                                name: unary.start && code.slice(unary.start, unary.end)
                            }
                            path.replaceWith(proxy(unary, details))
                        } else {
                            const details = {
                                type: TYPES.EXPRESSION,
                                scope: getScope(path),

                            }
                            if (unary.start) details.name = unary.start && code.slice(unary.start, unary.end)
                            path.replaceWith(proxy(unary, details))
                        }
                    }
                },
                Expression: {
                    exit(path) {
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
}