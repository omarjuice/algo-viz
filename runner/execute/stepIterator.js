const TYPES = require('./utils/types')
const fs = require('fs')
const _ = require('lodash')
module.exports = function (steps, {
    scopeStack = [],
    callStack = [],
    scopeChain = {},
    identifiers = {},
    funcScopes = {},
    calls = {},
    code
}) {
    const states = []
    let callStackLen = 0
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
                while (s.length && (![parent, scope].includes(s[s.length - 1]))) {
                    s.pop()
                }
                if (step.type !== TYPES.RETURN && s[s.length - 1] !== scope) s.push(scope)
            }

        }
        if ([TYPES.ASSIGNMENT, TYPES.DECLARATION].includes(step.type) && step.scope && step.varName) {
            let { varName: name, scope: [_, scope], block } = step
            if (step.type === TYPES.DECLARATION) {
                if (!block) {
                    while (scope && !(scope in funcScopes)) {
                        scope = scopeChain[scope].parent
                    }
                }
                if (!identifiers[scope][name]) {
                    identifiers[scope][name] = [undefined]
                }
                const ids = identifiers[scope][name]
                step.prev = ids[ids.length - 1]
                ids[ids.length - 1] = step.value

            } else if (step.type === TYPES.ASSIGNMENT) {
                let current = scope
                let vals = null
                while (!vals) {
                    vals = identifiers[current][name]
                    current = scopeChain[current].parent
                    if (current === null) break;
                }
                if (vals) {
                    step.prev = vals[vals.length - 1]
                    vals[vals.length - 1] = step.value
                }
            }
        }
        if ([TYPES.FUNC, TYPES.METHOD, TYPES.RETURN].includes(step.type)) {
            const fScope = step.scope[1]
            if (step.type !== TYPES.RETURN) {
                callStack.push(step.funcName)
                funcScopes[fScope] = step.funcName
                const queue = [fScope]
                while (queue.length) {
                    const scope = queue.shift()
                    const ids = identifiers[scope]
                    for (const id in ids) {
                        ids[id].push(undefined)
                    }
                    const { children } = scopeChain[scope]
                    for (const child of children) {
                        queue.push(child)
                    }
                }
            } else {
                callStack.pop()
                const prevVals = {}
                const queue = [fScope]
                while (queue.length) {
                    const scope = queue.shift()
                    if (!prevVals[scope]) prevVals[scope] = {}
                    const ids = identifiers[scope]
                    for (const id in ids) {
                        prevVals[scope][id] = ids[id].pop()
                        if (!ids[id].length) {
                            ids[id].push(undefined)
                        }
                    }
                    const { children } = scopeChain[scope]
                    for (const child of children) {
                        queue.push(child)
                    }
                }
                step.prevVals = prevVals
            }
        }
        // states.push(JSON.stringify(identifiers))
        // console.log(step.type, step.name && code.slice(step.name[0], step.name[1]), identifiers);
        // if (callStack.length !== callStackLen) {
        //     console.log(JSON.stringify(callStack))
        //     callStackLen = callStack.length
        // }
        // console.log(identifiers)
    }
    // fs.writeFileSync('states.json', states)

    const reversed = [...steps].reverse()

    for (const step of reversed) {
        if (step.scope) {
            const [parent, scope] = step.scope

            const s = scopeStack
            if (s[s.length - 1] !== scope) {
                while (s.length && (![parent, scope].includes(s[s.length - 1]))) {
                    s.pop()
                }
                if (![TYPES.METHOD, TYPES.FUNC].includes(step.type) && s[s.length - 1] !== scope) s.push(scope)
            }
        }
        if ([TYPES.ASSIGNMENT, TYPES.DECLARATION].includes(step.type) && step.scope && step.varName) {
            let { varName: name, scope: [_, scope], block } = step
            if (step.type === TYPES.DECLARATION) {
                if (!block) {
                    while (scope && !(scope in funcScopes)) {
                        scope = scopeChain[scope].parent
                    }
                }
                const vals = identifiers[scope][name]
                vals[vals.length - 1] = step.prev //only line
                // undo declaration
            } else if (step.type === TYPES.ASSIGNMENT) {
                let current = scope
                let vals = null
                while (!vals) {
                    vals = identifiers[current][name]
                    current = scopeChain[current].parent
                    if (current === null) break;
                }
                if (vals) {
                    vals[vals.length - 1] = step.prev //only line
                }
                //undo assignment
            }
        }
        if ([TYPES.FUNC, TYPES.METHOD, TYPES.RETURN].includes(step.type)) {
            const fScope = step.scope[1]
            if (step.type === TYPES.RETURN) { // and this
                callStack.push(step.funcName)
                funcScopes[fScope] = step.funcName
                const queue = [fScope]
                while (queue.length) {
                    const scope = queue.shift()
                    const ids = identifiers[scope]
                    for (const id in ids) {
                        const idens = ids[id]
                        if (idens.length === 1 && idens[idens.length - 1] === undefined) {
                            idens[idens.length - 1] = (step.prevVals[scope][id])
                        } else {
                            ids[id].push(step.prevVals[scope][id])
                        }
                    }
                    const { children } = scopeChain[scope]
                    for (const child of children) {
                        queue.push(child)
                    }
                }
            } else {
                callStack.pop()
                const queue = [fScope]
                while (queue.length) {
                    const scope = queue.shift()
                    const ids = identifiers[scope]
                    for (const id in ids) {
                        ids[id].pop()
                        if (!ids[id].length) {
                            ids[id].push(undefined)
                        }
                    }
                    const { children } = scopeChain[scope]
                    for (const child of children) {
                        queue.push(child)
                    }
                }
            }
        }
        const ids = _.cloneDeep(identifiers)
        states.push({ type: step.type, ids })
    }
    fs.writeFileSync('states.json', JSON.stringify({ states }))

    return { scopeChain, scopeStack, callStack, identifiers, funcScopes }
}