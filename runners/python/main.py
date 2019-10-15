import os
from time import time
from runner import Runner
from transpile import transform
from astunparse import unparse
import json
ENV = os.getenv('ENV')
FILENAME = os.getenv('FILENAME')
VOL = os.getenv('VOLUME')
DATA_VERSION = os.getenv('DATA_VERSION')


def execute():
    code = open(f'{VOL}/{FILENAME}', 'r').read()

    input = [""]
    tree = transform(code, input)
    transpiled = unparse(tree)

    _name = input[0]

    # open('transpiled.py', "w+").write(transpiled)

    runner = Runner(_name, code)
    start = time()

    try:
        exec(transpiled, {_name: runner,
                          'dir': None, 'open': None}, {})
    except Exception as e:
        runner.steps.append({
            'type': 'ERROR',
            'error': str(e)
        })
    runtime = int((time() - start) / 1000)
    return json.dumps(
        {
            'steps': runner.steps,
            'objects': runner.objects,
            'types': runner.types,
            'objectIndex': runner.objectIndex,
            'version': 1,
            'runtime': runtime,
            'code': code
        }
    )


try:
    data = execute()
    open(f'{VOL}/{FILENAME}', 'w+').write(data)
except Exception as e:
    open(f'{VOL}/{FILENAME}', 'w+').write(str(e))
