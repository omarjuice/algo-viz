from proxy import ObjectProxy


def type_override(obj):
    if isinstance(obj, ObjectProxy):
        return type(obj.__wrapped__)
    else:
        return type(obj)


def create(_name, runner):
    return {
        _name: runner,
        'dir': None,
        'open': None,
        'type': type_override
    }
