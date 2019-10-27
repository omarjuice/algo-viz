from wrapper_types import TYPES
import string
from random import choice
from proxy import *
from collections import Counter
from itertools import chain
import typing

lettersAndDigits = string.ascii_letters + string.digits
rng = type(range(1))
fnc = type(range)
gen = type((1 for _ in range(1)))
primitives = {int, str, bool, rng, slice,
              float, complex, fnc, bytes, type(...),
              type(None), tuple, type(lambda: 0),
              type([].append), typing._GenericAlias, gen, chain}


class Runner:
    def __init__(self, name, code, limit=30000):
        self.limit = limit
        self.code = code

        self.steps = []

        self.map = {}

        self.objects = {}

        self.proxies = {}

        self.types = {}

        self.objectIndex = {}

        self.calls = 0

        self.name = name

        self.gc = []

        none_literal = self.gen_id(5, 1)
        self.map[None] = none_literal
        self.types[none_literal] = 'None'

        ellips_literal = self.gen_id(5, 1)
        self.map[...] = ellips_literal
        self.types[ellips_literal] = '...'

        self.num_steps = 0

        self.GenericProxy = generic_proxy(self)
        self.ListProxy = list_proxy(self)
        self.DictProxy = dict_proxy(self)
        self.SetProxy = set_proxy(self)
        self.CounterProxy = counter_proxy(self)

    def gen_id(self, l=3, num_=2):

        id = None

        while not id or id in self.types:
            id = ''.join('_' for i in range(num_)) + \
                ''.join(choice(lettersAndDigits) for i in range(l))

        return id

    def virtualize(self, obj):
        t = type(obj)
        proxy = None
        if t in primitives:
            return obj
        elif id(obj) in self.proxies:
            return self.proxies[id(obj)][0]
        elif t == list:
            proxy = self.ListProxy(obj)
        elif t == dict:
            proxy = self.DictProxy(obj)
        elif t == set:
            proxy = self.SetProxy(obj)
        elif t == Counter:
            proxy = self.CounterProxy(obj)
        else:
            proxy = self.GenericProxy(obj)
        self.proxies[id(obj)] = (proxy, False)
        self.proxies[id(proxy)] = (proxy, True)
        if id(obj) in self.map:
            self.map[id(proxy)] = self.map[id(obj)]
        else:
            _id = self.stringify(obj)
            self.map[id(proxy)] = _id

        return proxy

    def __(self, val, info):
        # if(self.ignore) return val
        print(self.types[self.map[None]])
        t = info['type']
        if t in [TYPES.FUNC, TYPES.METHOD]:
            self.calls += 1
        if t in [TYPES.DELETE, TYPES.SET, TYPES.GET]:
            info['object'] = self.stringify(info['object'])
            info['access'] = self.stringify(info['access'])
        info['value'] = self.stringify(val)
        if t in [TYPES.FUNC, TYPES.METHOD, TYPES.BLOCK, TYPES.RETURN]:
            prev = self.steps[-1]
            if 'batch' not in prev:
                prev['batch'] = [info]
            else:
                prev['batch'].append(info)
        else:
            self.steps.append(info)

        self.num_steps += 1
        if self.num_steps > self.limit:
            raise Exception('Step limit exceeded.')
        if self.calls > 500:
            raise Exception('Maximum callstack size of 500 exceeded.')

        return self.virtualize(val)

    def stringify(self, obj):
        t = type(obj)
        if t in primitives:
            if t in {rng, slice, fnc, tuple, type(lambda: 0), type([].append), typing._GenericAlias, gen, chain}:
                _id = self.gen_id(5, 5)
                if t == tuple:
                    copy = []
                    for item in obj:
                        copy.append(self.stringify(item))
                    self.types[_id] = copy
                else:
                    self.types[_id] = str(obj)
                return _id
            else:
                return obj
        else:
            try:
                if obj in self.map:
                    return self.map[obj]
            except Exception:
                memid = id(obj)
                if memid in self.map:
                    return self.map[memid]
            new_id = self.gen_id(5, 3)
            self.map[id(obj)] = new_id
            ln = len(self.steps)
            if ln not in self.objectIndex:
                self.objectIndex[ln] = []
            self.objectIndex[ln].append(new_id)
            if isinstance(obj, (dict, Counter)):
                copy = {}
                i = 0
                for key, value in obj.items():
                    copy[i] = [self.stringify(key), self.stringify(value)]
                    obj[key] = self.virtualize(value)
                    i += 1
                self.objects[new_id] = copy

            elif isinstance(obj, (list)):
                copy = {}
                for i in range(len(obj)):
                    val = obj[i]
                    copy[i] = self.stringify(val)
                    obj[i] = self.virtualize(val)
                copy['length'] = len(obj)
                self.objects[new_id] = copy
            elif isinstance(obj, set):
                copy = {}
                i = 0
                for value in obj:
                    copy[i] = self.stringify(value)
                    obj.discard(value)
                    obj.add(self.virtualize(value))
                    i += 1
                self.objects[new_id] = copy

            elif hasattr(obj, '__dict__'):
                copy = {}
                for key, value in obj.__dict__.items():
                    if key[0] == '_':
                        continue
                    copy[key] = self.stringify(value)
                    obj.__dict__[key] = self.virtualize(value)
                self.objects[new_id] = copy
            else:
                self.objects[new_id] = {}
            type_name = t.__name__
            self.types[new_id] = type_name
            self.gc.append(obj)
            return new_id

    def setGlobal(self, g):
        _id = self.gen_id(5, 4)
        self.map[id(g)] = _id
        self.types[_id] = "global"
        seen = {}
        for key in g:
            val = g[key]

            if val == None:
                continue

            num_ = 5 if hasattr(typing, key) else 4
            _id = self.gen_id(5, num_)
            try:
                self.map[val] = _id
            except Exception:
                self.map[id(val)] = _id
            self.types[_id] = key
