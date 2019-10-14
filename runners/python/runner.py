from wrapper_types import TYPES
import string
from random import choice
from proxy import GenericProxy, ListProxy, DictProxy, SetProxy

lettersAndDigits = string.ascii_letters + string.digits
rng = type(range(1))
fnc = type(range)
primitives = {int, str, bool, rng, slice, float, complex, fnc, bytes}


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
        self.map[Ellipsis] = '...'

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
            return self.proxies[obj][0]
        elif t == list:
            proxy = ListProxy(obj)
        elif t == dict:
            proxy = DictProxy(obj)
        elif t == set:
            proxy = SetProxy(obj)
        else:
            proxy = GenericProxy(obj)
        self.proxies[id(obj)] = (proxy, False)
        self.proxies[id(proxy)] = (proxy, True)
        if id(obj) in self.map:
            self.map[id(proxy)] = self.map[id(obj)]
        else:
            _id = self.stringify(obj)
            self.map[id(proxy)] = id

        return proxy

    def stringify(self, obj):
        if (id(obj)) in self.map:
            return self.map[(id(obj))]
        t = type(obj)
        if t in primitives:
            if t in {rng, slice, fnc}:
                _id = self.gen_id(5, 5)
                self.map[obj] = _id
                self.types[_id] = str(obj)
                return _id
            else:
                return obj
        else:
            new_id = self.gen_id(5, 3)
            self.map[id(obj)] = new_id
            ln = len(self.steps)
            if ln not in self.objectIndex:
                self.objectIndex[ln] = []
            self.objectIndex[ln].append(new_id)
            if isinstance(obj, dict):
                copy = {}
                for key, value in obj.items():
                    copy[key] = self.stringify(value)
                    obj[key] = self.virtualize(value)
                self.objects[new_id] = copy

            elif isinstance(obj, (list)):
                copy = {}
                for i in range(len(obj)):
                    val = obj[i]
                    copy[i] = self.stringify(val)
                    obj[i] = self.virtualize(val)
                copy['length'] = len(obj)
                self.objects[new_id] = copy
            elif isinstance(obj, tuple):
                copy = {}
                for i in range(len(obj)):
                    val = obj[i]
                    copy[i] = self.stringify(val)

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

            else:
                copy = {}
                for key, value in obj.__dict__.items():
                    copy[key] = self.stringify(value)
                    obj.__dict__[key] = self.virtualize(value)
                self.objects[new_id] = copy
            type_name = t.__name__

            self.types[new_id] = type_name
            self.gc.append(obj)
            return new_id
