const types = require('@babel/types')
const _ = require('lodash')
const randomString = require('./utils/randomString')
const TYPES = require('./utils/types')
module.exports = function ({ t = types, input, code, Node }) {

    const createId = (l = 3, num_ = 2) => {
        let id;
        while (!id || id in input.references) id = '_'.repeat(num_) + randomString(l)
        input.references[id] = true
        return id
    }
    input._name = createId()
    const { _name } = input
    const isBarredObject = (name, bar_ = true) => bar_ && name && name[0] === '_' || [_name, 'console', 'window', 'global', 'process', 'arguments'].includes(name)


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
        const varName = createId(5, 1);
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
        while (t.isExpression(object)) {
            if (!t.isMemberExpression(object) && !t.isThisExpression(object)) {
                reassignComputedValue(path, props[0], 'object');
                object = props[0].object
                object.computed = false
            }
            if (object.object) {
                props.unshift(object)
                computed.unshift(object.computed)
                object = object.object
            } else {
                break
            }

        }
        props.unshift(object)
        computed.unshift(object.computed)

        if (isBarredObject(object.name, false)) {
            return { object: null, expression: null }
        }
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
        return {
            object: object instanceof Node ? object : t.isAssignmentExpression(object) ? object.left : object.name ? object.name : t.thisExpression(),
            expression: t.arrayExpression(expression)
        }
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
            if (value) props.push(t.objectProperty(t.identifier(key), value))
        }
        return t.objectExpression(props)
    }
    // makes the computed property into an assignment to a new variable so that it can be used for the runner
    // primarily for nested computations, can be used for reassignments otherwise with directChild
    const reassignComputedValue = (path, node, key = 'property', directChild = false) => {
        if (t.isAssignmentExpression(node[key])) return true
        if (!t.isIdentifier((node[key]))) {
            if (!t.isLiteral(node[key])) {
                // traverseExpressionHelper(path, node, key)
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
        } else if (t.isAssignmentExpression(path)) {
            return true
        }
        return false
    }
    const getScope = path => path.scope ? t.arrayExpression([path.scope.parent ? t.numericLiteral(path.scope.parent.uid) : t.nullLiteral(), t.numericLiteral(path.scope.uid)]) : t.nullLiteral()
    return {
        createId,
        construct,
        isBarredObject,
        reducePropExpressions,
        reassignComputedValue,
        getAccessorProxy,
        computeAccessor,
        proxyAssignment,
        proxy,
        willTraverse,
        getScope,
        reassignSpread,
        createId
    }
}

