import ast


def transform(code):
    tree = Transformer().visit(ast.parse(code,  mode="exec"))
    return tree


def proxy(node, expr=False):
    call_node = ast.Call(
        func=ast.Name(id='_WRAPPER', ctx=ast.Load()),
        args=[node],
        keywords=[]
    )
    if expr:
        return ast.Expr(
            value=call_node
        )
    else:
        return call_node


class Transformer(ast.NodeTransformer):
    def __init__(self):
        self.stats = {"import": [], "from": []}

    def visit_Call(self, node):
        self.generic_visit(node)
        return ast.copy_location(
            proxy(node, False), node
        )

    def visit_BinOp(self, node):
        self.generic_visit(node)
        return ast.copy_location(
            proxy(node), node
        )

    def visit_Compare(self, node):
        self.generic_visit(node)
        return ast.copy_location(
            proxy(node), node
        )

    def visit_IfExp(self, node):
        self.generic_visit(node)
        return ast.copy_location(
            proxy(node), node
        )
