from transform import transform
from astunparse import unparse


funcs = {
    'friends': '''
class Solution:
    def findCircleNum(self, M) -> int:
        N = len(M)
        union = {n:n for n in range(N)}
        self.circles = N

        def merge(x,y):
            a,b = find(x), find(y)

            if a != b:
                union[a] = b
                self.circles -= 1

        def find(x):
            if union[x] != x:
                union[x] = find(union[x])
            return union[x]

        for i in range(N):
            for j in range(N):
                if M[i][j] == 1:
                    merge(i,j)

        return self.circles

Solution().findCircleNum([[1,1],[1,1]])

k = (1,2)
[j,k] = 3,4

    ''',

    'ops': '''
z = a + b + (c if g > 5 else 10)
''',
    'loop': '''

obj = {
    'a': 1,
    'b': (1,2),
    'c': 'string'
}

arr = [(a,b) for a,b in obj.items()]


    ''',
    'assignments': '''

def g():
    a = 1
    b,c = 2,6

    a = b = 10
    (a,b) = [3,4]

g()
'''
}


code = funcs['assignments']


transpiled = unparse(transform(code))


open('transpiled.py', "w+").write(transpiled)


def _WRAPPER(val, info):

    start, end = info['name']

    print(info['type'], ':', code[start:end])
    print('>>>', val)
    return val


exec(transpiled)
