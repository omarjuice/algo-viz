import { observable, action, computed } from "mobx";
import { RootStore } from ".";


type activeIds = {
    name: string
    value: any
}

class StateStore {
    @observable scopeStack: (null | number)[] = []
    @observable callStack: [string, string][] = []
    @observable scopeChain: { [key: string]: Viz.ScopeChainEl } = {}
    @observable identifiers: { [key: string]: Viz.ScopeIdentifiers } = {}
    @observable funcScopes: { [key: string]: string } = {}
    @observable queue: Viz.Step.Any[] = []
    @observable root: RootStore
    constructor(store: RootStore) {
        this.root = store
    }

    @action next(step: Viz.Step.Any) {
        while (this.queue.length) {
            this.next(this.queue.pop())
        }
        if (step.scope) {
            const [parent, scope] = step.scope;
            if (!(scope in this.identifiers)) {
                this.identifiers[scope] = {}
            }
            if (!(scope in this.scopeChain)) {
                this.scopeChain[scope] = { parent, children: [] }
                if (typeof parent === 'number') {
                    this.scopeChain[parent].children.push(scope)
                }
            }
            const s = this.scopeStack
            if (s[s.length - 1] !== scope) {

                if (!step.prevScopeStack) step.prevScopeStack = [...s];
                const newStack = [scope, parent]
                let par = parent
                while (par) {
                    par = this.scopeChain[par].parent
                    newStack.push(par)
                }
                newStack.reverse()

                this.scopeStack = newStack


            }
        }
        if (['ASSIGNMENT', 'DECLARATION'].includes(step.type) && step.scope && step.varName) {
            let { varName: name, block } = step
            let scope: null | number = step.scope[1]
            if (step.type === 'DECLARATION') {
                if (!block) {
                    while (scope && !(scope in this.funcScopes)) {
                        scope = this.scopeChain[scope].parent
                    }
                }
                if (scope !== null) {
                    if (!this.identifiers[scope][name]) {
                        this.identifiers[scope][name] = [undefined]
                    }
                    const vals = this.identifiers[scope][name]
                    step.prev = vals[vals.length - 1]
                    vals[vals.length - 1] = step.value
                }
            } else if (step.type === 'ASSIGNMENT') {
                let current: number | null = scope
                let vals = null
                while (!vals) {
                    vals = this.identifiers[current][name]
                    current = this.scopeChain[current].parent
                    if (current === null) break;
                }
                if (vals) {
                    step.prev = vals[vals.length - 1]
                    vals[vals.length - 1] = step.value
                }
            }
        }
        if (['FUNC', 'METHOD', 'RETURN'].includes(step.type) && step.scope) {
            const fScope: number = step.scope[1]
            if (step.type !== 'RETURN') {
                this.callStack.push([step.funcName, step.funcID])
                this.funcScopes[fScope] = step.funcName
                const queue: number[] = [fScope]
                while (queue.length) {
                    const scope = queue.shift()
                    if (scope) {
                        const ids = this.identifiers[scope]
                        for (const id in ids) {
                            ids[id].push(undefined)
                        }
                        const { children } = this.scopeChain[scope]
                        for (const child of children) {
                            queue.push(child)
                        }
                    }
                }
            } else {

                let i = this.callStack.length - 1;
                while (this.callStack[i][1] !== step.funcID && i >= 0) {
                    i--;
                }
                this.callStack.splice(i, 1);
                step.callIdx = i;
                const prevVals: { [key: string]: any } = {}
                const queue: number[] = [fScope]
                while (queue.length > 0) {
                    const scope = queue.shift()
                    if (typeof scope === 'number') {
                        if (!prevVals[scope]) prevVals[scope] = {};
                        const ids = this.identifiers[scope]
                        for (const id in ids) {
                            prevVals[scope][id] = ids[id].pop()
                            if (!ids[id].length) {
                                ids[id].push(undefined)
                            }
                        }
                        const { children } = this.scopeChain[scope]
                        for (const child of children) {
                            queue.push(child)
                        }
                    }

                }
                step.prevVals = prevVals;
            }
        }
        if ('batch' in step) {
            step.batch.forEach((s) => {
                this.queue.push(s)
            })
        }
        step.executed = true
    }
    @action prev(step: Viz.Step.Any) {
        this.queue = []

        if ('batch' in step) {
            for (let i = step.batch.length - 1; i >= 0; i--) {
                this.prev(step.batch[i])
            }
        }
        if (!step.executed) return
        if (step.scope) {
            this.scopeStack = step.prevScopeStack || this.scopeStack;
        }
        if (['ASSIGNMENT', 'DECLARATION'].includes(step.type) && step.scope && step.varName) {
            let { varName: name, block } = step
            let scope: null | number = step.scope[1]
            if (step.type === 'DECLARATION') {
                if (!block) {
                    while (scope && !(scope in this.funcScopes)) {
                        scope = this.scopeChain[scope].parent
                    }
                }
                if (scope !== null) {
                    const vals = this.identifiers[scope][name]
                    vals[vals.length - 1] = step.prev
                }
            } else if (step.type === 'ASSIGNMENT') {
                let current: number | null = scope
                let vals = null
                while (!vals) {
                    vals = this.identifiers[current][name]
                    current = this.scopeChain[current].parent
                    if (current === null) break;
                }
                if (vals) {
                    vals[vals.length - 1] = step.prev
                }
            }
        }
        if (['FUNC', 'METHOD', 'RETURN'].includes(step.type) && step.scope) {
            const fScope = step.scope[1]
            if (step.type === 'RETURN') {
                this.callStack.splice(step.callIdx, 0, [step.funcName, step.funcID])
                this.funcScopes[fScope] = step.funcName
                const queue = [fScope]
                while (queue.length) {
                    const scope = queue.shift()
                    if (typeof scope === 'number') {
                        const ids = this.identifiers[scope]
                        for (const id in ids) {
                            const idens = ids[id]
                            if (idens.length === 1 && idens[idens.length - 1] === undefined) {
                                if (step.prevVals && step.prevVals[scope]) {
                                    idens[idens.length - 1] = (step.prevVals[scope][id])
                                } else {
                                    // console.log('NO SCOPE', scope);
                                }
                            } else {
                                if (step.prevVals)
                                    ids[id].push(step.prevVals[scope][id])

                            }
                        }
                        const { children } = this.scopeChain[scope]
                        for (const child of children) {
                            queue.push(child)
                        }
                    }

                }
            } else {
                this.callStack.pop()
                const queue = [fScope]
                while (queue.length) {
                    const scope = queue.shift()
                    if (scope) {
                        const ids = this.identifiers[scope]
                        for (const id in ids) {
                            ids[id].pop()
                            if (!ids[id].length) {
                                ids[id].push(undefined)
                            }
                        }
                        try {
                            const { children } = this.scopeChain[scope]
                            for (const child of children) {
                                queue.push(child)
                            }
                        } catch (e) {
                            throw e
                        }
                    }
                }
            }
        }
        step.executed = false;
    }
    @computed get activeIds(): activeIds[][] {
        const s = this.scopeStack;
        const identifiers: activeIds[][] = [[]]
        const activeObjs: string[] = []
        for (const scope of s) {
            if (scope === null) continue;
            const ids = this.identifiers[scope]
            for (const id in ids) {
                const values = ids[id]
                if (id[0] === '_') continue;
                const info = {
                    name: id,
                    value: values[values.length - 1]
                }
                identifiers[identifiers.length - 1].push(
                    info
                )
                if (info.value in this.root.structs.objects) {
                    activeObjs.push(info.value)
                }
                if (identifiers[identifiers.length - 1].length > 4) {
                    identifiers.push([])
                }
            }
        }
        return identifiers
    }
}

export default StateStore