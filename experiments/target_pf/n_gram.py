#!/usr/bin/env python
''' Extracts 1-grams from ../data/sherlock_holmes.txt
'''
import re
from collections import Counter


def test_n_gram(to_test):
    '''Make sure all values in each n-gram sums to 1'''
    for k,v in to_test.items():
        if abs(sum(v.values()) - 1) > 0.001:
            raise Exception("Values for key %s do not sum to 1!" % k)

def pretty_print_dict(result, name, level, suffix=""):
    print "%s : {" % name
    for k,v in result.items():
        if type(v) is dict:
            pretty_print_dict(v, k, level + 1, ",")
        else:
            print "%s%s: %.4f," % ('\t' * level, k, v)
    print "}%s"%suffix

# pull out all words
words = re.findall(r'[a-z]+', open('../data/sherlock_holmes.txt').read().lower())
n = 1
# keep only words that are long enough
words = [x for x in words if len(x) > n]
letter_counts = {}

# TODO: initialize with every possible prefix
alphabet = [chr(ord('a') + i) for i in range(26)]
for w in words:
    prefix = w[:-n]
    suffix = w[n:]
    for p,s in zip(prefix, suffix):
        if p not in letter_counts:
            letter_counts[p] = Counter(alphabet)
        letter_counts[p][s] += 1
result = {}
for k,v in letter_counts.items():
    s = sum(v.values())
    result[k] = {l:float(c)/s for l,c in v.items()}

pretty_print_dict(result, "result", 0)

test_n_gram(result)