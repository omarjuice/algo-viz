const types = require('@babel/types')
const _ = require('lodash')
module.exports = function ({ t = types, _name, code, Node }) {
    const TYPES = {
        DECLARATION: 'DECLARATION',
        ASSIGNMENT: 'ASSIGNMENT',
        PROP_ASSIGNMENT: 'PROP_ASSIGNMENT',
        ACCESSOR: 'ACCESSOR',
        EXPRESSION: 'EXPRESSION',
        METHODCALL: 'METHODCALL',
        CALL: 'CALL'
    }

    const randomString = (l = 3) => {
        let id = (Math.random() * 26 + 10 | 0).toString(36)
        for (let i = 1; i < l; i++)
            id += (Math.random() * 26 | 0).toString(36)
        return id
    }
    _name = _name || '__' + randomString()

    // Creates a wrapper around expressions to be used by the runner
    const proxy = (node, details) => {
        const _wrapper_id = t.identifier(_name)
        return t.callExpression(
            t.memberExpression(_wrapper_id, t.identifier('__')),
            [node, details || t.nullLiteral()]
        )
    }
    // creates an outer variable declaration to assign expressions within properties
    const proxyAssignment = (node, code, details) => {
        const varName = '_' + randomString(6);
        const id = t.identifier(varName)
        return {
            variable: t.variableDeclaration(
                "let",
                [t.variableDeclarator(
                    id,
                )]
            ),
            assignment: t.assignmentExpression('=', id, node)
        }
    }
    //iterates through the chain of access of an object to get the computed accessor
    const computeAccessor = (path, memberExpression) => {
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
                reassignComputedProperty(path, props[i])
                expression = t.binaryExpression('+',
                    expression || t.stringLiteral(""),
                    t.binaryExpression('+',
                        t.binaryExpression('+',
                            t.stringLiteral('['),
                            t.isAssignmentExpression(props[i].property) ? props[i].property.left : props[i].property
                        ),
                        t.stringLiteral(']')
                    )
                )
            }
        }
        return { object, expression }
    }
    const _keys = ['_exec', 'access']
    // creates a node for the details object
    const construct = (obj) => {
        // obj._exec = t.memberExpression(t.identifier(_name), t.identifier('execute'))
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
    // makes the computed property into an assignment to a new variable so that it can be used for the runner
    const reassignComputedProperty = (path, node) => {
        if (t.isAssignmentExpression(node.property)) return
        if (!t.isIdentifier((node.property))) {
            if (!t.isLiteral(node.property)) {
                if (t.isCallExpression(node.property)) {
                    node.property = traverseCall(path, node.property)
                } else if (t.isBinaryExpression(node.property) || t.isLogicalExpression(node.property)) {
                    node.property = traverseBinary(path, node.property)
                }
                const nearestSibling = path.findParent((parent) => t.isBlockStatement(parent.parent) || t.isProgram(parent.parent))
                let i = 0;
                while (nearestSibling.parent.body[i] !== nearestSibling.node) i++
                const { variable, assignment } = proxyAssignment(node.property, code, { scope: path.scope.uid })
                nearestSibling.parent.body.splice(i, 0, variable)
                node.property = assignment
            }
        }
    }
    // returns proxy for accessors
    const getAccessorProxy = (path, node) => {
        if (t.isMemberExpression(node)) {
            reassignComputedProperty(path, node)
        } else {
            return node
        }
        const { object, expression } = computeAccessor(path, node)
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
    // takes assignments generated from `reassignComputedProperty` and flattens them for use by the
    const reducePropExpressions = (node) => {
        if (!t.isMemberExpression(node)) return node
        let nodeCopy = _.cloneDeep(node)
        let i = nodeCopy
        while (t.isMemberExpression(i)) {
            if (t.isAssignmentExpression(i.property)) {
                i.property = i.property.left
            }
            i = i.object
        }
        return nodeCopy
    }
    const traverseBinaryHelper = (path, expression, side) => {
        if (t.isMemberExpression(expression[side])) {
            if (expression[side].object.name !== _name) {
                expression[side] = getAccessorProxy(path, expression[side])
            }
        } else if (t.isCallExpression(expression[side])) {
            expression[side] = traverseCall(path, expression[side])
        } else if (t.isBinaryExpression(expression[side]) || t.isLogicalExpression(expression[side])) {
            expression[side] = traverseBinary(path, expression[side])
        }
    }
    const traverseBinary = (path, expression) => {
        traverseBinaryHelper(path, expression, 'left')
        traverseBinaryHelper(path, expression, 'right')
        const details = {
            scope: path.scope.uid,
            type: TYPES.EXPRESSION,
        }
        if (expression.start) details.name = code.slice(expression.start, expression.end)
        return proxy(expression, construct(details))
    }
    const traverseCall = (path, call) => {
        call.arguments = call.arguments.map(node => {
            if (t.isMemberExpression(node)) {
                node = getAccessorProxy(path, node)
            } else if (t.isCallExpression(node)) {
                node = traverseCall(path, node)
            } else if (t.isBinaryExpression(node) || t.isLogicalExpression(node)) {
                node = traverseBinary(path, node)
            }
            return node
        })
        const details = {}
        if (t.isMemberExpression(call.callee)) {
            details.type = TYPES.METHODCALL
            const { object, expression } = computeAccessor(path, call.callee)
            details.object = object
            details.access = expression
        } else {
            details.type = TYPES.CALL
        }
        if (call.start) details.name = code.slice(call.start, call.end)
        return proxy(call, construct(details))
    }

    return { traverseCall, traverseBinary, reducePropExpressions, getAccessorProxy, reassignComputedProperty, construct, computeAccessor, proxyAssignment, proxy, randomString, TYPES }
}