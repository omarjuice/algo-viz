class WrapperTypes:
    def __init__(self):
        self.PROGRAM = 'PROGRAM'

        self.DECLARATION = 'DECLARATION'
        self.ASSIGNMENT = 'ASSIGNMENT'
        self.DELETE_VARIABLE = 'DELETE_VARIABLE'
        self.EXPRESSION = 'EXPRESSION'
        self.CALL = 'CALL'

        self.FUNC = 'FUNC'
        self.METHOD = 'METHOD'
        self.RETURN = 'RETURN'
        self.BLOCK = 'BLOCK'

        self.DELETE = 'DELETE'
        self.GET = 'GET'
        self.SET = 'SET'
        self.CLEAR = 'CLEAR'

        self.ERROR = 'ERROR'


TYPES = WrapperTypes()


expression_types = [
    'Set', 'Dict', 'BinOp',
    'BoolOp', 'Compare', 'IfExp',
    'Bytes', 'JoinedStr', 'ListComp',
    'SetComp', 'DictComp'
]
