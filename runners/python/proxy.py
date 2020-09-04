from wrapt import ObjectProxy
from wrapper_types import TYPES
from struct_surrogates import DequeSurrogate


def generic_proxy(runner):

    class GenericProxy(ObjectProxy):

        def __getattr__(self, name):
            attr = super().__getattr__(name)
            t = type(attr).__name__
            if t == 'method' or t == 'builtin_function_or_method':
                def wrapped_method(*args, **kwargs):
                    result = attr(*args, **kwargs)
                    return result
                return wrapped_method
            else:
                runner.__(attr, {
                    'type': TYPES.GET,
                    'object': self.__wrapped__,
                    'access': name,
                })
                return attr

        def __getitem__(self, key):
            item = super().__getitem__(key)

            runner.__(item, {
                'type': TYPES.GET,
                'object': self.__wrapped__,
                'access': key,
            })

            return item

        def __setattr__(self, name, value):
            if name.startswith('_self_'):
                object.__setattr__(self, name, value)

            elif name == '__wrapped__':
                object.__setattr__(self, name, value)
                try:
                    object.__delattr__(self, '__qualname__')
                except AttributeError:
                    pass
                try:
                    object.__setattr__(self, '__qualname__',
                                       value.__qualname__)
                except AttributeError:
                    pass

            elif name == '__qualname__':
                setattr(self.__wrapped__, name, value)
                object.__setattr__(self, name, value)

            elif hasattr(type(self), name):
                object.__setattr__(self, name, value)

            else:

                setattr(self.__wrapped__, name, runner.virtualize(value))
                runner.__(getattr(self.__wrapped__, name), {
                    'type': TYPES.SET,
                    'object': self.__wrapped__,
                    'access': name,
                })

        def __setitem__(self, key, value):

            result = super().__setitem__(key, runner.virtualize(value))
            runner.__(super().__getitem__(key), {
                'type': TYPES.SET,
                'object': self.__wrapped__,
                'access': key
            })
            return result

        def __delattr__(self, name):
            if name.startswith('_self_'):
                object.__delattr__(self, name)

            elif name == '__wrapped__':
                raise TypeError('__wrapped__ must be an object')

            elif name == '__qualname__':
                object.__delattr__(self, name)
                delattr(self.__wrapped__, name)

            elif hasattr(type(self), name):
                object.__delattr__(self, name)

            else:
                runner.__(True, {
                    'type': TYPES.DELETE,
                    'object': self.__wrapped__,
                    'access': name
                })
                delattr(self.__wrapped__, name)

        def __delitem__(self, key):
            runner.__(True, {
                'type': TYPES.DELETE,
                'object': self.__wrapped__,
                'access': key
            })
            return super().__delitem__(key)

    return GenericProxy


def list_proxy(runner):
    class ListProxy(ObjectProxy):
        def __getitem__(self, key):
            item = super().__getitem__(key)
            if isinstance(key, slice):
                for i in range(len(self))[key]:
                    runner.__(self.__wrapped__[i], {
                        'type': TYPES.GET,
                        'object': self.__wrapped__,
                        'access': i
                    })
            else:
                key = key if key >= 0 else len(self) + key
                runner.__(self.__wrapped__[key], {
                    'type': TYPES.GET,
                    'object': self.__wrapped__,
                    'access': int(key)
                })

            return item

        def __setitem__(self, key, value):
            ln = len(self)
            super().__setitem__(key, value)
            if not isinstance(key, slice):
                key = key if key >= 0 else (len(self) + (key))
                runner.__(self.__wrapped__[key], {
                    'type': TYPES.SET,
                    'object': self.__wrapped__,
                    'access': int(key)
                })
                return
            if ln == len(self):
                for i in range(len(self))[key]:
                    runner.__(self.__wrapped__[i], {
                        'type': TYPES.SET,
                        'object': self.__wrapped__,
                        'access': i
                    })
            else:
                rng = range(ln)[key]
                start = rng[0]
                end = rng[-1]

                for i in range(min(start, end), ln):
                    val = self.__wrapped__[i] if i < len(self) else True
                    runner.__(val, {
                        'type': TYPES.SET if i < len(self) else TYPES.DELETE,
                        'object': self.__wrapped__,
                        'access': i
                    })
                runner.__(len(self), {
                    'type': TYPES.SET,
                    'object': self.__wrapped__,
                    'access': 'length'
                })

        def __delitem__(self, key):
            ln = len(self)
            length = len(range(ln)[key]) if isinstance(key, slice) else 1
            for i in range(ln - length, ln):
                runner.__(True, {
                    'type': TYPES.DELETE,
                    'object': self.__wrapped__,
                    'access': i
                })
            super().__delitem__(key)
            if isinstance(key, slice):
                rng = range(ln)[key]
                start = rng[0]
                end = rng[-1]
                runner.__(len(self), {
                    'type': TYPES.SET,
                    'object': self.__wrapped__,
                    'access': 'length'
                })
                for i in range(min(start, end), len(self)):
                    runner.__(self.__wrapped__[i], {
                        'type': TYPES.SET,
                        'object': self.__wrapped__,
                        'access': i
                    })
            else:
                key = key if key >= 0 else (len(self) + (key))
                runner.__(None, {
                    'type': TYPES.DELETE,
                    'object': self.__wrapped__,
                    'access': len(self)
                })
                runner.__(len(self), {
                    'type': TYPES.SET,
                    'object': self.__wrapped__,
                    'access': 'length'
                })
                for i in range(key, len(self)):
                    runner.__(self.__wrapped__[i], {
                        'type': TYPES.SET,
                        'object': self.__wrapped__,
                        'access': i
                    })

        def append(self, *args, **kwargs):
            l = len(self)
            result = super().__getattr__('append')(*args, **kwargs)
            runner.__(len(self), {
                'type': TYPES.SET,
                'object': self.__wrapped__,
                'access': 'length'
            })
            for i in range(l, len(self)):
                runner.__(self.__wrapped__[i], {
                    'type': TYPES.SET,
                    'object': self.__wrapped__,
                    'access': i
                })
            return result

        def extend(self, *args, **kwargs):
            l = len(self)
            result = super().__getattr__('extend')(*args, **kwargs)
            runner.__(len(self), {
                'type': TYPES.SET,
                'object': self.__wrapped__,
                'access': 'length'
            })
            for i in range(l, len(self)):
                runner.__(self.__wrapped__[i], {
                    'type': TYPES.SET,
                    'object': self.__wrapped__,
                    'access': i
                })
            return result

        def pop(self, *args, **kwargs):
            result = super().__getattr__('pop')(*args, **kwargs)
            idx = len(self) if len(args) == 0 else args[0]
            idx = idx if idx >= 0 else (len(self) + (idx) + 1)
            runner.__(result, {
                'type': TYPES.GET,
                'object': self.__wrapped__,
                'access': idx
            })
            runner.__(True, {
                'type': TYPES.DELETE,
                'object': self.__wrapped__,
                'access': idx
            })
            for i in range(idx, len(self)):
                runner.__(self.__wrapped__[i], {
                    'type': TYPES.SET,
                    'object': self.__wrapped__,
                    'access': i
                })
            runner.__(len(self), {
                'type': TYPES.SET,
                'object': self.__wrapped__,
                'access': 'length'
            })
            return result

        def sort(self, *args, **kwargs):
            result = super().__getattr__('sort')(*args, **kwargs)
            for i, n in enumerate(self.__wrapped__):
                runner.__(n, {
                    'type': TYPES.SET,
                    'object': self.__wrapped__,
                    'access': i
                })
            return result

        def insert(self, *args, **kwargs):
            idx = args[0]
            idx = idx if idx >= 0 else (len(self) + (idx) - 1)
            ln = len(self)
            result = super().__getattr__('insert')(*args, **kwargs)
            runner.__(len(self), {
                'type': TYPES.SET,
                'object': self.__wrapped__,
                'access': 'length'
            })
            if idx > ln:
                runner.__(args[i], {
                    'type': TYPES.SET,
                    'object': self.__wrapped__,
                    'access': ln
                })

            else:
                for i in range(idx, len(self)):
                    runner.__(self.__wrapped__[i], {
                        'type': TYPES.SET,
                        'object': self.__wrapped__,
                        'access': i
                    })
            return result

        def clear(self, *args, **kwargs):
            ln = len(self)
            result = super().__getattr__('clear')(*args, **kwargs)
            for i in range(ln):
                runner.__(True, {
                    'type': TYPES.DELETE,
                    'object': self.__wrapped__,
                    'access': i
                })
            runner.__(0, {
                'type': TYPES.SET,
                'object': self.__wrapped__,
                'access': 'length'
            })
            return result

        def copy(self, *args, **kwargs):
            result = super().__getattr__('copy')(*args, **kwargs)
            for i, n in enumerate(self.__wrapped__):
                runner.__(n, {
                    'type': TYPES.GET,
                    'object': self.__wrapped__,
                    'access': i
                })
            return result

        def count(self, *args, **kwargs):
            result = super().__getattr__('count')(*args, **kwargs)
            for i, n in enumerate(self.__wrapped__):
                runner.__(n, {
                    'type': TYPES.GET,
                    'object': self.__wrapped__,
                    'access': i
                })
            return result

        def index(self, *args, **kwargs):
            result = super().__getattr__('index')(*args, **kwargs)
            start = 0 if len(args) <= 1 else args[1]
            for i in range(start, result + 1):
                runner.__(self.__wrapped__[i], {
                    'type': TYPES.GET,
                    'object': self.__wrapped__,
                    'access': i
                })
            return result

        def remove(self, *args, **kwargs):
            idx = self.index(args[0])
            self.pop(idx)
            return None

        def reverse(self, *args, **kwargs):
            l, r = 0, len(self) - 1
            while l < r:
                self[l], self[r] = self[r], self[l]
                l += 1
                r -= 1

        def __getattr__(self, name):
            attr = super().__getattr__(name)
            t = type(attr).__name__
            if t == 'method' or t == 'builtin_function_or_method' or 'function':
                def wrapped_method(*args, **kwargs):
                    result = attr(*args, **kwargs)
                    return result
                return wrapped_method
            else:
                return attr

        def __iter__(self):
            i = 0
            for n in self.__wrapped__:
                runner.__(n, {
                    'type': TYPES.GET,
                    'object': self.__wrapped__,
                    'access': i
                })
                yield n
                i += 1

        def __reversed__(self):
            i = len(self)
            for n in reversed(self.__wrapped__):
                i -= 1
                runner.__(n, {
                    'type': TYPES.GET,
                    'object': self.__wrapped__,
                    'access': i
                })
                yield n

        def __contains__(self, value):
            result = super().__contains__(value)
            if result == False:
                for v in self:
                    pass
            else:
                idx = self.__wrapped__.index(value)
                for i in range(idx + 1):
                    self[i]
            return result

        def __iadd__(self, other):
            self.extend(other)
            return self

        def __imul__(self, mul):
            if mul > 1:
                vals = self[:]
                vals *= mul - 1
                self.extend(vals)
            return self

    return ListProxy


def dict_proxy(runner):
    class DictProxy(runner.GenericProxy):
        def __getitem__(self, key):
            had_key = key in self.__wrapped__
            item = super().__getitem__(key)
            t = TYPES.GET
            if not had_key and key in self.__wrapped__:
                self.__wrapped__[key] = runner.virtualize(
                    self.__wrapped__[key])
                item = super().__getitem__(key)
                t = TYPES.SET
            runner.__(item, {
                'type': t,
                'object': self.__wrapped__,
                'access': key,
            })

            return item

        def get(self, *args, **kwargs):
            result = super().__getattr__('get')(*args, **kwargs)
            key = args[0]
            if key in self.__wrapped__:
                runner.__(self.__wrapped__[key], {
                    'type': TYPES.GET,
                    'object': self.__wrapped__,
                    'access': (key)
                })
            return result

        def update(self, *args, **kwargs):
            result = super().__getattr__('update')(*args, **kwargs)
            for key in args[0]:
                runner.__(self.__wrapped__[key], {
                    'type': TYPES.SET,
                    'object': self.__wrapped__,
                    'access': key
                })
            return result

        def items(self, *args, **kwargs):
            result = super().__getattr__('items')(*args, **kwargs)
            for key in self.__wrapped__:
                self[key]
            return result

        def setdefault(self, key, default):
            if key in self.__wrapped__:
                return self[key]
            else:
                self[key] = default
                return default

        def clear(self, *args, **kwargs):
            result = super().__getattr__('clear')(*args, **kwargs)
            runner.__(None, {
                'type': TYPES.CLEAR,
                'object': self.__wrapped__,
            })
            return result

        def copy(self, *args, **kwargs):
            result = super().__getattr__('copy')(*args, **kwargs)
            for key in self.__wrapped__:
                self[key]
            return result

        def values(self, *args, **kwargs):
            result = super().__getattr__('values')(*args, **kwargs)
            for key in self.__wrapped__:
                self[key]
            return result

        def pop(self, *args, **kwargs):
            has_key = False if len(
                args) < 1 else args[0] in self.__wrapped__
            result = super().__getattr__('pop')(*args, **kwargs)
            if has_key:
                key = args[0]
                runner.__(result, {
                    'type': TYPES.GET,
                    'object': self.__wrapped__,
                    'access': key
                })
                runner.__(True, {
                    'type': TYPES.DELETE,
                    'object': self.__wrapped__,
                    'access': key
                })
            return result

        def popitem(self, *args, **kwargs):
            has_key = False if len(
                args) < 1 else args[0] in self.__wrapped__
            result = super().__getattr__('popitem')(*args, **kwargs)
            if has_key:
                key = args[0]
                runner.__(result, {
                    'type': TYPES.GET,
                    'object': self.__wrapped__,
                    'access': key
                })
                runner.__(True, {
                    'type': TYPES.DELETE,
                    'object': self.__wrapped__,
                    'access': key
                })
            return result

        def __getattr__(self, name):
            attr = super().__getattr__(name)
            t = type(attr).__name__
            if t == 'method' or t == 'builtin_function_or_method' or 'function':
                def wrapped_method(*args, **kwargs):
                    result = attr(*args, **kwargs)
                    return result
                return wrapped_method
            else:
                return attr
    return DictProxy


def set_proxy(runner):
    class SetProxy(runner.GenericProxy):
        def issubset(self, *args, **kwargs):
            result = super.__getattr__('issubset')(*args, **kwargs)
            for val in self:
                pass
            return result

        def union(self, *args, **kwargs):
            result = super.__getattr__('union')(*args, **kwargs)
            for val in self:
                pass
            return result

        def intersection(self, *args, **kwargs):
            result = super.__getattr__('intersection')(*args, **kwargs)
            for val in self:
                pass
            return result

        def difference(self, *args, **kwargs):
            result = super.__getattr__('difference')(*args, **kwargs)
            for val in self:
                pass
            return result

        def symmetric_difference(self, *args, **kwargs):
            result = super.__getattr__('symmetric_difference')(*args, **kwargs)
            for val in self:
                pass
            return result

        def isdisjoint(self, *args, **kwargs):
            result = super.__getattr__('isdisjoint')(*args, **kwargs)
            for val in self:
                pass
            return result

        def copy(self, *args, **kwargs):
            result = super.__getattr__('copy')(*args, **kwargs)
            for val in self:
                pass
            return result

        def issuperset(self, *args, **kwargs):
            result = super().__getattr__('issuperset')(*args, **kwargs)
            return result

        def add(self, *args, **kwargs):
            result = super().__getattr__('add')(*args, **kwargs)
            runner.__(args[0], {
                'type': TYPES.SET,
                'object': self.__wrapped__,
                'access': args[0]
            })
            return result

        def discard(self, *args, **kwargs):
            had_key = False if len(
                args) < 1 else (args[0] in self.__wrapped__)

            result = super().__getattr__('discard')(*args, **kwargs)
            has_key = args[0] in self.__wrapped__
            if had_key and not has_key:
                runner.__(True, {
                    'type': TYPES.DELETE,
                    'object': self.__wrapped__,
                    'access': args[0]
                })
            return result

        def remove(self, *args, **kwargs):
            had_key = False if len(
                args) < 1 else (args[0] in self.__wrapped__)

            result = super().__getattr__('remove')(*args, **kwargs)
            has_key = args[0] in self.__wrapped__
            if had_key and not has_key:
                runner.__(True, {
                    'type': TYPES.DELETE,
                    'object': self.__wrapped__,
                    'access': args[0]
                })
            return result

        def pop(self, *args, **kwargs):
            result = super().__getattr__('pop')(*args, **kwargs)
            runner.__(result, {
                'type': TYPES.GET,
                'object': self.__wrapped__,
                'access': result
            })
            runner.__(True, {
                'type': TYPES.DELETE,
                'object': self.__wrapped__,
                'access': result
            })
            return result

        def clear(self, *args, **kwargs):
            result = super().__getattr__('clear')(*args, **kwargs)
            runner.__(None, {
                'type': TYPES.CLEAR,
                'object': self.__wrapped__,
            })
            return result

        def update(self, *args, **kwargs):
            vals = {val for val in self.__wrapped__}
            result = super().__getattr__('update')(*args, **kwargs)
            for val in self.__wrapped__:
                if val not in vals:
                    runner.__(val, {
                        'type': TYPES.SET,
                        'object': self.__wrapped__,
                        'access': val
                    })
            return result

        def intersection_update(self, *args, **kwargs):
            vals = {val for val in self.__wrapped__}
            result = super().__getattr__('intersection_update')(*args, **kwargs)
            for val in vals:
                if val not in self.__wrapped__:
                    runner.__(True, {
                        'type': TYPES.DELETE,
                        'object': self.__wrapped__,
                        'access': val
                    })
            return result

        def difference_update(self, *args, **kwargs):
            vals = {val for val in self.__wrapped__}
            result = super().__getattr__('difference_update')(*args, **kwargs)
            for val in vals:
                if val not in self.__wrapped__:
                    runner.__(True, {
                        'type': TYPES.DELETE,
                        'object': self.__wrapped__,
                        'access': val
                    })
            return result

        def symmetric_difference_update(self, *args, **kwargs):
            vals = {val for val in self.__wrapped__}
            result = super().__getattr__('symmetric_difference_update')(*args, **kwargs)
            for val in vals:
                if val not in self.__wrapped__:
                    runner.__(True, {
                        'type': TYPES.DELETE,
                        'object': self.__wrapped__,
                        'access': val
                    })
            return result

        def __getattr__(self, name):
            attr = super().__getattr__(name)
            t = type(attr).__name__
            if t == 'method' or t == 'builtin_function_or_method' or 'function':
                def wrapped_method(*args, **kwargs):
                    result = attr(*args, **kwargs)
                    return result
                return wrapped_method
            else:
                return attr

        def __le__(self, other):
            ret = super().__le__(other)
            for val in self:
                if val not in other:
                    break
            return ret

        def __ge__(self, other):
            ret = super().__ge__(other)
            for val in other:
                if val not in self:
                    break
            return ret

        def __or__(self, other):
            ret = super().__or__(other)
            for val in self:
                pass
            for val in other:
                pass
            return ret

        def __and__(self, other):
            ret = super().__and__(other)
            s = self if len(self) < len(other) else other
            o = self if len(self) >= len(other) else other
            for v in s:
                if v in o:
                    pass
            return ret

        def __sub__(self, other):
            ret = super().__sub__(other)
            for v in self:
                v in other

            return ret

        def __xor__(self, other):
            ret = super().__xor__(other)
            for v in self:
                pass
            for v in other:
                pass
            return ret

        def __ior__(self, other):
            ret = super().__ior__(other)
            for val in other:
                runner.__(val, {
                    'type': TYPES.SET,
                    'object': self,
                    'access': val
                })
            return ret

        def __iand__(self, other):
            vals = {v for v in self.__wrapped__}
            ret = super().__iand__(other)
            for val in vals:
                if not val in other:
                    runner.__(val, {
                        'type': TYPES.DELETE,
                        'object': self,
                        'access': val
                    })
            return ret

        def __isub__(self, other):
            vals = {v for v in self.__wrapped__}
            ret = super().__isub__(other)
            for val in other:
                if val in vals:
                    runner.__(val, {
                        'type': TYPES.DELETE,
                        'object': self,
                        'access': val
                    })
            return ret

        def __ixor__(self, other):
            vals = {v for v in self.__wrapped__}
            ret = super().__ixor__(other)
            for val in other:
                pass
            for val in self.__wrapped__:
                if val not in vals:
                    runner.__(val, {
                        'type': TYPES.SET,
                        'object': self,
                        'access': val
                    })
            for val in vals:
                if val not in self.__wrapped__:
                    runner.__(val, {
                        'type': TYPES.DELETE,
                        'object': self,
                        'access': val
                    })
            return ret

        def __contains__(self, val):
            has = super().__contains__(val)
            if has:
                runner.__(val, {
                    'type': TYPES.GET,
                    'object': self.__wrapped__,
                    'access': val
                })
            return has

        def __iter__(self):
            for val in self.__wrapped__:
                runner.__(val, {
                    'type': TYPES.GET,
                    'object': self.__wrapped__,
                    'access': val
                })
                yield val

    return SetProxy


def counter_proxy(runner):
    class CounterProxy(runner.DictProxy):
        def most_common(self, *args, **kwargs):
            result = super().__getattr__('most_common')(*args, **kwargs)
            for val in self:
                self[val]
            return result

        def subtract(self, *args, **kwargs):
            vals = {a: b for a, b in self.__wrapped__.items()}
            result = super().__getattr__('subtract')(*args, **kwargs)
            for key in vals:
                if self.__wrapped__[key] != vals[key]:
                    runner.__(self.__wrapped__[key], {
                        'type': TYPES.SET,
                        'object': self.__wrapped__,
                        'access': key
                    })

        def elements(self, *args, **kwargs):
            result = super().__getattr__('elements')(*args, *kwargs)
            for val in self:
                self[val]
            return result

        def update(self, *args, **kwargs):
            vals = {a: b for a, b in self.__wrapped__.items()}
            result = super().__getattr__('update')(*args, **kwargs)
            for key in vals:
                if self.__wrapped__[key] != vals[key]:
                    runner.__(self.__wrapped__[key], {
                        'type': TYPES.SET,
                        'object': self.__wrapped__,
                        'access': key
                    })
    return CounterProxy


def ordereddict_proxy(runner):
    class OrderedDictProxy(runner.DictProxy):
        def popitem(self, *args, **kwargs):
            result = super().__getattr__('popitem')(*args, **kwargs)
            key, val = result
            runner.__(True, {
                'type': TYPES.DELETE,
                'object': self.__wrapped__,
                'access': key
            })
            return result
    return OrderedDictProxy


def deque_proxy(runner):
    class DequeProxy(ObjectProxy):

        def append(self, *args, **kwargs):
            result = super().__getattr__('append')(*args, **kwargs)
            surrogate = runner.get_surrogate(self)
            DequeSurrogate.append(surrogate, *args, **kwargs)
            return result

        def appendleft(self, *args, **kwargs):
            result = super().__getattr__('appendleft')(*args, **kwargs)
            surrogate = runner.get_surrogate(self)
            DequeSurrogate.appendleft(surrogate, *args, **kwargs)
            return result

        def pop(self, *args, **kwargs):
            result = super().__getattr__('pop')(*args, **kwargs)
            surrogate = runner.get_surrogate(self)
            DequeSurrogate.pop(surrogate, *args, **kwargs)
            return result

        def popleft(self, *args, **kwargs):
            result = super().__getattr__('popleft')(*args, **kwargs)
            surrogate = runner.get_surrogate(self)
            DequeSurrogate.popleft(surrogate, *args, **kwargs)
            return result

        def count(self, *args, **kwargs):
            result = super().__getattr__('count')(*args, **kwargs)
            surrogate = runner.get_surrogate(self)
            for val in surrogate:
                pass
            return result

        def clear(self, *args, **kwargs):
            result = super().__getattr__('clear')(*args, **kwargs)
            surrogate = runner.get_surrogate(self)
            DequeSurrogate.clear(surrogate, *args, **kwargs)
            return result

        def extend(self, elems):
            result = super().__getattr__('extend')(elems)
            surrogate = runner.get_surrogate(self)
            for el in elems.__wrapped__:
                DequeSurrogate.append(surrogate, el)
            return result

        def extendleft(self, elems):
            result = super().__getattr__('extendleft')(elems)
            surrogate = runner.get_surrogate(self)
            for el in elems:
                DequeSurrogate.appendleft(surrogate, el)
            return result

        def remove(self, value):
            result = super().__getattr__('remove')(value)
            surrogate = runner.get_surrogate(self)
            DequeSurrogate.remove(surrogate, value)
            return result

        def reverse(self):
            result = super().__getattr__('reverse')()
            surrogate = runner.get_surrogate(self)
            DequeSurrogate.reverse(surrogate)
            return result

        def rotate(self, n=1):
            result = super().__getattr__('rotate')(n)
            surrogate = runner.get_surrogate(self)
            if n < 0:
                m = -n % len(self)
                while m:
                    DequeSurrogate.append(
                        surrogate, DequeSurrogate.popleft(surrogate))
                    m -= 1
            if n > 0:
                m = n % len(self)
                while m:
                    DequeSurrogate.appendleft(
                        surrogate, DequeSurrogate.pop(surrogate))
                    m -= 1

        def __iter__(self):
            surrogate = runner.get_surrogate(self)
            for val, _ in zip(self.__wrapped__, surrogate):
                yield val

        def __reversed__(self):
            surrogate = runner.get_surrogate(self)
            for val, _ in zip(reversed(self.__wrapped__), reversed(surrogate)):
                yield val

        def __contains__(self, value):
            result = super().__contains__(value)
            value in runner.get_surrogate(self)
            return result

        def __getitem__(self, key):
            result = super().__getitem__(key)
            surrogate = runner.get_surrogate(self)
            DequeSurrogate.index(surrogate, key)
            return result

        def __delitem__(self, key):
            result = super().__getitem__(key)
            surrogate = runner.get_surrogate(self)
            DequeSurrogate.delete(surrogate, key)
            return result

        def __setitem__(self, key, value):
            result = super().__setitem__(key, value)
            surrogate = runner.get_surrogate(self)
            DequeSurrogate.setval(surrogate, key, value)
            return result
    return DequeProxy
