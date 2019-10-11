class ProxyTypes:
    def __init__(self):
        self.PROGRAM = 'PROGRAM'

        self.DECLARATION = 'DECLARATION'
        self.ASSIGNMENT = 'ASSIGNMENT'
        self.EXPRESSION = 'EXPRESSION'
        self.CALL = 'CALL'

        self.SELF = 'SELF'
        self.FUNC = 'FUNC'
        self.METHOD = 'METHOD'
        self.RETURN = 'RETURN'
        self.BLOCK = 'BLOCK'

        self.DELETE = 'DELETE'
        self.GET = 'GET'
        self.SET = 'SET'
        self.CLEAR = 'CLEAR'

        self.ERROR = 'ERROR'


TYPES = ProxyTypes()


expression_types = [
    'Set', 'Dict', 'Not', 'Invert', 'BinOp',
    'BoolOp', 'Compare', 'IfExp'
]
