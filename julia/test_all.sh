dirname=`dirname $0`
for t in ${dirname}/test/*.html ${dirname}/demo/*.html; do open ${t}; done