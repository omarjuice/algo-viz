from wrapt import ObjectProxy


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
            print('GET', attr)
            return attr

    def __getitem__(self, key):
        item = super().__getitem__(key)

        print('GET', key)

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
                object.__setattr__(self, '__qualname__', value.__qualname__)
            except AttributeError:
                pass

        elif name == '__qualname__':
            setattr(self.__wrapped__, name, value)
            object.__setattr__(self, name, value)

        elif hasattr(type(self), name):
            object.__setattr__(self, name, value)

        else:
            print('SET', name)
            setattr(self.__wrapped__, name, value)

    def __setitem__(self, key, value):
        print('SET', key)
        return super().__setitem__(key, value)

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
            print('DELETE', key)
            delattr(self.__wrapped__, name)

    def __delitem__(self, key):
        print('DELETE', key)
        return super().__delitem__(key)


class ListProxy(ObjectProxy):
    def __getitem__(self, key):
        item = super().__getitem__(key)
        if isinstance(key, slice):
            start = key.start if key.start != None else 0
            stop = key.stop if key.stop != None else len(self)
            step = key.step if key.step != None else 1
            stop = stop if stop >= 0 else (len(self) + stop)

            for i in range(start, stop, step):
                print('GET', i)
        else:
            key = key if key >= 0 else (len(self) + (key))
            print('GET', key)

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
                print('SET', 'length', len(self))
            for i in range(start, len(self)):
                print('SET', i, self.__wrapped__[i])

        else:
            key = key if key >= 0 else (len(self) + (key))
            print('GET', value)

    def __delitem__(self, key):
        super().__delitem__(key)
        if isinstance(key, slice):
            start = key.start if key.start != None else 0
            stop = key.stop if key.stop != None else len(self)
            step = key.step if key.step != None else 1
            stop = stop if stop >= 0 else (len(self) + stop)
            ...
            print('SET', 'length', len(self))
            for i in range(start, len(self)):
                print('SET', i, self.__wrapped__[i])

        else:
            key = key if key >= 0 else (len(self) + (key))
            print('SET', 'length', len(self))
            for i in range(key, len(self)):
                print('SET', i, self.__wrapped__[i])

    def __getattr__(self, name):
        attr = super().__getattr__(name)
        t = type(attr).__name__
        if t == 'method' or t == 'builtin_function_or_method' or 'function':
            if name == 'append' or name == 'extend':
                def wrapped_method(*args, **kwargs):
                    l = len(self)
                    result = attr(*args, **kwargs)
                    print('SET', 'length', len(self))
                    for i in range(l, len(self)):
                        print('SET', i, self.__wrapped__[i])
                    return result
                return wrapped_method
            elif name == 'pop':
                def wrapped_method(*args, **kwargs):
                    result = attr(*args, **kwargs)
                    idx = len(self) - 1 if len(args) == 0 else args[0]
                    idx = idx if idx >= 0 else (len(self) + (idx) + 1)
                    print('DELETE', idx)
                    print('SET', 'length', len(self))
                    return result
                return wrapped_method
            elif name == 'sort':
                def wrapped_method(*args, **kwargs):
                    result = attr(*args, **kwargs)
                    for i, n in enumerate(self.__wrapped__):
                        print('SET', i, n)
                    return result
                return wrapped_method
            elif name == 'insert':
                def wrapped_method(*args, **kwargs):
                    idx = args[0]
                    idx = idx if idx >= 0 else (len(self) + (idx) - 1)
                    ln = len(self)
                    result = attr(*args, **kwargs)
                    print('SET', 'length', len(self))
                    if idx > ln:
                        print('SET', ln, args[1])
                    else:
                        for i in range(idx, len(self)):
                            print('SET', i, self.__wrapped__[i])
                    return result
                return wrapped_method
            elif name == 'clear':
                def wrapped_method(*args, **kwargs):
                    ln = len(self)
                    result = attr(*args, **kwargs)
                    for i in range(ln):
                        print('DELETE', i)
                    print('SET', 'length', 0)
                    return result
                return wrapped_method
            elif name == 'copy' or name == 'count':
                def wrapped_method(*args, **kwargs):
                    result = attr(*args, **kwargs)
                    for i, n in enumerate(self.__wrapped__):
                        print('GET', i)
                    return result
                return wrapped_method
            elif name == 'index':
                def wrapped_method(*args, **kwargs):
                    result = attr(*args, **kwargs)
                    start = 0 if len(args) <= 1 else args[1]
                    for i in range(start, result + 1):
                        print('GET', i)
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
            print('GET', i)
            yield n
            i += 1

    def __reversed__(self):
        i = len(self)
        for n in reversed(self.__wrapped__):
            i -= 1
            print('GET', i)
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


class DictProxy(GenericProxy):
    def __getattr__(self, name):
        attr = super().__getattr__(name)
        t = type(attr).__name__
        if t == 'method' or t == 'builtin_function_or_method' or 'function':
            if name == 'get':
                def wrapped_method(*args, **kwargs):
                    result = attr(*args, **kwargs)
                    key = args[0]
                    if key in self.__wrapped__:
                        print('GET', key)
                    return result
                return wrapped_method
            elif name == 'update':
                def wrapped_method(*args, **kwargs):
                    result = attr(*args, **kwargs)
                    for key in args[0]:
                        print('SET', key, self.__wrapped__[key])
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
                    print('CLEAR')
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
                    has_key = args[0] in self.__wrapped__
                    result = attr(*args, **kwargs)
                    if has_key:
                        print('GET', args[0])
                    return result
                return wrapped_method
            else:
                def wrapped_method(*args, **kwargs):
                    result = attr(*args, **kwargs)
                    return result
                return wrapped_method
        else:
            return attr


class SetProxy(GenericProxy):
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
                    print('SET', args[0], args[0])
                    return result
                return wrapped_method
            elif name == 'remove' or name == 'discard':
                def wrapped_method(*args, **kwargs):
                    had_key = False if len(
                        args) < 1 else (args[0] in self.__wrapped__)

                    result = attr(*args, **kwargs)
                    has_key = args[0] in self.__wrapped__
                    if had_key and not has_key:
                        print('DELETE', args[0])
                    return result
                return wrapped_method
            elif name == 'pop':
                def wrapped_method(*args, **kwargs):
                    result = attr(*args, **kwargs)
                    print('DELETE', result)
                    return result
                return wrapped_method
            elif name == 'clear':
                def wrapped_method(*args, **kwargs):
                    result = attr(*args, **kwargs)
                    print('CLEAR')
                    return result
                return wrapped_method
            elif name == 'update':
                def wrapped_method(*args, **kwargs):
                    vals = {val for val in self.__wrapped__}
                    result = attr(*args, **kwargs)
                    for val in self.__wrapped__:
                        if val not in vals:
                            print('SET', val, val)
                    return result
                return wrapped_method
            elif name in {'intersection_update', 'difference_update', 'symmetric_difference_update'}:
                def wrapped_method(*args, **kwargs):
                    vals = {val for val in self.__wrapped__}
                    result = attr(*args, **kwargs)
                    for val in vals:
                        if val not in self.__wrapped__:
                            print('DELETE', val)
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
            print('GET', val)
            yield val
