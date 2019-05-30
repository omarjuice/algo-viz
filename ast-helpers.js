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
        DELETE: 'DELETE',
        SPREAD: 'SPREAD',
        ARRAY: 'ARRAY',
        OBJECT: 'OBJECT',
        RETURN: 'RETURN'
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
    const proxyAssignment = node => {
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

        let expression = []
        for (let i = 1; i < props.length; i++) {
            if (computed[i]) reassignComputedValue(path, props[i])
            if (t.isAssignmentExpression(props[i].property)) {
                expression.push(props[i].property.left)
            } else if (!t.isIdentifier(props[i].property) || computed[i]) {
                expression.push(props[i].property)
            } else {
                expression.push(t.stringLiteral(props[i].property.name))
            }
        }
        return { object, expression: t.arrayExpression(expression) }
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
            } else if (t.isExpression(val)) {
                value = val
            } else if (Array.isArray(val)) {
                value = t.arrayExpression(val)
            } else if (t.isExpression(val)) {
                value = val
            } else if (typeof val === 'object') {
                value = construct(val)
            }
            props.push(t.objectProperty(t.identifier(key), value))
        }
        return t.objectExpression(props)
    }
    // makes the computed property into an assignment to a new variable so that it can be used for the runner
    // primarily for nested computations, can be used for reassignments otherwise with directChild
    const reassignComputedValue = (path, node, key = 'property', directChild = false) => {
        if (t.isAssignmentExpression(node[key])) return true
        if (!t.isIdentifier((node[key]))) {
            if (!t.isLiteral(node[key])) {
                traverseExpressionHelper(path, node, key)
                const nearestSibling = path.findParent((parent) => t.isBlockStatement(directChild ? parent : parent.parent) || t.isProgram(directChild ? parent : parent.parent))
                let i = 0;
                while (nearestSibling[directChild ? 'node' : 'parent'].body[i] !== (directChild ? node : nearestSibling.node)) i++
                const { variable, assignment } = proxyAssignment(node[key], code, { scope: getScope(path) })
                nearestSibling[directChild ? 'node' : 'parent'].body.splice(i, 0, variable)
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
            scope: getScope(path),

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
    const traverseExpressionHelper = (path, node, key, extra = {}) => {
        if (t.isMemberExpression(node[key]) && !isBarredObject(node[key].object.name)) {
            node[key] = getAccessorProxy(path, node[key], extra)
            return true
        } else if (t.isCallExpression(node[key])) {
            node[key] = traverseCall(path, node[key], extra)
            return true
        } else if (t.isBinaryExpression(node[key]) || t.isLogicalExpression(node[key])) {
            node[key] = traverseBinary(path, node[key], extra)
            return true
        } else if (t.isConditionalExpression(node[key])) {
            node[key] = traverseConditional(path, node[key], extra)
            return true
        } else if (t.isAssignmentExpression(node[key])) {
            if (t.isIdentifier(node.left) && node.left.name[0] === '_') return false
            node[key] = traverseAssignment(path, node[key], extra)
            return true
        } else if (t.isUnaryExpression(node[key])) {
            node[key] = traverseUnary(path, node[key], extra)
            return true
        } else if (t.isArrayExpression(node[key])) {
            node[key] = traverseArray(path, node[key], extra)
            return true
        } else if (t.isObjectExpression(node[key])) {
            node[key] = traverseObject(path, node[key], extra)
            return true
        } else if (t.isSpreadElement(node[key])) {
            reassignSpread(path, node[key])
            return true
        }
        return false
    }
    const reassignSpread = (path, node) => {
        const reassigned = reassignComputedValue(path, node, 'argument')
        const object = reassigned ? node.argument.left : node.argument
        node.argument = proxy(node.argument, {
            type: TYPES.SPREAD,
            object,
            scope: getScope(path)
        })
        return object
    }
    const traverseBinary = (path, expression, extra = {}) => {
        const details = {
            ...extra,
            scope: getScope(path),
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
    const traverseCall = (path, call, extra) => {
        if (t.isMemberExpression(call.callee) && isBarredObject(call.callee.object.name)) {
            return call
        }
        if (t.isIdentifier(call.callee) && call.callee.name[0] === '_') {
            return call
        }
        const details = { scope: getScope(path), ...extra }
        if (t.isMemberExpression(call.callee)) {
            details.type = TYPES.METHODCALL
            const { object, expression } = computeAccessor(path, call.callee)
            details.object = object
            details.objectName = object.name
            details.access = expression
        } else {
            details.type = TYPES.CALL
        }
        if (call.start) {
            details.name = code.slice(call.start, call.end)
        } else {
            return call
        }
        details.arguments = []
        call.arguments.forEach((arg, i) => {
            if (t.isAssignmentExpression(arg)) {
                const assignmentProxy = traverseAssignment(path, arg)
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

        return proxy(call, details)
    }

    const traverseConditional = (path, conditional, extra = {}) => {
        const details = {
            ...extra,
            scope: getScope(path),
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
    const traverseAssignment = (path, assignment, extra = {}) => {
        if (assignment.left.name && assignment.left.name[0] === '_') return assignment
        const name = assignment.left.start && code.slice(assignment.left.start, assignment.left.end)
        const details = { ...extra, type: TYPES.ASSIGNMENT, scope: getScope(path) }
        if (name) details.name = name
        if (t.isMemberExpression(assignment.left)) {
            const { object, expression } = computeAccessor(path, assignment.left)
            details.type = TYPES.PROP_ASSIGNMENT;
            details.object = object
            details.objectName = object.name
            details.access = expression
        }
        traverseExpressionHelper(path, assignment, 'right')
        return proxy(assignment, details)
    }
    const traverseUnary = (path, unary, extra = {}) => {
        if (unary.operator === 'delete' && t.isMemberExpression(unary.argument)) {
            const { object, expression } = computeAccessor(path, unary.argument)
            const details = {
                ...extra,
                type: TYPES.DELETE,
                scope: getScope(path),
                object,
                access: expression,
                name: code.slice(unary.start, unary.end)
            }
            return proxy(unary, details)
        }
        return unary
    }
    const traverseArray = (path, array) => {
        array.elements.forEach((el, i) => {
            traverseExpressionHelper(path, array.elements, i)
        })
        return array
    }
    const traverseObject = (path, object) => {
        object.properties.forEach((prop, i) => {
            if (t.isSpreadElement(prop)) {
                traverseExpressionHelper(path, object.properties, i)
            }
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
    const getScope = path => path.scope.parent ? t.arrayExpression([t.numericLiteral(path.scope.parent.uid), t.numericLiteral(path.scope.uid)]) : t.nullLiteral()
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
        willTraverse,
        getScope
    }
}

