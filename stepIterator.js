const TYPES = require('./utils/types')
const fs = require('fs')
module.exports = function (steps, {
    scopeStack = [],
    callStack = [],
    scopeChain = {},
    identifiers = {},
    funcScopes = {},
    calls = {} }) {
    for (const step of steps) {
        if (step.scope) {
            const [parent, scope] = step.scope
            if (!(scope in identifiers)) {
                identifiers[scope] = {}
            }
            if (!(scope in scopeChain)) {
                scopeChain[scope] = { parent, children: [] }
                if (parent !== null) {
                    scopeChain[parent].children.push(scope)
                }
            }
            const s = scopeStack
            if (s[s.length - 1] !== scope) {
                let funcParent = scopeChain[scope].parent
                while (funcParent && !(funcParent in funcScopes)) {
                    funcParent = scopeChain[funcParent].parent
                }
                while (s.length && (![parent, scope].includes(s[s.length - 1]))) {
                    const exitedScope = s.pop()
                    if (funcParent) {
                        const name = funcScopes[funcParent]
                        if (calls[name] <= 1) {
                            delete identifiers[exitedScope]
                        }
                    }

                }
                if (step.type !== TYPES.RETURN && s[s.length - 1] !== scope) s.push(scope)
            }
        }
        if ([TYPES.ASSIGNMENT, TYPES.DECLARATION].includes(step.type) && step.scope && step.name) {
            const { name, scope: [_, scope] } = step
            if (step.type === TYPES.DECLARATION) {
                if (!identifiers[scope][name]) {
                    identifiers[scope][name] = []
                }
                identifiers[scope][name].push(step.value)
            } else if (step.type === TYPES.ASSIGNMENT) {
                let current = scope
                let vals = null
                while (!vals) {
                    vals = identifiers[current][name]
                    current = scopeChain[current].parent
                    if (current === null) break;
                }
                if (vals) {
                    vals[vals.length - 1] = step.value
                }
            }
        }
        if ([TYPES.FUNC, TYPES.RETURN].includes(step.type)) {
            if (step.type === TYPES.FUNC) {
                callStack.push(step.name)
                if (!calls[step.name]) calls[step.name] = 0
                calls[step.name]++
                funcScopes[step.scope[1]] = step.name
            } else {
                callStack.pop()
                const queue = [step.scope[1]]
                while (queue.length) {
                    const scope = queue.shift()
                    const ids = identifiers[scope]
                    for (const id in ids) {
                        ids[id].pop()
                    }
                    const { children } = scopeChain[scope]
                    for (const child of children) {
                        queue.push(child)
                    }
                }
                calls[step.name]--
            }
        }
        fs.appendFileSync('states.json', JSON.stringify(identifiers))
    }
    return { scopeChain, scopeStack, calls, callStack, identifiers, funcScopes }
}