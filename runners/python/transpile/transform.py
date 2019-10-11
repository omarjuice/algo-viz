import ast
import asttokens


def transform(code):

    # tok = asttokens.LineNumbers(code).

    tokens = asttokens.ASTTokens(code)
    tree = ast.parse(code,  mode="exec")
    tokens.mark_tokens(tree)

    transformer = Transformer(tree, tokens)
    transformed = transformer.visit(tree)
    return tree


def obj_to_node(obj):
    if isinstance(obj, str):
        return ast.Str(obj)
    if isinstance(obj, (int, float, complex)):
        return ast.Num(obj)
    if isinstance(obj, (tuple, list)):
        return ast.Tuple(
            elts=[obj_to_node(el) for el in obj]
        )
    if obj == None:
        return ast.Name('None')
    if isinstance(obj, dict):
        dict_keys = []
        dict_values = []
        for key, value in obj.items():
            dict_keys.append(ast.Str(key))
            dict_values.append(obj_to_node(value))
        return ast.Dict(
            keys=dict_keys,
            values=dict_values
        )


class Transformer(ast.NodeTransformer):
    def __init__(self, tree: ast.Module, tokens: asttokens.ASTTokens):
        self.scopes = Scopes(tree)
        self.tokens = tokens

    def proxy(self, node, details, expr=False):
        details['scope'] = self.scopes.get_scope(node)
        details['name'] = self.tokens.get_text_range(node)
        details = obj_to_node(details)

        call_node = ast.Call(
            func=ast.Name(id='_WRAPPER', ctx=ast.Load()),
            args=[
                node,
                details
            ],
            keywords=[]
        )
        if expr:
            return ast.Expr(
                value=call_node
            )
        else:
            return call_node

    def generic_visit(self, node):
        for child in ast.iter_child_nodes(node):
            self.scopes.add_node(node, child)
        return super().generic_visit(node)

    def visit_Call(self, node):
        self.generic_visit(node)
        return ast.copy_location(
            self.proxy(node, {}), node
        )

    def visit_BinOp(self, node):
        self.generic_visit(node)
        return ast.copy_location(
            self.proxy(node, {}), node
        )

    def visit_Compare(self, node):
        self.generic_visit(node)
        return ast.copy_location(
            self.proxy(node, {}), node
        )

    def visit_IfExp(self, node):
        self.generic_visit(node)
        return ast.copy_location(
            self.proxy(node, {}), node
        )

    def visit_FunctionDef(self, node):
        self.scopes.add_scope(node)
        self.generic_visit(node)
        return node

    def visit_Dict(self, node):
        self.generic_visit(node)
        return node


class Scopes:
    def __init__(self, tree: ast.Module):
        self.parents = {}
        self.scope_map = {}
        self.scope_chain = {}
        self.parents[tree] = None
        self.next_scope = 1
        self.scope_chain[0] = Scope(None)
        self.scope_map[tree] = 0

        for node in tree.body:
            self.parents[node] = tree

    def add_node(self, parent, child):
        self.parents[child] = parent

    def add_scope(self, node):
        parent = node
        while parent not in self.scope_map:
            parent = self.parents[parent]

        self.scope_map[node] = self.next_scope
        parent_scope = self.scope_map[parent]
        self.scope_chain[self.next_scope] = Scope(parent_scope)
        self.scope_chain[parent_scope].add_child(self.next_scope)
        self.next_scope += 1

    def get_scope(self, node):
        if node not in self.scope_map:
            self.scope_map[node] = self.get_scope(self.parents[node])[0]

        scope = self.scope_map[node]
        parent = self.scope_chain[scope].parent

        return (scope, parent)


class Scope:
    def __init__(self, parent):
        self.parent = parent
        self.children = set()

    def add_child(self, child):
        self.children.add(child)
