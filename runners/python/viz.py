from collections import deque


class BTree:
    def __init__(self, value):
        self.value = value
        self.left = None
        self.right = None

    @staticmethod
    def create(elems, method='in_order'):
        if type(elems.__wrapped__) != list:
            raise Exception(
                f'viz.BTree.create: elems must be a list. Got {type(elems.__wrapped__)}')
        if not elems:
            return None
        if method != 'in_order' and method != 'binary':
            raise Exception(
                f'Viz.BTree.create: Method must be "in_order" or "binary". Received f{method}')
        elems = elems.__wrapped__

        if method == 'in_order':
            tree = BTree(elems[0])
            dq = deque([tree])
            cur, nxt = None, None
            size, index = 0, 1
            while dq:
                size = len(dq)
                for i in range(size):
                    cur = dq.popleft()
                    for j in range(index, min(index + 2, len(elems))):
                        if elems[j] == None:
                            if j % 2 == 1:
                                cur.left = None
                            else:
                                cur.right = None
                        else:
                            nxt = BTree(elems[j])
                            dq.append(nxt)
                            if j % 2 == 1:
                                cur.left = nxt
                            else:
                                cur.right = nxt
                    index += 2
            return tree
        if method == 'binary':
            def helper(elems, left, right):
                if left >= right:
                    return None
                middle = int((left + right) / 2)
                btree = BTree(elems[middle])
                btree.left = helper(elems, left, middle)
                btree.right = helper(elems, middle + 1, right)
                return btree

            return helper(elems, 0, len(elems))


class SLL:
    def __init__(self, value):
        self.value = value
        self.next = None

    @staticmethod
    def create(elems):
        if type(elems.__wrapped__) != list:
            raise Exception(
                f'viz.SLL.create: elems must be a list. Got {type(elems.__wrapped__)}')

        if not elems:
            return None

        head = SLL(elems[0])
        cur = head

        for i in range(1, len(elems)):
            cur.next = SLL(elems[i])
            cur = cur.next

        return head
