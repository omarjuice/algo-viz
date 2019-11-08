import ast
import asttokens
from random import choice
import string
from wrapper_types import TYPES, expression_types
from astunparse import unparse

lettersAndDigits = string.ascii_letters + string.digits


def transform(code, input):
    tokens = asttokens.ASTTokens(code)
    tree = ast.parse(code,  mode="exec")
    tokens.mark_tokens(tree)
    transformer = Transformer(tree, tokens)
    input[0] = transformer.wrapper_name
    input[1] = transformer.imports
    transformed = transformer.visit(tree)
    call_node = ast.Expr(
        value=ast.Call(
            func=ast.Attribute(value=ast.Name(
                id=transformer.wrapper_name, ctx=ast.Load()), attr="setGlobal", ctx=ast.Load()),
            args=[
                ast.Call(
                    func=ast.Name("globals"),
                    args=[],
                    keywords=[]
                )
            ],
            keywords=[]
        )
    )
    transformed.body.insert(0, call_node)
    ast.fix_missing_locations(tree)

    return tree


def obj_to_node(obj):
    if isinstance(obj, str):
        return ast.Str(obj)
    if isinstance(obj, (int, float, complex)):
        return ast.Num(obj)
    if isinstance(obj, (tuple, list)):
        return ast.Tuple(
            elts=[obj_to_node(el) for el in obj], ctx=ast.Load()
        )
    if obj == None:
        return ast.NameConstant(None)
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


def is_wrapper(node):
    return hasattr(node, '_wrapper')


def flat_map_assignments(targets, depth=0):
    assignments = []
    for target in (reversed(targets) if depth == 0 else targets):
        if isinstance(target, ast.Name):
            assignments.append(target)
        elif isinstance(target, (ast.Tuple, ast.List)):
            for name in flat_map_assignments(target.elts, depth=depth+1):
                assignments.append(name)
        elif isinstance(target, ast.Starred):
            for name in flat_map_assignments([target.value], depth=depth+1):
                assignments.append(name)
    return (assignments)


def get_body_idx(parent, node):
    body = parent.body
    try:
        idx = body.index(node)
    except ValueError:
        body = parent.orelse
        idx = body.index(node)
    return body, idx


class Transformer(ast.NodeTransformer):
    def __init__(self, tree: ast.Module, tokens: asttokens.ASTTokens):
        self.scopes = Scopes(tree)
        self.tokens = tokens
        self.insertions = []
        self.tree = tree
        self.ids = {""}
        self.wrapper_name = self.create_id(5, 1)
        self.imports = []
        for t in expression_types:
            key = 'visit_' + t
            setattr(self, key, self.visit_expr)

        for t in ['Tuple', 'List']:
            key = 'visit_' + t
            setattr(self, key, self.visit_list_or_tuple)

        tree.body.insert(0, self.wrapper(ast.NameConstant(value=None), {
            'type': TYPES.PROGRAM,
            'scope': self.scopes.get_scope(tree)
        }, expr=True))

    def create_id(self, l=3, num_=1):

        id = ""

        while id in self.ids:
            id = ''.join('_' for i in range(num_)) + \
                ''.join(choice(lettersAndDigits) for i in range(l))

        self.ids.add(id)
        return id

    def get_assignment_details(self, name, block=False):
        return {
            'scope': self.scopes.get_scope(name),
            'name': self.tokens.get_text_range(name),
            'type': self.scopes.add_identifier(name),
            'varName': name.id,
            'block': block
        }

    def wrapper(self, node, details, expr=False, is_generated=False):

        if not is_generated:
            if not 'scope' in details:
                details['scope'] = self.scopes.get_scope(node)
            if not 'name' in details:
                details['name'] = self.tokens.get_text_range(node)

        details = obj_to_node(details)

        call_node = ast.Call(
            func=ast.Attribute(value=ast.Name(
                id=self.wrapper_name, ctx=ast.Load()), attr="__", ctx=ast.Load()),
            args=[
                node,
                details
            ],
            keywords=[]
        )

        setattr(call_node, '_wrapper', True)
        if expr:
            n = ast.Expr(
                value=call_node
            )
            setattr(n, '_wrapper', True)
            return n
        else:
            return call_node

    def visit_expr(self, node):
        if isinstance(node, (ast.ListComp, ast.SetComp, ast.DictComp)):
            self.scopes.add_scope(node)
        self.generic_visit(node)
        return self.wrapper(node, {
            'type': TYPES.EXPRESSION
        })

    def generic_visit(self, node):

        for child in ast.iter_child_nodes(node):
            self.scopes.add_node(node, child)
        return super().generic_visit(node)

    def should_wrap_list_or_tuple_or_subscript(self, node):
        parent = self.scopes.parents[node]
        if isinstance(parent, (ast.Assign, ast.Delete, )) and node in parent.targets:
            return False
        elif isinstance(parent, (ast.For, ast.AugAssign, ast.comprehension)) and node == parent.target:
            return False
        elif isinstance(parent, (ast.List, ast.Tuple)):
            return self.should_wrap_list_or_tuple_or_subscript(parent)
        elif isinstance(parent, (ast.withitem)) and node == parent.optional_vars:
            return False
        elif isinstance(parent, ast.comprehension) and node == parent.target:
            return False
        elif isinstance(parent, ast.Starred) and node == parent.value:
            return False
        else:
            return True

    def visit_list_or_tuple(self, node):
        if self.should_wrap_list_or_tuple_or_subscript(node):
            return self.visit_expr(node)
        else:
            self.generic_visit(node)
            return node

    def visit_Subscript(self, node):
        if self.should_wrap_list_or_tuple_or_subscript(node):
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
        if is_wrapper(node):
            return node
        self.generic_visit(node)
        return ast.copy_location(
            self.wrapper(node, {
                'type': TYPES.CALL
            }), node
        )

    def visit_Assign(self, node):
        self.generic_visit(node)
        assignments = flat_map_assignments(node.targets)

        parent = self.scopes.parents[node]
        body, idx = get_body_idx(parent, node)
        for name in reversed(assignments):
            new_name = ast.Name(id=name.id, ctx=ast.Load())
            new_node = self.wrapper(
                new_name,
                self.get_assignment_details(name),
                expr=True
            )
            body.insert(idx + 1, new_node)
        return node

    def visit_Delete(self, node):
        self.generic_visit(node)
        deletions = flat_map_assignments(node.targets)
        parent = self.scopes.parents[node]
        body, idx = get_body_idx(parent, node)
        for name in reversed(deletions):
            details = self.get_assignment_details(name)
            details["type"] = TYPES.DELETE_VARIABLE
            new_node = self.wrapper(
                ast.NameConstant(None),
                details,
                expr=True
            )
            body.insert(idx+1, new_node)
        return node

    def visit_AnnAssign(self, node):
        self.generic_visit(node)
        if isinstance(node.target, ast.Name):
            parent = self.scopes.parents[node]
            idx = parent.body.index(node)
            body, idx = get_body_idx(parent, node)
            new_name = ast.Name(id=node.target.id, ctx=ast.Load())
            new_node = self.wrapper(
                new_name,
                self.get_assignment_details(node.target),
                expr=True
            )
            body.insert(idx + 1, new_node)
        return node

    def visit_AugAssign(self, node):
        self.generic_visit(node)
        if isinstance(node.target, ast.Name):
            parent = self.scopes.parents[node]
            body, idx = get_body_idx(parent, node)

            new_name = ast.Name(id=node.target.id, ctx=ast.Load())

            details = self.get_assignment_details(node.target)
            details['type'] = TYPES.ASSIGNMENT
            new_node = self.wrapper(
                new_name,
                details,
                expr=True
            )
            body.insert(idx + 1, new_node)
        return node

    def visit_For(self, node):
        self.generic_visit(node)
        assignments = flat_map_assignments([node.target])
        for name in reversed(assignments):
            new_name = ast.Name(id=name.id, ctx=ast.Load())
            new_node = self.wrapper(
                new_name,
                self.get_assignment_details(name),
                expr=True
            )
            node.body.insert(0, new_node)
        return node

    def visit_With(self, node):
        self.generic_visit(node)
        assignments = flat_map_assignments(
            [item.optional_vars for item in node.items],
            depth=1
        )
        for name in reversed(assignments):
            new_name = ast.Name(id=name.id, ctx=ast.Load())
            new_node = self.wrapper(
                new_name,
                self.get_assignment_details(name),
                expr=True
            )
            node.body.insert(0, new_node)
        return node

    def visit_comprehension(self, node):
        self.generic_visit(node)
        assignments = flat_map_assignments([node.target], depth=1)
        declarations = []
        elts = []
        for name in assignments:
            new_name = ast.Name(id=name.id, ctx=ast.Load())
            dec_details = self.get_assignment_details(name, True)
            assn_details = self.get_assignment_details(name, True)
            declarations.append(
                self.wrapper(
                    ast.NameConstant(None),
                    dec_details
                )
            )
            elts.append(self.wrapper(
                new_name,
                assn_details,
            ))

        elts.append(ast.NameConstant(True))
        declarations.append(node.iter)
        dec_list_node = ast.List(elts=declarations)
        node.iter = ast.Subscript(
            value=dec_list_node,
            slice=ast.Index(value=ast.Num(-1))
        )
        assign_list_node = ast.List(elts=elts)

        node.ifs.insert(0, ast.Subscript(
            value=assign_list_node,
            slice=ast.Index(value=ast.Num(-1))
        ))
        return node

    def visit_GeneratorExp(self, node):
        self.scopes.add_scope(node)
        self.generic_visit(node)
        return node

    def visit_FunctionDef(self, node):
        self.scopes.add_scope(node)
        scope = self.scopes.get_scope(node)
        args = []
        for argument in node.args.args:
            args.append(argument)

        if node.args.vararg:
            args.append(node.args.vararg)

        setattr(node, 'funcID',  self.create_id(4, 1))

        new_nodes = []
        for name in reversed(args):
            new_name = ast.Name(id=name.arg, ctx=ast.Load())
            new_node = self.wrapper(
                new_name,
                {
                    'scope': scope,
                    'name': self.tokens.get_text_range(name),
                    'type': self.scopes.add_identifier(name, scope[1]),
                    'varName': name.arg,
                    'block': False
                },
            )
            assn = ast.Assign()
            assn.targets = [ast.Name(id=name.arg, ctx=ast.Store)]
            assn.value = new_node
            setattr(assn, '_wrapper', True)
            new_nodes.append(assn)
        name = node.name
        parent = self.scopes.parents[node]
        if isinstance(parent, ast.ClassDef):
            name = parent.name + '.' + name
        setattr(node, 'funcName', name)
        self.generic_visit(node)

        for new_node in new_nodes:
            node.body.insert(0, new_node)

        node.body.insert(0, self.wrapper(
            ast.NameConstant(value=None),
            {
                'type': TYPES.FUNC,
                'funcName': name,
                'funcID': getattr(node, 'funcID'),
                'scope': self.scopes.get_scope(node),

            },
            expr=True, is_generated=True))
        if node.body and not isinstance(node.body[-1], ast.Return):
            node.body.append(self.wrapper(
                ast.NameConstant(value=None),
                {
                    'type': TYPES.RETURN,
                    'funcName': name,
                    'funcID': getattr(node, 'funcID'),
                    'scope': self.scopes.get_scope(node),
                },
                expr=True, is_generated=True))
        return node

    def visit_ClassDef(self, node):
        self.scopes.add_scope(node)
        self.generic_visit(node)
        node.body.insert(0,
                         self.wrapper(
                             ast.NameConstant(value=None),
                             {
                                 'type': TYPES.BLOCK,
                                 'scope': self.scopes.get_scope(node),
                             },
                             expr=True, is_generated=True)
                         )
        return node

    def visit_Lambda(self, node):
        self.scopes.add_scope(node)
        scope = self.scopes.get_scope(node)
        self.generic_visit(node)
        funcID = self.create_id(4, 1)
        args = []
        for argument in node.args.args:
            args.append(argument)

        if node.args.vararg:
            args.append(node.args.vararg)

        body = [self.wrapper(
            ast.NameConstant(value=None),
            {
                'type': TYPES.FUNC,
                'funcName': funcID,
                'funcID': funcID,
                'scope': scope,
            },
            expr=True, is_generated=True)]

        for name in args:
            new_name = ast.Name(id=name.arg, ctx=ast.Load())
            new_node = self.wrapper(
                new_name,
                {
                    'scope': scope,
                    'name': self.tokens.get_text_range(name),
                    'type': self.scopes.add_identifier(name, scope[1]),
                    'varName': name.arg,
                    'block': False
                },
            )

            body.append(new_node)

        body.append(self.wrapper(
            node.body, {
                'type': TYPES.RETURN,
                'funcName': funcID,
                'funcID': funcID,
                'scope': scope
            }
        ))
        body = ast.List(elts=body)
        subscript = ast.Subscript()
        subscript.value = body
        subscript.slice = ast.Index(value=ast.Num(-1))

        node.body = subscript
        return node

    def visit_Return(self, node):
        self.generic_visit(node)
        parent = node
        while not isinstance(parent, ast.FunctionDef):
            parent = self.scopes.parents[parent]

        funcID = getattr(parent, 'funcID')
        funcName = getattr(parent, 'funcName')

        node.value = self.wrapper(node.value or ast.NameConstant(value=None), {
            'type': TYPES.RETURN,
            'funcName': funcName,
            'funcID': funcID,
            'scope': self.scopes.get_scope(parent)
        })

        return node

    def visit_Import(self, node):
        for imp in node.names:
            info = {
                'type': 'import',
                'module': imp.name,
                'alias': imp.asname
            }
            self.imports.append(info)

        return None

    def visit_ImportFrom(self, node):
        module_name = node.module
        names = []
        for imp in node.names:
            names.append({
                'name': imp.name,
                'alias': imp.asname
            })
        self.imports.append({
            'type': 'from',
            'module': module_name,
            'names': names
        })
        return None

    def visit_Try(self, node):
        raise SyntaxError('Try blocks are not allowed.')

    def visit_TryFinally(self, node):
        raise SyntaxError('Try blocks are not allowed.')

    def visit_TryExcept(self, node):
        raise SyntaxError('Try blocks are not allowed.')


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
