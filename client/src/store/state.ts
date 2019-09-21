import { observable, action, computed } from "mobx";
import { RootStore } from ".";


type activeId = {
    name: string
    value: any
    color?: string
}

class StateStore {
    @observable global: number;
    @observable scopeStack: (null | number)[] = []
    @observable callStack: Viz.Step.FuncType[] = []
    @observable scopeChain: { [key: string]: Viz.ScopeChainEl } = {}
    @observable identifiers: { [key: string]: Viz.ScopeIdentifiers } = {}
    @observable funcScopes: { [key: string]: string } = {}
    @observable root: RootStore
    @observable queue: Viz.Step.Any[] = []
    constructor(store: RootStore) {
        this.root = store
    }

    @action next(step: Viz.Step.Any, isBatch: boolean = false) {

        // const prev = this.root.iterator.index - 1
        // if (prev >= 0 && !isBatch) {
        //     const prevStep = this.root.viz.steps[prev]
        //     if ('batch' in prevStep) {
        //         for (const batchStep of prevStep.batch) {
        //             this.next(batchStep, true)
        //         }
        //     }
        // }
        // while (this.queue.length) {
        //     this.next(this.queue.pop())
        // }
        if (step.scope) {
            const [parent, scope] = step.scope;
            if (!(scope in this.identifiers)) {
                this.identifiers[scope] = {}
            }
            if (!(scope in this.scopeChain)) {
                this.scopeChain[scope] = { parent, children: [] }
                if (typeof parent === 'number') {
                    this.scopeChain[parent].children.push(scope)
                } else if (parent === null) {
                    this.global = scope
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
        if (step.type === 'BLOCK') {
            const scope = step.scope[1];
            const ids = this.identifiers[scope];
            for (const id in ids) {
                ids[id][ids[id].length - 1] = undefined
            }
        }
        if (['ASSIGNMENT', 'DECLARATION'].includes(step.type) && step.scope && step.varName) {
            let { varName: name, block } = step
            let scope: null | number = step.scope[1]
            if (step.type === 'DECLARATION') {
                if (!block) {
                    while (scope && !(scope in this.funcScopes) && scope !== this.global) {
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

                    let val: any = step.value;
                    if ('update' in step) {
                        val += step.update
                    }
                    vals[vals.length - 1] = val


                }
            }
        }
        if (['FUNC', 'METHOD', 'RETURN'].includes(step.type) && step.scope) {
            const fScope: number = step.scope[1]
            if (step.type !== 'RETURN') {
                this.callStack.push(step as Viz.Step.FUNC)
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
                while (i >= 0 && this.callStack[i].funcID !== step.funcID) {
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

        step.executed = true

        if (step.batch) {
            this.queue.push(...step.batch)
        }
    }
    @action prev(step: Viz.Step.Any) {
        if (!step.executed) return
        this.queue = []
        if ('batch' in step) {
            for (let i = step.batch.length - 1; i >= 0; i--) {
                this.prev(step.batch[i])
            }
        }

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
                this.callStack.splice(step.callIdx, 0, step)
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
    @computed get activeIds(): activeId[][] {
        const s = this.scopeStack;
        const identifiers: activeId[][] = [[]]
        const activeObjs: string[] = []
        if (this.callStack.length && this.callStack[this.callStack.length - 1].object) {
            identifiers[0][0] = {
                name: 'this',
                value: this.callStack[this.callStack.length - 1].object,
                color: this.root.settings.valueColors['native']
            }
        }
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