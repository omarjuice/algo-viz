
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
                                    block: true
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
                            }

                        });
                    },
                },
                AssignmentExpression: {
                    exit(path) {
                        const assignment = path.node
                        if (assignment.left.name && assignment.left.name[0] === '_') return
                        if (!assignment.start) return
                        const details = { type: TYPES.ASSIGNMENT, scope: getScope(path) }

                        if (t.isMemberExpression(assignment.left)) {
                            // const { object, expression } = computeAccessor(path, assignment.left)
                            details.type = TYPES.PROP_ASSIGNMENT;
                            const objectReassigned = reassignComputedValue(path, assignment.left, 'object')
                            const propReassigned = reassignComputedValue(path, assignment.left, 'property')

                            details.object = objectReassigned ? assignment.left.object.left : assignment.left.object
                            details.access = t.arrayExpression([propReassigned ? assignment.left.property.left : assignment.left.computed ? assignment.left.property : t.stringLiteral(assignment.left.property.name)])
                        }
                        path.replaceWith(proxy(assignment, details))
                    }
                },
                UpdateExpression: {
                    exit(path) {
                        const details = { type: TYPES.ASSIGNMENT, scope: getScope(path) }
                        if (!path.node.start) return
                        if (t.isMemberExpression(path.node.argument)) {
                            return
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
                    exit(path) {
                        if (t.isUnaryExpression(path.parent) && path.parent.operator === 'delete') return
                        // const { object } = computeAccessor(path, path.node)
                        if (isBarredObject(path.node.object.name)) return path.stop()
                        if (!t.isExpression(path.parent)) {
                            if (!path.node.start) return;
                            const details = {
                                scope: getScope(path)
                            }
                            details.type = TYPES.EXPRESSION
                            const node = proxy(path.node, details)
                            path.replaceWith(node)
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
                        }
                        if (path.node.update && t.isUpdateExpression(path.node.update)) {
                            path.node.update.prefix = true
                        }
                    }
                },
                "ForOfStatement|ForInStatement": {
                    exit(path) {
                        if (t.isBlockStatement(path.node.body)) {
                            const variables = [];
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
                            })

                            path.node.body.body = [
                                // ...accessors,
                                ...variables,
                                ...path.node.body.body
                            ]
                        }
                    }
                },
                "BinaryExpression|LogicalExpression": {
                    exit(path) {
                        const expression = path.node
                        if (!expression.start) return
                        const details = {
                            scope: getScope(path),
                        }
                        if (expression.operator === 'in') {
                            details.access = t.arrayExpression([reassignComputedValue(path, expression, 'left') ? expression.left.left : expression.left])
                            details.object = reassignComputedValue(path, expression, 'right') ? expression.right.left : expression.right
                            details.type = TYPES.IN
                        } else {
                            details.type = TYPES.EXPRESSION
                        }

                        path.replaceWith(proxy(expression, details))
                    }
                },
                "CallExpression|NewExpression": {
                    exit(path) {
                        const call = path.node
                        if (!call.start) return
                        if (t.isMemberExpression(call.callee) && isBarredObject(call.callee.object.name)) {
                            return
                        }
                        if (t.isIdentifier(call.callee) && call.callee.name[0] === '_') {
                            return
                        }
                        const details = { scope: getScope(path) }

                        if (t.isMemberExpression(call.callee)) {
                            details.type = TYPES.METHODCALL
                            // const { object, expression } = computeAccessor(path, call.callee)
                            const objectReassigned = reassignComputedValue(path, call.callee, 'object')
                            const propReassigned = reassignComputedValue(path, call.callee, 'property')

                            details.object = objectReassigned ? call.callee.object.left : call.callee.object
                            details.access = t.arrayExpression([propReassigned ? call.callee.property.left : call.callee.computed ? call.callee.property : t.stringLiteral(call.callee.property.name)])
                        } else {
                            details.type = TYPES.CALL
                        }
                        path.replaceWith(proxy(call, details))
                    }
                },

                ConditionalExpression: {
                    exit(path) {
                        const conditional = path.node
                        const details = {
                            scope: getScope(path),
                            type: TYPES.EXPRESSION,
                        }
                        if (!conditional.start) return
                        path.replaceWith(proxy(conditional, details))
                    }
                },
                "ObjectExpression|ArrayExpression": {
                    exit(path) {
                        if (!t.isObjectProperty(path.parent) && !t.isArrayExpression(path.parent)) {
                            const details = {
                                scope: getScope(path)
                            }
                            details.type = TYPES.EXPRESSION
                            const node = proxy(path.node, details)
                            path.replaceWith(node)
                        }
                    }
                },
                UnaryExpression: {
                    exit(path) {
                        const unary = path.node
                        if (unary.operator === 'delete' && t.isMemberExpression(unary.argument)) {
                            // const { object, expression } = computeAccessor(path, unary.argument)
                            const objectReassigned = reassignComputedValue(path, unary.argument, 'object')
                            const propReassigned = reassignComputedValue(path, unary.argument, 'property')


                            const details = {
                                type: TYPES.DELETE,
                                scope: getScope(path),
                                // object,
                                // access: expression,
                            }
                            details.object = objectReassigned ? unary.argument.object.left : unary.argument.object
                            details.access = t.arrayExpression([propReassigned ? unary.argument.property.left : unary.argument.computed ? unary.argument.property : t.stringLiteral(unary.argument.property.name)])
                            path.replaceWith(proxy(unary, details))
                        } else {
                            const details = {
                                type: TYPES.EXPRESSION,
                                scope: getScope(path),

                            }
                            if (!unary.start) return
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
                            const details = {
                                scope: getScope(path)
                            }
                            details.type = TYPES.EXPRESSION
                            const node = proxy(path.node, details)
                            path.replaceWith(node)
                        }
                    },
                },
            }
        }
    }
}