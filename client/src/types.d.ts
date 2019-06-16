declare namespace Viz {
    type scope = null | [null | number, number]
    type name = [number, number]

    declare namespace Step {
        interface I {
            name?: name
            scope?: scope
            value?: any
            [key: string]: any
        }
        interface ObjectType extends I {
            object: string
            access: Array<number | string>
        }
        interface FuncType extends I {
            funcName: string
        }
        interface VarType extends I {
            varName: string
        }

        interface PROGRAM extends I {
            type: 'PROGRAM'
        }
        interface BLOCK extends I {
            type: 'BLOCK'
        }
        interface EXPRESSION extends I {
            type: 'EXPRESSION'
        }
        interface CALL extends I {
            type: 'CALL'
        }
        interface DECLARATION extends VarType {
            type: 'DECLARATION'
            block: boolean
        }
        interface ASSIGNMENT extends VarType {
            type: 'ASSIGNMENT'
            update?: number,
        }


        interface FUNC extends FuncType {
            type: 'FUNC'
        }
        interface METHOD extends FuncType {
            type: 'METHOD'
            kind: string,
            object: string
        }
        interface RETURN extends FuncType {
            type: 'RETURN'
        }

        interface GET extends ObjectType {
            type: 'GET'
        }
        interface SET extends ObjectType {
            type: 'SET'
        }
        interface DELETE extends ObjectType {
            type: 'DELETE'
        }
        interface CLEAR extends ObjectType {
            type: 'CLEAR'
        }
        interface IN extends ObjectType {
            type: 'IN'
        }
        type Any = (PROGRAM |
            BLOCK |
            EXPRESSION |
            CALL |
            DECLARATION |
            ASSIGNMENT |
            FUNC |
            METHOD |
            RETURN |
            GET |
            SET |
            DELETE |
            CLEAR |
            IN)
    }



    type ScopeChainEl = {
        parent: null | number
        children: (number)[]
    }
    type ScopeIdentifiers = {
        [key: string]: any[]
    }
    type Data = {
        steps: Step.Any[],
        objects: { [key: string]: any },
        types: { [key: string]: any },
        code: string
    }
}