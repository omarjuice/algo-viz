from proxy import ObjectProxy
import viz
import importlib
import typing
white_listed_imports = {
    'bisect',
    # 'heapq',
    'keyword',
    # 'queue',
    'random',
    'strings',
    'collections',
    'viz'
}


def type_override(obj):
    if isinstance(obj, ObjectProxy):
        return type(obj.__wrapped__)
    else:
        return type(obj)


def create(_name, runner, imports):
    sandbox = {
        _name: runner,
        'type': type_override,
        'print': lambda *args: None
    }

    ban_list = [
        'compile',
        'dir',
        'eval',
        'exec',
        'input',
        'open',
        'quit',
        'exit',
        'copyright',
        'credits',
        'license',
        'help',
        '__import__',
        '__package__',
    ]
    for name in ban_list:
        sandbox[name] = None

    for imp in imports:
        name = imp['module']
        if name not in white_listed_imports:
            raise Exception(f'import {name} is not found or not allowed.')
        mod = viz if name == 'viz' else importlib.import_module(name)
        if imp['type'] == 'import':
            if imp['alias']:
                name = imp['alias']
            sandbox[name] = mod
        else:
            exports = set([n for n in dir(mod) if n[0] != '_'])
            for n in imp['names']:

                nm = n['name']
                if nm == '*':
                    for export in exports:
                        sandbox[export] = getattr(mod, export)
                    continue
                alias = n['alias'] or nm
                if nm not in exports:
                    raise Exception(f'{nm} is not exported from {name}.')
                sandbox[alias] = getattr(mod, nm)

    for n in dir(typing):
        sandbox[n] = getattr(typing, n)
    return sandbox
