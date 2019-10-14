from wrapt import ObjectProxy
from wrapper_types import TYPES


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

                setattr(self.__wrapped__, name, value)
                runner.__(getattr(self.__wrapped__, name), {
                    'type': TYPES.SET,
                    'object': self.__wrapped__,
                    'access': name,
                })

        def __setitem__(self, key, value):

            result = super().__setitem__(key, value)
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
                print('DELETE', name)
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
                start = key.start if key.start != None else 0
                stop = key.stop if key.stop != None else len(self)
                step = key.step if key.step != None else 1
                stop = stop if stop >= 0 else (len(self) + stop)

                for i in range(start, stop, step):
                    runner.__(self.__wrapped__[i], {
                        'type': TYPES.GET,
                        'object': self.__wrapped__,
                        'access': i
                    })
            else:
                key = key if key >= 0 else (len(self) + (key))
                runner.__(self.__wrapped__[key], {
                    'type': TYPES.GET,
                    'object': self.__wrapped__,
                    'access': key
                })

            return item

        def __setitem__(self, key, value):
            ln = len(self)
            super().__setitem__(key, value)
            if isinstance(key, slice):
                start = key.start if key.start != None else 0
                stop = key.stop if key.stop != None else len(self)
                step = key.step if key.step != None else 1
                stop = stop if stop >= 0 else (len(self) + stop)
                ...
                if len(self) != ln:
                    runner.__(len(self), {
                        'type': TYPES.SET,
                        'object': self.__wrapped__,
                        'access': 'length'
                    })
                for i in range(start, len(self)):
                    runner.__(self.__wrapped__[i], {
                        'type': TYPES.SET,
                        'object': self.__wrapped__,
                        'access': i
                    })

            else:
                key = key if key >= 0 else (len(self) + (key))
                runner.__(self.__wrapped__[key], {
                    'type': TYPES.SET,
                    'object': self.__wrapped__,
                    'access': key
                })

        def __delitem__(self, key):
            super().__delitem__(key)
            if isinstance(key, slice):
                start = key.start if key.start != None else 0
                stop = key.stop if key.stop != None else len(self)
                step = key.step if key.step != None else 1
                stop = stop if stop >= 0 else (len(self) + stop)
                ...
                runner.__(len(self), {
                    'type': TYPES.SET,
                    'object': self.__wrapped__,
                    'access': 'length'
                })
                for i in range(start, len(self)):
                    runner.__(self.__wrapped__[i], {
                        'type': TYPES.SET,
                        'object': self.__wrapped__,
                        'access': i
                    })

            else:
                key = key if key >= 0 else (len(self) + (key))
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

        def __getattr__(self, name):
            attr = super().__getattr__(name)
            t = type(attr).__name__
            if t == 'method' or t == 'builtin_function_or_method' or 'function':
                if name == 'append' or name == 'extend':
                    def wrapped_method(*args, **kwargs):
                        l = len(self)
                        result = attr(*args, **kwargs)
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
                    return wrapped_method
                elif name == 'pop':
                    def wrapped_method(*args, **kwargs):
                        result = attr(*args, **kwargs)
                        idx = len(self) - 1 if len(args) == 0 else args[0]
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
                        runner.__(len(self), {
                            'type': TYPES.SET,
                            'object': self.__wrapped__,
                            'access': 'length'
                        })
                        return result
                    return wrapped_method
                elif name == 'sort':
                    def wrapped_method(*args, **kwargs):
                        result = attr(*args, **kwargs)
                        for i, n in enumerate(self.__wrapped__):
                            runner.__(n, {
                                'type': TYPES.SET,
                                'object': self.__wrapped__,
                                'access': i
                            })
                        return result
                    return wrapped_method
                elif name == 'insert':
                    def wrapped_method(*args, **kwargs):
                        idx = args[0]
                        idx = idx if idx >= 0 else (len(self) + (idx) - 1)
                        ln = len(self)
                        result = attr(*args, **kwargs)
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
                    return wrapped_method
                elif name == 'clear':
                    def wrapped_method(*args, **kwargs):
                        ln = len(self)
                        result = attr(*args, **kwargs)
                        for i in range(ln):
                            runner.__(True, {
                                'type': TYPES.DELETE,
                                'object': self.__wrapped__,
                                'access': i
                            })
                        print('SET', 'length', 0)
                        runner.__(0, {
                            'type': TYPES.SET,
                            'object': self.__wrapped__,
                            'access': 'length'
                        })
                        return result
                    return wrapped_method
                elif name == 'copy' or name == 'count':
                    def wrapped_method(*args, **kwargs):
                        result = attr(*args, **kwargs)
                        for i, n in enumerate(self.__wrapped__):
                            runner.__(n, {
                                'type': TYPES.GET,
                                'object': self.__wrapped__,
                                'access': i
                            })
                        return result
                    return wrapped_method
                elif name == 'index':
                    def wrapped_method(*args, **kwargs):
                        result = attr(*args, **kwargs)
                        start = 0 if len(args) <= 1 else args[1]
                        for i in range(start, result + 1):
                            runner.__(self.__wrapped__[i], {
                                'type': TYPES.GET,
                                'object': self.__wrapped__,
                                'access': i
                            })
                        return result
                    return wrapped_method
                elif name == 'remove':
                    def wrapped_method(*args, **kwargs):
                        idx = self.index(args[0])
                        self.pop(idx)
                        return None
                    return wrapped_method
                elif name == 'reverse':
                    def wrapped_method(*args, **kwargs):
                        l, r = 0, len(self) - 1
                        while l < r:
                            self[l], self[r] = self[r], self[l]
                            l += 1
                            r -= 1
                    return wrapped_method
                else:
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
    return ListProxy


def dict_proxy(runner):
    class DictProxy(runner.GenericProxy):
        def __getattr__(self, name):
            attr = super().__getattr__(name)
            t = type(attr).__name__
            if t == 'method' or t == 'builtin_function_or_method' or 'function':
                if name == 'get':
                    def wrapped_method(*args, **kwargs):
                        result = attr(*args, **kwargs)
                        key = args[0]
                        if key in self.__wrapped__:
                            runner.__(self.__wrapped__[key], {
                                'type': TYPES.GET,
                                'object': self.__wrapped__,
                                'access': key
                            })
                        return result
                    return wrapped_method
                elif name == 'update':
                    def wrapped_method(*args, **kwargs):
                        result = attr(*args, **kwargs)
                        for key in args[0]:
                            runner.__(self.__wrapped__[key], {
                                'type': TYPES.SET,
                                'object': self.__wrapped__,
                                'access': key
                            })
                        return result
                    return wrapped_method
                elif name == 'items':
                    def wrapped_method(*args, **kwargs):
                        result = attr(*args, **kwargs)
                        for key in self.__wrapped__:
                            self[key]
                        return result
                    return wrapped_method
                elif name == 'setdefault':
                    def wrapped_method(key, default):
                        if key in self.__wrapped__:
                            return self[key]
                        else:
                            self[key] = default
                            return default
                    return wrapped_method
                elif name == 'clear':
                    def wrapped_method(*args, **kwargs):
                        result = attr(*args, **kwargs)
                        runner.__(None, {
                            'type': TYPES.CLEAR,
                            'object': self.__wrapped__,
                            'access': key
                        })
                        return result
                    return wrapped_method
                elif name == 'copy' or name == 'values':
                    def wrapped_method(*args, **kwargs):
                        result = attr(*args, **kwargs)
                        for key in self.__wrapped__:
                            self[key]
                        return result
                    return wrapped_method
                elif name == 'pop' or name == 'popitem':
                    def wrapped_method(*args, **kwargs):
                        has_key = False if len(
                            args) < 1 else args[0] in self.__wrapped__
                        result = attr(*args, **kwargs)
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
                    return wrapped_method
                else:
                    def wrapped_method(*args, **kwargs):
                        result = attr(*args, **kwargs)
                        return result
                    return wrapped_method
            else:
                return attr
    return DictProxy


def set_proxy(runner):
    class SetProxy(runner.GenericProxy):
        def __getattr__(self, name):
            attr = super().__getattr__(name)
            t = type(attr).__name__
            if t == 'method' or t == 'builtin_function_or_method' or 'function':
                if name in {'issubset', 'union', 'intersection', 'difference', 'symmetric_difference', 'isdisjoint', 'copy'}:
                    def wrapped_method(*args, **kwargs):
                        result = attr(*args, **kwargs)
                        for val in self:
                            pass
                        return result
                    return wrapped_method
                elif name == 'issuperset':
                    def wrapped_method(*args, **kwargs):
                        result = attr(*args, **kwargs)
                        return result
                    return wrapped_method
                elif name == 'add':
                    def wrapped_method(*args, **kwargs):
                        result = attr(*args, **kwargs)
                        runner.__(args[0], {
                            'type': TYPES.SET,
                            'object': self.__wrapped__,
                            'access': args[0]
                        })
                        return result
                    return wrapped_method
                elif name == 'remove' or name == 'discard':
                    def wrapped_method(*args, **kwargs):
                        had_key = False if len(
                            args) < 1 else (args[0] in self.__wrapped__)

                        result = attr(*args, **kwargs)
                        has_key = args[0] in self.__wrapped__
                        if had_key and not has_key:
                            runner.__(True, {
                                'type': TYPES.DELETE,
                                'object': self.__wrapped__,
                                'access': args[0]
                            })
                        return result
                    return wrapped_method
                elif name == 'pop':
                    def wrapped_method(*args, **kwargs):
                        result = attr(*args, **kwargs)
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
                    return wrapped_method
                elif name == 'clear':
                    def wrapped_method(*args, **kwargs):
                        result = attr(*args, **kwargs)
                        runner.__(None, {
                            'type': TYPES.CLEAR,
                            'object': self.__wrapped__,
                        })
                        return result
                    return wrapped_method
                elif name == 'update':
                    def wrapped_method(*args, **kwargs):
                        vals = {val for val in self.__wrapped__}
                        result = attr(*args, **kwargs)
                        for val in self.__wrapped__:
                            if val not in vals:
                                runner.__(val, {
                                    'type': TYPES.SET,
                                    'object': self.__wrapped__,
                                    'access': val
                                })
                        return result
                    return wrapped_method
                elif name in {'intersection_update', 'difference_update', 'symmetric_difference_update'}:
                    def wrapped_method(*args, **kwargs):
                        vals = {val for val in self.__wrapped__}
                        result = attr(*args, **kwargs)
                        for val in vals:
                            if val not in self.__wrapped__:
                                runner.__(True, {
                                    'type': TYPES.DELETE,
                                    'object': self.__wrapped__,
                                    'access': val
                                })
                        return result
                    return wrapped_method
                else:
                    def wrapped_method(*args, **kwargs):
                        result = attr(*args, **kwargs)
                        return result
                    return wrapped_method

            else:
                return attr

        def __iter__(self):
            for val in self.__wrapped__:
                runner.__(val, {
                    'type': TYPES.GET,
                    'object': self.__wrapped__,
                    'access': val
                })
                yield val

    return SetProxy
