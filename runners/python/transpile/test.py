from main import transform
from astunparse import unparse


funcs = {
    'friends': '''
def findCircleNum(self, M: List[List[int]]) -> int:
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

    ''',

    'ops': '''
z = a + b + (c if g > 5 else 10)
'''
}


transpiled = unparse(transform(
    funcs['ops']
))

open('transpiled.py', "w+").write(transpiled)
