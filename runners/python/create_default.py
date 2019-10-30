from runner import Runner
from transpile import transform
from astunparse import unparse
import global_sandbox
import json
from os import getcwd
from time import time
code = '''

from collections import deque
python = deque('PYTHON')

arr = []

for char in 'IS':
    arr.append(char)

cool = [c for c in 'COOL']
'''

inp = ["", {}]
tree = transform(code, inp)
transpiled = unparse(tree)

_name, imports = inp

runner = Runner(_name, code)
start = time()
exec(transpiled, global_sandbox.create(_name, runner, imports))
runtime = int((time() - start) * 1000)
open('client/src/store/default_python.json', 'w+').write(
    json.dumps(
        {
            'steps': runner.steps,
            'objects': runner.objects,
            'types': runner.types,
            'objectIndex': runner.objectIndex,
            'dataVersion': 1,
            'code': runner.code,
            'runtime': runtime
        }
    )
)
