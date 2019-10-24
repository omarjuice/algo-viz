import importlib
# # print(dir())

# '''

# BAN ----
# compile
# dir
# eval
# exec
# input
# open
# quit
# exit
# copyright
# credits
# license
# help

# Override----
# print


# '''

# for key in __builtins__.__dict__:
#     print(key)


bisect = importlib.import_module('bisect')

print(dir(bisect))
