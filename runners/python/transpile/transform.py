import ast
import asttokens
from proxy_types import TYPES, expression_types


def transform(code):

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


def is_proxy(node):
    if hasattr(node, 'func') and hasattr(node.func, 'id') and node.func.id == '_WRAPPER':
        return True
    else:
        return False


class Transformer(ast.NodeTransformer):
    def __init__(self, tree: ast.Module, tokens: asttokens.ASTTokens):
        self.scopes = Scopes(tree)
        self.tokens = tokens
        self.insertions = []

        for t in expression_types:
            key = 'visit_' + t
            setattr(self, key, self.visit_expr)

        for t in ['Tuple', 'List']:
            key = 'visit_' + t
            setattr(self, key, self.visit_list_or_tuple)

    def get_assignment_details(self, name):
        return {
            'scope': self.scopes.get_scope(name),
            'name': self.tokens.get_text_range(name),
            'type': self.scopes.add_identifier(name),
            'varName': name.id,
            'block': False
        }

    def proxy(self, node, details, expr=False):

        if not 'scope' in details:
            details['scope'] = self.scopes.get_scope(node)
        if not 'name' in details:
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

    def visit_expr(self, node):
        self.generic_visit(node)
        return ast.copy_location(
            self.proxy(node, {
                'type': TYPES.EXPRESSION
            }), node
        )

    def generic_visit(self, node):
        for child in ast.iter_child_nodes(node):
            self.scopes.add_node(node, child)
        return super().generic_visit(node)

    def visit_list_or_tuple(self, node):
        parent = self.scopes.parents[node]
        if isinstance(parent, ast.Assign) and node in parent.targets:
            self.generic_visit(node)
            return node
        elif isinstance(parent, ast.For) and node == parent.target:
            self.generic_visit(node)
            return node
        elif isinstance(parent, ast.comprehension) and node == parent.target:
            self.generic_visit(node)
            return node
        else:
            return self.visit_expr(node)

    def visit_Call(self, node):
        if is_proxy(node):
            return node
        self.generic_visit(node)
        return ast.copy_location(
            self.proxy(node, {
                'type': TYPES.CALL
            }), node
        )

    def visit_Assign(self, node):
        self.generic_visit(node)
        assignments = []
        for target in reversed(node.targets):
            if isinstance(target, ast.Name):
                assignments.append(target)
            elif isinstance(target, ast.Tuple):
                for tar in target.elts:
                    if isinstance(tar, ast.Name):
                        assignments.append(tar)
        parent = self.scopes.parents[node]
        idx = parent.body.index(node)
        for name in reversed(assignments):
            new_name = ast.Name(id=name.id, ctx=ast.Load())
            new_node = self.proxy(
                new_name,
                self.get_assignment_details(name),
                expr=True
            )
            parent.body.insert(idx + 1, new_node)
        return node

    def visit_FunctionDef(self, node):
        self.scopes.add_scope(node)
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
        self.identifiers = set()

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

    def add_identifier(self, node):
        scope_id = self.get_scope(node)[0]
        scope = self.scope_chain[scope_id]

        if node.id not in scope.identifiers:
            scope.identifiers.add(node.id)
            return TYPES.DECLARATION
        else:
            return TYPES.ASSIGNMENT


class Scope:
    def __init__(self, parent):
        self.parent = parent
        self.children = set()
        self.identifiers = set()

    def add_child(self, child):
        self.children.add(child)
