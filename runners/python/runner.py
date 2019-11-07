from wrapper_types import TYPES
from util import ValueMap
import string
from random import choice
from proxy import *
import collections
import myqueue
from itertools import chain
from struct_surrogates import DequeSurrogate
import viz
import typing
import threading


Counter, OrderedDict, defaultdict, deque = collections.Counter, collections.OrderedDict, collections.defaultdict, collections.deque

lettersAndDigits = string.ascii_letters + string.digits
rng = type(range(1))
fnc = type(range)
gen = type((1 for _ in range(1)))

primitives = {int, str, bool, float, bytes}
others = {complex, rng, slice, fnc, tuple, type(lambda: 0), type(
    [].append), typing._GenericAlias, gen, chain, type, float}

others |= {getattr(threading, name)
           for name in dir(threading) if name[0] != '_'}

viz_types = {getattr(viz, name)
             for name in dir(viz) if name[0] != '_'}
collections_types = {getattr(collections, name)
                     for name in dir(collections) if name[0] != '_'}
queue_types = {getattr(myqueue, name)
               for name in dir(myqueue) if name[0] != '_'}


class Runner:
    def __init__(self, name, code, limit=30000):
        self.limit = limit
        self.code = code

        self.steps = []

        self.map = ValueMap()

        self.objects = {}

        self.proxies = {}
        self.surrogates = {}

        self.types = {}

        self.objectIndex = {}

        self.calls = 0

        self.name = name

        none_literal = self.gen_id(5, 1)
        self.map.add(None, none_literal)
        self.types[none_literal] = 'None'

        ellips_literal = self.gen_id(5, 1)
        self.map.add(..., ellips_literal)
        self.types[ellips_literal] = '...'

        self.num_steps = 0

        self.GenericProxy = generic_proxy(self)
        self.ListProxy = list_proxy(self)
        self.DictProxy = dict_proxy(self)
        self.SetProxy = set_proxy(self)
        self.CounterProxy = counter_proxy(self)
        self.OrderedDictProxy = ordereddict_proxy(self)
        self.DequeProxy = deque_proxy(self)

        self.global_object = None

        self.ignore = False

    def gen_id(self, l=3, num_=2):

        _id = None

        while not _id or _id in self.types:
            _id = ''.join('_' for i in range(num_)) + \
                ''.join(choice(lettersAndDigits) for i in range(l))

        return _id

    def virtualize(self, obj):
        t = type(obj)
        proxy = None
        if t in primitives or t in others:
            return obj
        elif id(obj) in self.proxies:
            return self.proxies[id(obj)][0]
        elif t == list:
            proxy = self.ListProxy(obj)
        elif t == set:
            proxy = self.SetProxy(obj)
        elif t == Counter:
            proxy = self.CounterProxy(obj)
        elif t == OrderedDict:
            proxy = self.OrderedDictProxy(obj)
        elif t == dict or t == defaultdict:
            proxy = self.DictProxy(obj)
        elif hasattr(obj, '__dict__'):
            proxy = self.GenericProxy(obj)
        else:
            return obj
        self.proxies[id(obj)] = (proxy, False)
        self.proxies[id(proxy)] = (proxy, True)
        if self.map.has(obj):
            self.map.add(proxy, self.map.get(obj))
        else:
            _id = self.stringify(obj)
            self.map.add(proxy, _id)

        return proxy

    def get_surrogate(self, obj):
        return self.surrogates[id(obj)]

    def virtualize_surrogate(self, obj, surrogate):
        if id(obj) in self.proxies:
            return self.proxies[id(obj)][0]
        t = type(obj)
        if t == deque:
            proxy = self.DequeProxy(obj)
            surrogate_proxy = self.GenericProxy(surrogate)

        self.proxies[id(obj)] = (proxy, False)
        self.proxies[id(proxy)] = (proxy, True)
        self.proxies[id(surrogate)] = (proxy, False)
        self.proxies[id(surrogate_proxy)] = (proxy, False)
        self.surrogates[id(obj)] = surrogate_proxy
        self.surrogates[id(proxy)] = surrogate_proxy

        _id = self.map.get(obj) if self.map.has(obj) else self.stringify(obj)
        self.map.add(proxy, _id)
        self.map.add(surrogate, _id)
        self.map.add(surrogate_proxy, _id)
        return proxy

    def __(self, val, info):
        if self.ignore:
            return self.virtualize(val)
        t = info['type']
        if t in [TYPES.FUNC, TYPES.METHOD]:
            self.calls += 1
        if t == TYPES.RETURN:
            self.calls -= 1
        if t in [TYPES.DELETE, TYPES.SET, TYPES.GET]:
            info['object'] = self.stringify(info['object'])
            info['access'] = self.stringify(info['access'])
        if t == TYPES.CLEAR:
            info['object'] = self.stringify(info['object'])
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
            if t == float and obj == float('inf') or obj == -float('inf'):
                pass
            else:
                return obj
        if t in others:
            _id = self.gen_id(5, 5)
            if t == tuple:
                if self.map.has(obj):
                    return self.map.get(obj)
                c = []
                for item in obj:
                    c.append(self.stringify(item))
                self.types[_id] = c
                self.map.add(obj, _id)
            else:
                self.types[_id] = str(obj)
            return _id
        else:
            type_name = t.__name__
            if self.map.has(obj):
                return self.map.get(obj)
            new_id = self.gen_id(5, 3)
            self.map.add(obj, new_id)

            i = 0

            if isinstance(obj, (dict, Counter, OrderedDict)):
                copy = {}
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
                for value in obj:
                    copy[i] = self.stringify(value)
                    obj.discard(value)
                    obj.add(self.virtualize(value))
                    i += 1
                self.objects[new_id] = copy
            elif isinstance(obj, deque):
                surrogate = DequeSurrogate([self.virtualize(v) for v in obj])
                new_id = self.stringify(surrogate)
                self.map.add(obj, new_id)
                self.virtualize_surrogate(obj, surrogate)
            elif hasattr(obj, '__dict__'):
                copy = {}
                for key, value in obj.__dict__.items():
                    if key[0] == '_':
                        continue
                    copy[key] = self.stringify(value)
                    obj.__dict__[key] = self.virtualize(value)
                    i += 1
                self.objects[new_id] = copy
            else:
                new_id = self.gen_id(5, 5)
                self.map.add(obj, new_id)
                self.types[new_id] = str(obj)
                return new_id
            if i > 1000:
                raise Exception(
                    f'{type_name} is too large. All objects are limited to 1000 elements.'
                )

            if t in collections_types:
                type_name = 'collections.' + type_name
            elif t in queue_types:
                type_name = 'queue.' + type_name
            elif t in viz_types:
                type_name = 'viz.' + type_name
            ln = len(self.steps)
            if ln not in self.objectIndex:
                self.objectIndex[ln] = []
            self.objectIndex[ln].append(new_id)

            self.types[new_id] = type_name
            return new_id

    def setGlobal(self, g):
        self.global_object = g
        _id = self.gen_id(5, 4)
        self.map.add(g, _id)
        self.types[_id] = "global"
        seen = {}
        for key in g:
            val = g[key]

            if val == None:
                continue

            num_ = 5 if hasattr(typing, key) else 4
            _id = self.gen_id(5, num_)
            self.map.add(val, _id)
            self.types[_id] = key
