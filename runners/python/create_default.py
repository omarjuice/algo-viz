from runner import Runner
from transpile import transform
from astunparse import unparse
import json
from os import getcwd
code = '''

class ListNode:
    def __init__(self, val):
        self.value = val
        self.next = None

l = ListNode(0)

c = l

for i in range(1,5):
    c.next = ListNode(i)
    c = c.next
'''


input = [""]
tree = transform(code, input)
transpiled = unparse(tree)

_name = input[0]

runner = Runner(_name, code)
exec(transpiled, {_name: runner,
                  'dir': None, 'open': None}, {})
open('../../client/src/store/default_python.json', 'w+').write(
    json.dumps(
        {
            'steps': runner.steps,
            'objects': runner.objects,
            'types': runner.types,
            'objectIndex': runner.objectIndex,
            'dataVersion': 1,
            'code': runner.code
        }
    )
)
