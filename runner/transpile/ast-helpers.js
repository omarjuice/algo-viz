const types = require('@babel/types')
const _ = require('lodash')
const randomString = require('../execute/utils/randomString')
const TYPES = require('../execute/utils/types')
module.exports = function ({ t = types, input, code, Node }) {

    const createId = (l = 3, num_ = 2) => {
        let id;
        while (!id || id in input.references) id = '_'.repeat(num_) + randomString(l)
        input.references[id] = true
        return id
    }
    input._name = createId()
    const { _name } = input
    const isBarredObject = (name) => [_name].includes(name)
    const getNameSlice = (node) => t.arrayExpression([t.numericLiteral(node.start), t.numericLiteral(node.end)])

    // Creates a wrapper around expressions to be used by the runner
    const proxy = (node, details) => {
        if (!node) return node
        const _wrapper_id = t.identifier(_name)
        if (!details.name && node.start) {
            details.name = getNameSlice(node)
        }
        const p = t.callExpression(
            t.memberExpression(_wrapper_id, t.identifier('__')),
            [node, construct(details) || t.nullLiteral()]
        )
        p._isProxy = true
        return p
    }
    // creates an outer variable declaration to assign expressions within properties

    const traverseParameters = (parentPath, params) => {
        return p => {
            if (t.isIdentifier(p)) {
                params.push(t.expressionStatement(
                    proxy(
                        p.node,
                        {
                            type: TYPES.DECLARATION,
                            varName: p.node.name,
                            scope: getScope(parentPath),
                            block: true
                        }
                    )
                ))
            }
            p.traverse({
                Identifier(path) {
                    if (t.isObjectProperty(path.parent)) {
                        if (path.node === path.parent.key) return
                    }
                    if (t.isAssignmentPattern(path.parent)) {
                        if (path.node === path.parent.right) path.stop()
                    }
                    params.push(t.expressionStatement(
                        proxy(
                            path.node,
                            {
                                type: TYPES.DECLARATION,
                                varName: path.node.name,
                                scope: getScope(parentPath),
                                block: true
                            }
                        )))
                },

            })
        }
    }

    const traverseDeclarations = (parentPath, declarations) => {
        return declaration => {
            const id = declaration.get("id");
            if (t.isIdentifier(id)) {
                const details = {
                    type: TYPES.DECLARATION,
                    varName: id.node.name,
                    scope: getScope(parentPath),
                    block: parentPath.node.kind !== 'var',
                }
                declarations.push([id.node, details])
                return
            }
            id.traverse({
                Identifier: {
                    enter(path) {
                        if (t.isObjectProperty(path.parent)) {
                            if (path.node === path.parent.key) return
                        }
                        if (t.isAssignmentPattern(path.parent)) {
                            if (path.node !== path.parent.left) return path.stop();
                        }
                        const details = {
                            type: TYPES.DECLARATION,
                            varName: path.node.name,
                            scope: getScope(path),
                            block: parentPath.node.kind !== 'var',

                        }
                        declarations.push([path.node, details])
                    }
                },
                Expression(path) {
                    path.stop()
                }
            })
        }
    }
    traverseAssignments = (details, base) => {
        return {
            Identifier(path) {
                if (t.isObjectProperty(path.parent)) {
                    if (path.node === path.parent.key) return path.skip()
                }
                if (t.isAssignmentPattern(path.parent)) {
                    if (path.node !== path.parent.left) return path.skip();
                }
                details.push({
                    ...base,
                    varName: path.node.name,
                    name: t.arrayExpression([t.numericLiteral(path.node.start), t.numericLiteral(path.node.end)])
                })
            },
            Expression(path) {
                path.stop()
            }
        }
    }
    // creates a node for the details object
    const construct = (obj) => {
        // obj._exec = t.memberExpression(t.identifier(_name), t.identifier('execute'))
        const props = []
        for (let key in obj) {
            const val = obj[key];

            let value;
            if (key === 'object') {
                value = typeof val === 'string' ? t.identifier(val) : val
            } else if (key === 'access') {
                value = val
            } else if (val instanceof Node) {
                value = val
            } else if (typeof val === 'string') {
                value = t.stringLiteral(val)
            } else if (typeof val === 'number') {
                value = t.numericLiteral(val)
            } else if (typeof val === 'boolean') {
                value = t.booleanLiteral(val)
            } else if (t.isExpression(val)) {
                value = val
            } else if (Array.isArray(val)) {
                value = t.arrayExpression(val)
            } else if (t.isExpression(val)) {
                value = val
            } else if (typeof val === 'object') {
                value = construct(val)
            }
            if (value) props.push(t.objectProperty(t.identifier(key), value))
        }
        return t.objectExpression(props)
    }


    const getScope = path => {
        if (path.scope) {
            return t.arrayExpression(
                [
                    path.scope.parent ? t.numericLiteral(path.scope.parent.uid) : t.nullLiteral(),
                    t.numericLiteral(path.scope.uid)
                ]
            )
        }
        return t.nullLiteral()
    }
    return {
        createId,
        isBarredObject,
        proxy,
        getScope,
        createId,
        traverseParameters,
        traverseDeclarations,
        traverseAssignments
    }
}

