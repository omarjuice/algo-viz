from collections import deque


class DequeSurrogate:
    def __init__(self, values=[]):
        self.front = None
        self.end = None
        self.length = 0
        self.__name__ = 'deque'
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


class DequeSurrogateBlock:
    def __init__(self, value, prev=None):
        self.value = value
        self.next = None
        self.prev = prev


DequeSurrogateBlock.__name__ = 'deque.block'
