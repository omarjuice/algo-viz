from runner import Runner
from transpile import transform
from astunparse import unparse
import json

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
(a): int = 1

a += 1+1
# b = f"sin({a})"
''',
    'lambda': '''

a = lambda x,y,*z : x + y + sum(z)

a(1,2,3,4,5,6,7,8,9,10)
''',
    'DNA': '''

def findRepeatedDnaSequences(s: str):
        seen = {}
        output = []
        for i in range(len(s) - 9):

            seq = s[i:i+10]
            if seq in seen and seen[seq] == 1:
                output.append(seq)
                seen[seq] += 1
            elif seq not in seen:
                seen[seq] = 1


        return output
findRepeatedDnaSequences("AAAAACCCCCAAAAACCCCCCAAAAAGGGTTT")
''',


}


for name, code in funcs.items():
    # try:
    #     input = [""]
    #     tree = transform(code, input)
    #     transpiled = unparse(tree)

    #     _name = input[0]

    #     open('transpiled.py', "w+").write(transpiled)

    #     exec(transpiled, {_name: Runner(_name, code),
    #                       'dir': None, 'open': None}, {})
    #     print(f"✔ {name}")
    # except Exception as e:
    #     print(f"✖ {name} -> {e}")

    input = [""]
    tree = transform(code, input)
    transpiled = unparse(tree)

    _name = input[0]

    open('transpiled.py', "w+").write(transpiled)
    runner = Runner(_name, code)
    exec(transpiled, {_name: runner,
                      'dir': None, 'open': None}, {})
    open('executed.json', 'w+').write(
        json.dumps(
            {
                'steps': runner.steps,
                'objects': runner.objects,
                'types': runner.types,
                'objectIndex': runner.objectIndex,
                'dataVersion': 1
            }
        )
    )
    print(f"✔ {name}")
    # print(f"✖ {name} -> {e}")
