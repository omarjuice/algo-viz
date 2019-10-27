class ValueMap:
    def __init__(self):
        self.map = {}
        self.gc = []  # prevents garbage collection

    def add(self, key, val):
        try:
            self.map[key] = val
        except Exception:
            self.gc.append(key)
            self.map[id(key)] = val

    def get(self, key):
        try:
            if key in self.map:
                return self.map[key]
        except Exception:
            memid = id(key)
            if memid in self.map:
                return self.map[memid]
        return None

    def has(self, key):
        try:
            if key in self.map:
                return True
        except Exception:
            memid = id(key)
            if memid in self.map:
                return True
        return False
