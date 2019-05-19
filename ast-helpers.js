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
        CALL: 'CALL',
        DELETE: 'DELETE'
    }
    const randomString = (l = 3) => {
        let id = (Math.random() * 26 + 10 | 0).toString(36)
        for (let i = 1; i < l; i++)
            id += (Math.random() * 26 | 0).toString(36)
        return id
    }
    _name = _name || '__' + randomString()
    const isBarredObject = (name) => name && name[0] === '_' || [_name, 'console', 'window', 'global', 'process', 'arguments'].includes(name)


    // Creates a wrapper around expressions to be used by the runner
    const proxy = (node, details) => {
        const _wrapper_id = t.identifier(_name)
        return t.callExpression(
            t.memberExpression(_wrapper_id, t.identifier('__')),
            [node, construct(details) || t.nullLiteral()]
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
                reassignComputedValue(path, props[i])
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
            if (key === 'object') {
                value = typeof val === 'string' ? t.identifier(val) : val
            } else if (_keys.includes(key)) {
                value = val
            } else if (val instanceof Node) {
                value = val
            } else if (typeof val === 'string') {
                value = t.stringLiteral(val)
            } else if (typeof val === 'number') {
                value = t.numericLiteral(val)
            } else if (typeof val === 'boolean') {
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
    const reassignComputedValue = (path, node, key = 'property') => {
        if (t.isAssignmentExpression(node[key])) return
        if (!t.isIdentifier((node[key]))) {
            if (!t.isLiteral(node[key])) {
                traverseExpressionHelper(path, node, key)
                const nearestSibling = path.findParent((parent) => t.isBlockStatement(parent.parent) || t.isProgram(parent.parent))
                let i = 0;
                while (nearestSibling.parent.body[i] !== nearestSibling.node) i++
                const { variable, assignment } = proxyAssignment(node[key], code, { scope: path.scope.uid })
                nearestSibling.parent.body.splice(i, 0, variable)
                node[key] = assignment
                return true
            }
        }
        return false
    }
    // returns proxy for accessors
    const getAccessorProxy = (path, node) => {
        if (isBarredObject(node.object.name)) return node
        if (t.isMemberExpression(node)) {
            reassignComputedValue(path, node)
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
        return proxy(node, details)
    }
    // takes assignments generated from reassignComputedValue and flattens them for use by the proxy
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
    const traverseExpressionHelper = (path, node, key) => {
        if (t.isMemberExpression(node[key]) && !isBarredObject(node[key].object.name)) {
            node[key] = getAccessorProxy(path, node[key])
        } else if (t.isCallExpression(node[key])) {
            node[key] = traverseCall(path, node[key])
        } else if (t.isBinaryExpression(node[key]) || t.isLogicalExpression(node[key])) {
            node[key] = traverseBinary(path, node[key])
        } else if (t.isConditionalExpression(node[key])) {
            node[key] = traverseConditional(path, node[key])
        } else if (t.isAssignmentExpression(node[key])) {
            if (t.isIdentifier(node.left) && node.left.name[0] === '_') return
            node[key] = traverseAssignment(path, node[key])
        } else if (t.isUnaryExpression(node[key])) {
            node[key] = traverseUnary(path, node[key])
        } else if (t.isArrayExpression(node[key])) {
            node[key] = traverseArray(path, node[key])
        } else if (t.isObjectExpression(node[key])) {
            node[key] = traverseObject(path, node[key])
        }
    }
    const traverseBinary = (path, expression) => {
        const details = {
            scope: path.scope.uid,
        }
        if (expression.start) {
            details.name = code.slice(expression.start, expression.end)
        } else {
            return expression
        }
        if (expression.operator === 'in') {
            details.access = reassignComputedValue(path, expression, 'left') ? expression.left.left : expression.left
            details.object = reassignComputedValue(path, expression, 'right') ? expression.right.left : expression.right
            details.type = TYPES.ACCESSOR
        } else {
            traverseExpressionHelper(path, expression, 'left')
            traverseExpressionHelper(path, expression, 'right')
            details.type = TYPES.EXPRESSION
        }

        return proxy(expression, details)
    }
    const traverseCall = (path, call) => {
        if (t.isMemberExpression(call.callee) && isBarredObject(call.callee.object.name)) {
            return call
        }
        if (t.isIdentifier(call.callee) && call.callee.name[0] === '_') {
            return call
        }
        const details = {}
        if (t.isMemberExpression(call.callee)) {
            details.type = TYPES.METHODCALL
            const { object, expression } = computeAccessor(path, call.callee)
            details.object = object
            details.access = expression
        } else {
            details.type = TYPES.CALL
        }
        if (call.start) {
            details.name = code.slice(call.start, call.end)
        } else {
            // return call
        }
        details.arguments = []
        call.arguments.forEach((_, i) => {
            if (t.isAssignmentExpression(call.arguments[i])) {
                const assignmentProxy = traverseAssignment(path, call.arguments[i])
                call.arguments[i] = assignmentProxy
                details.arguments.push(reducePropExpressions(assignmentProxy.arguments[0].left))
            } else {
                reassignComputedValue(path, call.arguments, i)
                details.arguments.push(t.isAssignmentExpression(call.arguments[i]) ? call.arguments[i].left : call.arguments[i])
            }

        })

        return proxy(call, details)
    }

    const traverseConditional = (path, conditional) => {
        const details = {
            scope: path.scope.uid,
            type: TYPES.EXPRESSION,
        }
        if (conditional.start) {
            details.name = code.slice(conditional.start, conditional.end)
        } else {
            return conditional
        }
        traverseExpressionHelper(path, conditional, 'test')
        traverseExpressionHelper(path, conditional, 'consequent')
        traverseExpressionHelper(path, conditional, 'alternate')

        return proxy(conditional, details)
    }
    const traverseAssignment = (path, assignment) => {
        const name = assignment.left.start && code.slice(assignment.left.start, assignment.left.end)
        const details = { type: TYPES.ASSIGNMENT, scope: path.scope.uid }
        if (name) details.name = name
        if (t.isMemberExpression(assignment.left)) {
            const { object, expression } = computeAccessor(path, assignment.left)
            details.type = TYPES.PROP_ASSIGNMENT;
            details.object = object
            details.access = expression
        }
        traverseExpressionHelper(path, assignment, 'right')
        return proxy(assignment, details)
    }
    const traverseUnary = (path, unary) => {
        if (unary.operator === 'delete' && t.isMemberExpression(unary.argument)) {
            const { object, expression } = computeAccessor(path, unary.argument)
            const details = {
                type: TYPES.DELETE,
                scope: path.scope.uid,
                object,
                access: expression,
                name: code.slice(unary.start, unary.end)
            }
            return proxy(unary, details)
        }
        return unary
    }
    const traverseArray = (path, array) => {
        array.elements.forEach((_, i) => {
            traverseExpressionHelper(path, array.elements, i)
        })
        return array
    }
    const traverseObject = (path, object) => {
        object.properties.forEach(prop => {
            traverseExpressionHelper(path, prop, 'key')
            traverseExpressionHelper(path, prop, 'value')
        })
        return object
    }
    // returns whether the path with be manually traversed
    const willTraverse = path => {
        if (t.isBinaryExpression(path) || t.isLogicalExpression(path)) {
            return true
        } else if (t.isCallExpression(path) || t.isNewExpression(path)) {
            return true
        } else if (t.isConditionalExpression(path)) {
            return true
        } else if (t.isUnaryExpression(path)) {
            return true
        } else if (t.isObjectExpression(path) || t.isArrayExpression(path)) {
            return true
        }
        return false
    }
    return {
        TYPES,
        randomString,
        construct,
        isBarredObject,
        reducePropExpressions,
        reassignComputedValue,
        traverseAssignment,
        traverseCall,
        traverseBinary,
        traverseConditional,
        traverseUnary,
        traverseArray,
        traverseObject,
        getAccessorProxy,
        computeAccessor,
        proxyAssignment,
        proxy,
        willTraverse
    }
}

