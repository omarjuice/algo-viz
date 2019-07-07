declare namespace Viz {
    type scope = null | [null | number, number]
    type name = [number, number]
    type pointers = Map<string, (string | number)[]>
    type StructProp = {
        get: boolean | Promise,
        set: boolean | Promise
        value: any
    }

    type Structure = {
        [prop: string]: StructProp

    }
    type colors = {
        special: string
        number: string
        string: string
        boolean: string
        other: string
    }

    type speeds = {
        [key in Viz.configurable]: number;
    };
    type structColors = {
        [key: string]: string
    }
    type order = {
        pos: number
        isMultiple: boolean
    }
    type structSettings = {
        [key: string]: {
            order: {
                [child: string]: order
            },
            main: string,
            numChildren: null | number
        }
    }

    interface AllSettings {
        valueColors: colors
        background: string
        speeds: speeds
        structColors: structColors
        structSettings: structSettings
    }


    type anim = [boolean | Promise<void>, boolean | Promise<void>]
    type configurable = 'DECLARATION' | 'ASSIGNMENT' | 'EXPRESSION' | 'METHODCALL' | 'CALL' | 'DELETE' | 'GET' | 'SET' | 'CLEAR'

    declare namespace Step {
        interface Generic {
            name?: name
            scope?: scope
            value?: any
            [key: string]: any
        }
        interface ObjectType extends Generic {
            object: string
            access: Array<number | string>
        }
        interface FuncType extends Generic {
            funcName: string
        }
        interface VarType extends Generic {
            varName: string
        }

        interface PROGRAM extends Generic {
            type: 'PROGRAM'
        }
        interface BLOCK extends Generic {
            type: 'BLOCK'
        }
        interface EXPRESSION extends Generic {
            type: 'EXPRESSION'
        }
        interface CALL extends Generic {
            type: 'CALL'
        }
        interface METHODCALL extends ObjectType {
            type: 'METHODCALL'
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
            METHODCALL |
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
declare module 'ansi-to-html' {
    interface ConverterOptions {
        fg?: string
        bg?: string
        newline?: boolean
        escapeXML?: boolean
        stream?: boolean
        colors?: string[] | { [code: number]: string }
    }

    class Convert {
        constructor(options?: ConverterOptions)
        toHtml(data: string): string
    }

    export = Convert
}