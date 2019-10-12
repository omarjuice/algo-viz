import ast
import asttokens
from random import choice
import string
from proxy_types import TYPES, expression_types


def transform(code):

    tokens = asttokens.ASTTokens(code)
    tree = ast.parse(code,  mode="exec")
    tokens.mark_tokens(tree)
    transformer = Transformer(tree, tokens)
    transformed = transformer.visit(tree)
    return tree


def create_id(l=3, num_=1):
    lettersAndDigits = string.ascii_letters + string.digits
    return ''.join('_' for i in range(num_)) + ''.join(choice(lettersAndDigits) for i in range(l))


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


def flat_map_assignments(targets, depth=0):
    assignments = []
    for target in (reversed(targets) if depth == 0 else targets):
        if isinstance(target, ast.Name):
            assignments.append(target)
        elif isinstance(target, (ast.Tuple, ast.List)):
            for name in flat_map_assignments(target.elts, depth=depth+1):
                assignments.append(name)
    return (assignments)


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
        tree.body.insert(0, self.proxy(ast.NameConstant(value=None), {
            'type': TYPES.PROGRAM,
            'scope': self.scopes.get_scope(tree)
        }))

    def get_assignment_details(self, name):
        return {
            'scope': self.scopes.get_scope(name),
            'name': self.tokens.get_text_range(name),
            'type': self.scopes.add_identifier(name),
            'varName': name.id,
            'block': False
        }

    def proxy(self, node, details, expr=False, is_generated=False):

        if not is_generated:
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

    def should_proxy_list_or_tuple(self, node):
        parent = self.scopes.parents[node]
        if isinstance(parent, ast.Assign) and node in parent.targets:
            return False
        elif isinstance(parent, ast.For) and node == parent.target:
            return False
        elif isinstance(parent, ast.comprehension) and node == parent.target:
            return False
        elif isinstance(parent, (ast.List, ast.Tuple)):
            return self.should_proxy_list_or_tuple(parent)
        else:
            return True

    def visit_list_or_tuple(self, node):
        if self.should_proxy_list_or_tuple(node):
            return self.visit_expr(node)
        else:
            self.generic_visit(node)
            return node

    def visit_UnaryOp(self, node):
        if isinstance(node.op, (ast.Not, ast.Invert)):
            return self.visit_expr(node)
        else:
            return node

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
        assignments = flat_map_assignments(node.targets)

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

    def visit_AnnAssign(self, node):
        self.generic_visit(node)
        if isinstance(node.target, ast.Name):
            parent = self.scopes.parents[node]
            idx = parent.body.index(node)
            new_name = ast.Name(id=node.target.id, ctx=ast.Load())
            new_node = self.proxy(
                new_name,
                self.get_assignment_details(node.target),
                expr=True
            )
            parent.body.insert(idx + 1, new_node)
        return node

    def visit_AugAssign(self, node):
        self.generic_visit(node)
        if isinstance(node.target, ast.Name):
            parent = self.scopes.parents[node]
            idx = parent.body.index(node)
            new_name = ast.Name(id=node.target.id, ctx=ast.Load())

            details = self.get_assignment_details(node.target)
            details['type'] = TYPES.ASSIGNMENT
            new_node = self.proxy(
                new_name,
                details,
                expr=True
            )
            parent.body.insert(idx + 1, new_node)
        return node

    def visit_For(self, node):
        self.generic_visit(node)
        assignments = flat_map_assignments([node.target])
        for name in reversed(assignments):
            new_name = ast.Name(id=name.id, ctx=ast.Load())
            new_node = self.proxy(
                new_name,
                self.get_assignment_details(name),
                expr=True
            )
            node.body.insert(0, new_node)
        return node

    def visit_FunctionDef(self, node):
        self.scopes.add_scope(node)
        scope = self.scopes.get_scope(node)
        args = []
        for argument in node.args.args:
            args.append(argument)

        if node.args.vararg:
            args.append(node.args.vararg)

        setattr(node, 'funcID',  create_id(4, 1))

        new_nodes = []
        for name in reversed(args):
            new_name = ast.Name(id=name.arg, ctx=ast.Load())
            new_node = self.proxy(
                new_name,
                {
                    'scope': scope,
                    'name': self.tokens.get_text_range(name),
                    'type': self.scopes.add_identifier(name, scope[1]),
                    'varName': name.arg,
                    'block': False
                },
                expr=True
            )
            new_nodes.append(new_node)

        self.generic_visit(node)

        for new_node in new_nodes:
            node.body.insert(0, new_node)
        node.body.insert(0, self.proxy(
            ast.NameConstant(value=None),
            {
                'type': TYPES.FUNC,
                'funcName': node.name,
                'funcID': getattr(node, 'funcID'),
                'scope': self.scopes.get_scope(node),

            },
            expr=True, is_generated=True))
        if node.body and not isinstance(node.body[-1], ast.Return):
            node.body.append(self.proxy(
                ast.NameConstant(value=None),
                {
                    'type': TYPES.RETURN,
                    'funcName': node.name,
                    'funcID': getattr(node, 'funcID'),
                    'scope': self.scopes.get_scope(node),

                },
                expr=True, is_generated=True))
        return node

    def visit_ClassDef(self, node):
        self.scopes.add_scope(node)
        self.generic_visit(node)
        node.body.insert(0,
                         self.proxy(
                             ast.NameConstant(value=None),
                             {
                                 'type': TYPES.BLOCK,
                                 'scope': self.scopes.get_scope(node),
                             },
                             expr=True, is_generated=True)
                         )
        return node

    def visit_Return(self, node):
        self.generic_visit(node)
        parent = node
        while not isinstance(parent, ast.FunctionDef):
            parent = self.scopes.parents[parent]

        funcID = getattr(parent, 'funcID')
        funcName = parent.name

        node.value = self.proxy(node.value or ast.NameConstant(value=None), {
            'type': TYPES.RETURN,
            'funcName': funcName,
            'funcID': funcID,
            'scope': self.scopes.get_scope(parent)
        })

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
            self.scope_map[node] = self.get_scope(self.parents[node])[1]
        scope = self.scope_map[node]
        parent = self.scope_chain[scope].parent

        return (parent, scope)

    def add_identifier(self, node, scope_id=None):
        if scope_id == None:
            scope_id = self.get_scope(node)[1]
        scope = self.scope_chain[scope_id]
        if isinstance(node, ast.arg):
            name = node.arg
        else:
            name = node.id
        if name not in scope.identifiers:
            scope.identifiers.add(name)
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
