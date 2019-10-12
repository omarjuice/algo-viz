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

for a,b, (c,d) in [[1,2, [3,4]]]:
    a + b + c + d


    ''',
    'assignments': '''

def g():
    a = 1
    b = 6

    a = b = 10

    (a,b,(c,d)) = [1,2,[3,4]]


g()
''',
    'func': '''
class K:
    def func(self,a,b,c=5,*d):
        self = 5
        return self
K().func(1,2,3,4,5,6)
''',
    'class': '''
class S:
    z = 1
    def __init__(self):
        1 + 1
''',
    'generator': '''
a = {i:i for i in range(5)}
'''
}


code = funcs['generator']


transpiled = unparse(transform(code))


open('transpiled.py', "w+").write(transpiled)


def _WRAPPER(val, info):

    start, end = info.get('name', (0, 0))

    print(info['type'], ':', code[start:end] or info.get('funcName'))
    print('>>>', val)
    return val


exec(transpiled)
