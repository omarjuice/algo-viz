import { type } from "os";



type scope = null | [null | number, number]
type name = [number, number]

interface StepType {
    name?: name
    scope?: scope
    value?: any
    [key: string]: any
}
interface StepObjectType extends StepType {
    object: string
    access: Array<number | string>
}
interface StepFuncType extends StepType {
    funcName: string
}
interface StepVarType extends StepType {
    varName: string
}


interface PROGRAM extends StepType {
    type: 'PROGRAM'
}
interface BLOCK extends StepType {
    type: 'BLOCK'
}
interface EXPRESSION extends StepType {
    type: 'EXPRESSION'
}
interface CALL extends StepType {
    type: 'CALL'
}
interface DECLARATION extends StepVarType {
    type: 'DECLARATION'
    varName: string
}
interface ASSIGNMENT extends StepVarType {
    type: 'ASSIGNMENT'
    update?: number
}


interface FUNC extends StepFuncType {
    type: 'FUNC'
}
interface METHOD extends StepFuncType {
    type: 'METHOD'
    kind: string
}
interface RETURN extends StepFuncType {
    type: 'RETURN'
}

interface GET extends StepObjectType {
    type: 'GET'
}
interface SET extends StepObjectType {
    type: 'SET'
}
interface DELETE extends StepObjectType {
    type: 'DELETE'
}
interface CLEAR extends StepObjectType {
    type: 'CLEAR'
}
interface IN extends StepObjectType {
    type: 'IN'
}

type Step =
    PROGRAM |
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
    IN
