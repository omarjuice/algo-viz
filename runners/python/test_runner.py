from runner import Runner
from transpile import transform
from astunparse import unparse
import global_sandbox
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
    x,*y = (1,2,3,4,5)
    m,*(n,o) = (6,7,8)


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
    'PA': '''

class Solution(object):
    def __init__(self):
        self.directions = [(1,0), (0,1), (-1,0), (0,-1)]

    def pacificAtlantic(self, matrix):
    
                            
                        
        if not matrix: return []
        po_set = set()
        ao_set = set()
        def dfs(r,c, s):
                            
            if (r,c) in s: return
            s.add((r,c))
            for v, h in self.directions:
                i = r + v
                j = c + h
                if i >= len(matrix) or i < 0: continue
                if j >= len(matrix[i]) or j < 0: continue
                val = matrix[i][j]
                if val >= matrix[r][c]:
                    dfs(i,j,s)
                                    
                                
                            
        for r in range(len(matrix)):
            dfs(r,0, po_set)
            dfs(r, len(matrix[0]) - 1, ao_set)
                                
        for c in range(len(matrix[0])):
            dfs(0, c, po_set)
            dfs(len(matrix) - 1, c, ao_set)
                            
        return list(po_set & ao_set)

Solution().pacificAtlantic(
    [[1,2,2,3,5],[3,2,3,4,4],[2,4,5,3,1],[6,7,1,4,5],[5,1,1,2,4]]
)
''',
    'tuple': '''
a = (1,[])
''',
    'import': '''

from bisect import insort

arr = [1,2,4,5]

insort(arr, 3)
''',
    'f': '''
a = globals()
''',

    'comprehensions': '''


arr = [[(i,j) for i in range(2)] for j in range(5)]


z = [(a,b) for line in arr if 1+1 if 1 for (a,b) in line]

''',

    'generator': '''

a = (num ** 2 for num in range(10))
''',

    'arr': '''
a = [i for i in range(1,21)]

a[-5]

del a[19:10:-2]
''',
    'set': '''
s = {1,2}
s2 = {3,4,5}

s2 |= s

''',
    'counter': '''

import collections
c = collections.Counter('abc')

a = None


''',
    'ordereddict': '''
from collections import OrderedDict

d = OrderedDict()

for i,c in enumerate('abcde'):
    d[i] = c
''',
    'createclass': '''
from collections import namedtuple

Point = namedtuple('Point', ['x', 'y'])

''',

    'deque': '''
from collections import deque


q = deque([1,2,3,4,5])

q.append(1)

q.count(1)
q.appendleft(100)

# q.pop()

# q.popleft()

q.clear()

q.extend([40,50])
q.extendleft([30,20,10])

q.remove(20)

q.reverse()


q.rotate(31)

while q:
    q.pop()
''',

    'viz': '''
from viz import BTree

tree = BTree.create([1,2,3])

''',
    'delete_var': '''

x = 3
y = 4
z = 5

del (x,(y,z))

''',
    'heapq': '''

import heapq

x = heapq.heapify([1,2,3,4,5])

''',
    'default': '''

from collections import deque
python = deque('PYTHON')

arr = []

for char in 'IS':
    arr.append(char)

cool = [c for c in 'COOL']
''',
    'defaultdict': '''
from collections import defaultdict
import bisect
class Solution:
    def shortestWay(_self, source, target):
        char_indices = defaultdict(list)
        for i, c in enumerate(source):
            g = char_indices[c]
            g.append(i)

        result = 0
        i = 0                                      

        for c in target:
            if c not in char_indices:              
                return -1

            j = bisect.bisect_left(char_indices[c], i) 
            if j == len(char_indices[c]):           
                result += 1
                j = 0
            i = char_indices[c][j] + 1             

        return result if i == 0 else result + 1   
source = "abc"
target = "abcbc"
Solution().shortestWay(source,target)

''',
    'custom': '''
a = [1,2]



a *= 1
'''

}


for name, code in funcs.items():
    # if name != 'custom':
    #     continue
    try:
        inp = ["", {}]
        tree = transform(code, inp)
        transpiled = unparse(tree)

        _name, imports = inp
        runner = Runner(_name, code)
        open('transpiled.py', "w+").write(transpiled)

        exec(transpiled, global_sandbox.create(_name, runner, imports))
        print(f"✔ {name}")
    except Exception as e:
        print(f"✖ {name} -> {e}")

    # inp = ["", {}]
    # tree = transform(code, inp)
    # transpiled = unparse(tree)

    # _name, imports = inp

    # open('transpiled.py', "w+").write(transpiled)
    # runner = Runner(_name, code)
    # exec(transpiled, global_sandbox.create(_name, runner, imports))

    # open('executed.json', 'w+').write(
    #     json.dumps(
    #         {
    #             'steps': runner.steps,
    #             'objects': runner.objects,
    #             'types': runner.types,
    #             'objectIndex': runner.objectIndex,
    #             'dataVersion': 1
    #         }
    #     )
    # )
    # print(f"✔ {name}")
