from collections import deque


class DequeSurrogate:
    def __init__(self, values=[]):
        self.front = None
        self.end = None
        self.length = 0
        for value in values:
            self.append(value)

    def append(self, x):
        if not self.front:
            self.front = DequeSurrogateNode(x)
            self.end = self.front
        else:
            self.end.next = DequeSurrogateNode(x, self.end)
            self.end = self.end.next
        self.length += 1

    def appendleft(self, x):
        if not self.front:
            self.front = DequeSurrogateNode(x)
            self.end = self.front
        else:
            node = DequeSurrogateNode(x)
            node.next = self.front
            self.front.prev = node
            self.front = node
        self.length += 1

    def pop(self):
        node = self.end
        self.end = node.prev
        node.prev = None
        if self.end:
            self.end.next = None
        else:
            self.front = None
        return node.value

    def popleft(self):
        node = self.front
        self.front = node.next
        node.next = None
        if self.front:
            self.front.prev = None
        else:
            self.end = None
        return node.value


class DequeSurrogateNode:
    def __init__(self, value, prev=None):
        self.value = value
        self.next = None
        self.prev = prev
