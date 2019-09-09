const ASThelpers = require('./ast-helpers')
const t = require('@babel/types')
const TYPES = require('../execute/utils/types')

module.exports = function (input) {
    return function () {
        let Node,
            _name,
            code,
            proxy,
            isBarredObject,
            getScope,
            traverseParameters,
            traverseDeclarations,
            traverseAssignments,
            createId;

        const thisArgNode = t.conditionalExpression(
            t.binaryExpression("===", t.thisExpression(), t.identifier('global')),
            t.nullLiteral(),
            t.thisExpression()

        )
        return {
            visitor: {
                Program(path, { file: { code: original }, opts }) {
                    Node = path.node.constructor
                    code = original
                    input.references = { ...input.references, ...path.scope.references }
                    const helpers = ASThelpers({ t, input, code, Node })
                    _name = input._name
                    traverseParameters = helpers.traverseParameters
                    traverseDeclarations = helpers.traverseDeclarations
                    traverseAssignments = helpers.traverseAssignments
                    proxy = helpers.proxy
                    isBarredObject = helpers.isBarredObject
                    getScope = helpers.getScope
                    createId = helpers.createId

                    //strict mode enforcement
                    path.node.body.unshift(
                        t.stringLiteral("use strict"),
                        proxy(t.nullLiteral(), { type: TYPES.PROGRAM, scope: getScope(path) })
                    )
                },
                Function: {
                    enter(path, { opts }) {

                        if (path.node.async && opts.disallow.async) throw new Error('async functions are disallowed')

                        //put the params as declarations
                        const params = [];

                        path.get("params").forEach(traverseParameters(path, params))

                        const isClassMethod = t.isClassMethod(path.node)
                        let funcName;
                        if (path.node.id) {
                            funcName = path.node.id.name
                        } else if (t.isVariableDeclarator(path.parent) && t.isIdentifier(path.parent.id)) {
                            funcName = path.parent.id.name
                        } else if (t.isObjectProperty(path.parent) && !path.parent.computed) {
                            funcName = 'method:' + path.parent.key.name
                        } else if (t.isCallExpression(path.parent) || t.isNewExpression(path.parent)) {
                            if (t.isMemberExpression(path.parent.callee)) {
                                const idx = path.parent.arguments.indexOf(path.node)
                                funcName = t.stringLiteral(`callback-${idx}`)

                            } else if (t.isIdentifier(path.parent.callee)) {
                                const idx = path.parent.arguments.indexOf(path.node)
                                funcName = path.parent.callee.name + '(callback-' + idx + ')'
                            }
                        } else if (t.isClassMethod(path.node)) {
                            const parent = path.findParent(p => t.isClassDeclaration(p))
                            if (t.isIdentifier(parent.node.id)) {
                                if (t.isIdentifier(path.node.key)) {
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
                        }
                        details.object = thisArgNode

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
                            funcID: parent.node.funcID,
                            object: thisArgNode
                        })
                    }
                },
                VariableDeclaration: {
                    exit(path) {
                        const declarations = []
                        const isFor = t.isForInStatement(path.parent) || t.isForOfStatement(path.parent)
                        path.get("declarations").forEach(traverseDeclarations(path, isFor, declarations))

                        if (isFor) {
                            const parent = path.findParent(parent => t.isFor(parent))

                            parent.node.body.body = [
                                ...declarations.map(([node, details]) => proxy(node, details)),
                                ...parent.node.body.body
                            ]

                        }
                    },
                },

                AssignmentExpression: {
                    exit(path) {
                        if (t.isMemberExpression(path.node.left)) {
                            const details = { type: TYPES.EXPRESSION, scope: getScope(path) }
                            path.replaceWith(proxy(path.node, details))
                        }
                        const details = [];
                        const base = { type: TYPES.ASSIGNMENT, scope: getScope(path) }
                        if (t.isIdentifier(path.node.left)) {
                            details.push({ ...base, varName: path.node.left.name })
                        } else {
                            path.get("left").traverse(traverseAssignments(details, base))
                        }
                        while (details.length) {
                            path.replaceWith(proxy(path.node, details.shift()))
                        }
                    }
                },
                UpdateExpression: {
                    exit(path) {
                        const details = { type: TYPES.ASSIGNMENT, scope: getScope(path) }
                        if (!path.node.start) return
                        if (t.isIdentifier(path.node.argument)) {
                            if (isBarredObject(path.node.argument.name)) return
                        }
                        if (!path.node.prefix) {
                            details.update = path.node.operator === '++' ? 1 : -1
                        }
                        if (t.isMemberExpression(path.node.argument)) {
                            // setters will take care of it
                            delete details.update;
                            details.type = TYPES.EXPRESSION
                        } else {
                            details.varName = path.node.argument.name
                        }
                        path.replaceWith(proxy(path.node, details))
                    }

                },
                "For|WhileStatement|DoWhileStatement": {

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
                        path.insertBefore(proxy(t.nullLiteral(), details))
                    }
                },
                IfStatement: {
                    exit(path) {
                        if (!t.isBlockStatement(path.node.consequent)) {
                            path.node.consequent = t.blockStatement([path.node.consequent])
                        }
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
                        if (t.isCallExpression(path) || t.isNewExpression(path)) return
                        if (t.isLVal(path) || t.isFunction(path)) {
                            return
                        };

                        const details = {
                            scope: getScope(path)
                        }
                        details.type = TYPES.EXPRESSION
                        const node = proxy(path.node, details)
                        path.replaceWith(node)

                    },
                },
            }
        }
    }
}