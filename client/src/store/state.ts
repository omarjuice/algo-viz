import { observable, action, computed } from "mobx";
import { RootStore } from ".";
import * as TYPES from '../types'




class StateStore {
    @observable scopeStack: (null | number)[] = []
    @observable callStack: string[] = []
    @observable scopeChain: { [key: string]: TYPES.ScopeChainEl } = {}
    @observable identifiers: { [key: string]: TYPES.ScopeIdentifiers } = {}
    @observable funcScopes: { [keu: string]: string } = {}
    @observable root: RootStore
    constructor(store: RootStore) {
        this.root = store
    }

    @action next(step: TYPES.Step) {
        if (step.scope) {
            const [parent, scope] = step.scope;
            if (!(scope in this.identifiers)) {
                this.identifiers[scope] = {}
            }
            if (!(scope in this.scopeChain)) {
                this.scopeChain[scope] = { parent, children: [] }
                if (parent !== null) {
                    this.scopeChain[parent].children.push(scope)
                }
            }
            const s = this.scopeStack
            if (s[s.length - 1] !== scope) {
                while (s.length && (![parent, scope].includes(s[s.length - 1]))) {
                    s.pop()
                }
                if (step.type !== 'RETURN' && s[s.length - 1] !== scope) s.push(scope)
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
                    const ids = this.identifiers[scope][name]
                    ids[ids.length - 1] = step.value
                    if (name === 'j') {
                        console.log(step.value);
                    }
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
                    vals[vals.length - 1] = step.value
                }
            }
        }
        if (['FUNC', 'METHOD', 'RETURN'].includes(step.type) && step.scope) {
            const fScope: number = step.scope[1]
            if (step.type !== 'RETURN') {
                this.callStack.push(step.funcName)
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
                this.callStack.pop()
                const queue: number[] = [fScope]
                while (queue.length > 0) {
                    const scope = queue.shift()
                    if (scope) {
                        const ids = this.identifiers[scope]
                        for (const id in ids) {
                            ids[id].pop()
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
            }
        }
    }
    @computed get activeIds() {
        const s = this.scopeStack;
        const identifiers = []
        for (const scope of s) {
            if (scope === null) continue;
            const ids = this.identifiers[scope]
            for (const id in ids) {
                const values = ids[id]
                identifiers.push({
                    name: id,
                    value: values[values.length - 1]
                })
            }
        }
        return identifiers
    }
}

export default StateStore