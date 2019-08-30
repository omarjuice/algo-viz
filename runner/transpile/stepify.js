const ASThelpers = require('./ast-helpers')
const t = require('@babel/types')
const TYPES = require('../execute/utils/types')

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
            reassignSprad,
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
                    createId = helpers.createId
                    references = path.scope.references
                    //strict mode enforcement
                    path.node.body.unshift(
                        t.stringLiteral("use strict"),
                        proxy(t.nullLiteral(), { type: TYPES.PROGRAM, scope: getScope(path) })
                    )
                },
                Function: {
                    enter(path, { opts }) {
                        // if (path.node.id && path.node.id.name && path.node.id.name[0] === '_' && !t.isAssignmentExpression(path.parent) && !t.isVariableDeclarator(path.parent)) {
                        //     return path.skip()
                        // }
                        if (path.node.async && opts.disallow.async) throw new Error('async functions are disallowed')
                        // if (path.node.generator && opts.disallow.generator) throw new Error('generators are disallowed')

                        //put the params as declarations
                        const params = path.node.params.map(param => param.name && param.name[0] !== '_' && t.expressionStatement(
                            proxy(
                                param,
                                {
                                    type: TYPES.DECLARATION,
                                    varName: param.name,
                                    scope: getScope(path),
                                    block: true
                                }
                            )
                        ) || null);

                        const isClassMethod = t.isClassMethod(path.node)
                        // console.log(path.parent)
                        let funcName;
                        if (path.node.id) {
                            funcName = path.node.id.name
                        } else if (t.isVariableDeclarator(path.parent)) {
                            if (path.parent.id.name[0] === '_') return path.skip()
                            funcName = path.parent.id.name
                        } else if (t.isObjectProperty(path.parent) && !path.parent.computed) {
                            if (path.parent.key.name[0] === '_') return path.skip()
                            funcName = 'method:' + path.parent.key.name
                        } else if (t.isCallExpression(path.parent) || t.isNewExpression(path.parent)) {
                            if (t.isMemberExpression(path.parent.callee)) {
                                const { object, props } = computeAccessor(path, path.parent.callee)
                                if (!isBarredObject(object.name, false)) {
                                    funcName = t.binaryExpression('+', t.stringLiteral(object.name), t.stringLiteral('.'))
                                    for (const p of props) {
                                        // funcName += '.' + (t.isIdentifier(p) ? p.name : p.value)
                                        funcName = t.binaryExpression('+', t.binaryExpression('+', funcName, p), t.stringLiteral('.'))
                                    }
                                    const idx = path.parent.arguments.indexOf(path.node)
                                    funcName = t.binaryExpression('+', funcName, t.stringLiteral(`(callback-${idx})`))
                                }

                            } else if (t.isIdentifier(path.parent.callee)) {
                                const idx = path.parent.arguments.indexOf(path.node)
                                funcName = path.parent.callee.name + '(callback-' + idx + ')'
                            }
                        } else if (t.isClassMethod(path.node)) {
                            const parent = path.findParent(p => t.isClassDeclaration(p))
                            if (t.isIdentifier(parent.node.id)) {
                                if (t.isIdentifier(path.node.key)) {
                                    if (path.node.key.name[0] === '_') return path.skip()
                                    funcName = parent.node.id.name + '.' + path.node.key.name
                                }
                            }
                        }
                        const funcID = createId(4, 1)
                        if (!funcName) funcName = funcID

                        path.node.funcName = funcName
                        path.node.funcID = funcID
                        // this is for the callstack management
                        const details = {
                            type: isClassMethod ? TYPES.METHOD : TYPES.FUNC,
                            scope: getScope(path),
                            funcName,
                            funcID
                        }
                        // we need to know class methods because of their weird scoping
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
                                ...params.filter(p => p),
                                t.returnStatement(path.node.body)
                            ])
                        }
                    }
                },
                ClassDeclaration(path) {
                    if (path.node.superClass) {
                        throw new Error('Class extension is not supported yet.')
                    };
                },
                BlockStatement(path) {
                    if (!t.isFunction(path.parent)) {
                        // we need this for scope chain traversal
                        path.node.body.unshift(proxy(t.nullLiteral(), { type: TYPES.BLOCK, scope: getScope(path) }))
                    }
                },

                ReturnStatement: {
                    exit(path) {
                        // for call stack management
                        const parent = path.findParent(parent => t.isFunction(parent))
                        if (!path.node.argument) {
                            path.node.argument = t.identifier('undefined')
                        }
                        path.node.argument = proxy(path.node.argument, {
                            type: TYPES.RETURN,
                            scope: getScope(parent),
                            funcName: parent.node.funcName,
                            funcID: parent.node.funcID
                        })
                    }
                },
                VariableDeclaration: {
                    exit(path) {
                        if (t.isForInStatement(path.parent) || t.isForOfStatement(path.parent)) return
                        path.node.declarations.forEach((declaration) => {
                            const { id: identifier, init } = declaration
                            if (identifier.name[0] !== '_') {
                                if (!t.isFunction(init)) {
                                    if (t.isCallExpression(init) && t.isMemberExpression(init.callee) && isBarredObject(init.callee.object.name)) {
                                        if (init.callee.object.name !== _name) return
                                    }
                                    if (!init || !declaration.init.visited) {
                                        const details = {
                                            type: TYPES.DECLARATION,
                                            varName: identifier.name,
                                            scope: getScope(path),
                                            block: path.node.kind !== 'var',
                                        }
                                        if (path.node.start) {
                                            details.name = t.arrayExpression([t.numericLiteral(path.node.start), t.numericLiteral(path.node.end)])
                                        }
                                        declaration.init = proxy(
                                            init || t.identifier('undefined'), details
                                        )
                                    }
                                    declaration.init.visited = true
                                }
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
                            // we need to know if/when a new property is created on an object
                            details.type = TYPES.EXPRESSION;
                        } else {
                            details.varName = assignment.left.name
                        }
                        path.replaceWith(proxy(assignment, details))
                    }
                },
                UpdateExpression: {
                    exit(path) {
                        const details = { type: TYPES.ASSIGNMENT, scope: getScope(path) }
                        if (!path.node.start) return
                        if (t.isIdentifier(path.node.argument)) {
                            if (isBarredObject(path.node.argument.name)) return
                        }
                        if (t.isExpressionStatement(path.parent)) {
                            // better for yielding the current value of the variable
                            path.node.prefix = true
                        } else {
                            details.update = path.node.operator === '++' ? 1 : -1
                        }
                        if (t.isMemberExpression(path.node.argument)) {
                            // setters will take care of it
                            delete details.update;
                            details.type = TYPES.EXPRESSION
                        }
                        details.varName = path.node.argument.name
                        path.replaceWith(proxy(path.node, details))
                    }

                },
                "For|While|DoWhileStatement": {
                    enter(path) {
                        if (!t.isBlockStatement(path.node.body)) {
                            //we need to put things into the bodies so we need a block statement
                            path.node.body = t.blockStatement([path.node.body])
                        }


                    },
                    exit(path) {
                        const details = {
                            type: TYPES.BLOCK,
                            scope: getScope(path)
                        }
                        if (path.node.test && !path.node.test._isProxy) {
                            path.node.test = proxy(path.node.test, details)
                        }
                        if (t.isDoWhileStatement(path)) {
                            path.node.body.body.unshift(proxy(t.nullLiteral(), details))
                        }
                    }
                },



                IfStatement: {
                    exit(path) {
                        if (!t.isBlockStatement(path.node.consequent)) {
                            path.node.consequent = t.blockStatement([path.node.consequent])
                        }
                        path.node.test = proxy(path.node.test, {
                            type: TYPES.BLOCK,
                            scope: getScope(path)
                        })

                    }
                },
                MemberExpression: {
                    exit(path) {
                        if (isBarredObject(path.node.object.name, false)) {
                            return path.stop()
                        }
                        if (!t.isExpression(path.parent)) {
                            const expression = path.node
                            if (!expression.start) return
                            const details = {
                                scope: getScope(path),
                            }

                            details.type = TYPES.EXPRESSION

                            path.replaceWith(proxy(expression, details))
                        }
                    }
                },
                ForStatement(path) {
                    if (t.isBlockStatement(path.node.body)) {

                        if (path.node.update && t.isUpdateExpression(path.node.update)) {
                            //yielding the correct current value of i
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
                                        varName: identifier.name,
                                        scope: getScope(path),
                                        block: path.node.left.kind !== 'var'
                                    }
                                )))
                            })

                            path.node.body.body = [
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

                        details.type = TYPES.EXPRESSION


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
                        const details = { scope: getScope(path), type: TYPES.CALL }


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
                        if (unary.operator === '-' && unary.prefix) return
                        // we have to know when something was deleted

                        const details = {
                            type: TYPES.EXPRESSION,
                            scope: getScope(path),

                        }
                        if (!unary.start) return
                        path.replaceWith(proxy(unary, details))

                    }
                },
                ThisExpression: {
                    exit(path) {
                        path.replaceWith(proxy(path.node, {
                            type: TYPES.THIS
                        }))
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
                            // if (t.isSequenceExpression(path.node)) {
                            //     console.log(path.parent);
                            // }
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