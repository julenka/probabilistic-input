#!/usr/bin/env python

from collections import Counter

c = Counter("".join(open("/usr/share/dict/words")).replace("\n", ""))
s = sum(c.values())
norm = [(v, float(x) / s) for (v, x) in c.most_common(26)]

print "{"
print ",\n".join(["{}:{}".format(k,v) for (k,v) in norm])
print "}"
