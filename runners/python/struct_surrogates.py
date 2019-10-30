

class DequeSurrogate:
    def __init__(self, values=[]):
        self.front = None
        self.end = None
        self.length = 0
        for value in values:
            self.append(value)

    def append(self, x):
        if self.length == 0:
            self.front = DequeSurrogateBlock(x)
            self.end = self.front
        else:
            self.end.next = DequeSurrogateBlock(x, self.end)
            self.end = self.end.next
        self.length += 1

    def appendleft(self, x):
        if self.length == 0:
            self.front = DequeSurrogateBlock(x)
            self.end = self.front
        else:
            node = DequeSurrogateBlock(x)
            node.next = self.front
            self.front.prev = node
            self.front = node
        self.length += 1

    def pop(self):
        if not self.front:
            return
        node = self.end
        self.end = node.prev
        node.prev = None
        if self.end:
            self.end.next = None
        else:
            self.front = None
        self.length -= 1
        return node.value

    def popleft(self):
        if not self.front:
            return
        node = self.front
        self.front = node.next
        node.next = None
        if self.front:
            self.front.prev = None
        else:
            self.end = None
        self.length -= 1
        return node.value

    def remove(self, value):
        cur = self.front
        while cur and cur.value != value:
            cur = cur.next

        if not cur:
            return
        DequeSurrogate.remove_node(self, cur)

    def remove_node(self, node):
        prev = node.prev
        nxt = node.next
        if prev:
            prev.next = nxt
        else:
            self.front = nxt
        if nxt:
            nxt.prev = prev
        else:
            self.end = prev
        node.next = None
        node.prev = None

    def clear(self):
        self.front = None
        self.end = None
        self.length = 0

    def reverse(self):
        cur = self.front
        self.front = self.end
        self.end = cur
        prev = None
        while cur:
            nxt = cur.next
            cur.next = prev
            prev = cur
            cur = nxt
            if prev:
                prev.prev = cur

    def __reversed__(self):
        cur = self.end
        while cur:
            yield cur.value
            cur = cur.prev

    def __iter__(self):
        cur = self.front
        while cur:
            yield cur.value
            cur = cur.next

    def __contains__(self, value):
        cur = self.front
        while cur:
            if cur.value == value:
                return True
            cur = cur.next
        return False

    def index(self, idx):
        if idx >= 0:
            cur = self.front
            i = 0
            while i != idx:
                cur = cur.next
                i += 1
            cur.value
            return cur
        else:
            cur = self.end
            i = -1
            while i != idx:
                cur = cur.prev
                i -= 1
            cur.value
            return cur

    def setval(self, idx, value):
        node = DequeSurrogate.index(self, idx)
        node.value = value

    def delete(self, idx):
        node = DequeSurrogate.index(self, idx)
        DequeSurrogate.remove_node(self, node)


DequeSurrogate.__name__ = 'collections.deque'


class DequeSurrogateBlock:
    def __init__(self, value, prev=None):
        self.value = value
        self.next = None
        self.prev = prev


DequeSurrogateBlock.__name__ = 'collections.deque.block'
