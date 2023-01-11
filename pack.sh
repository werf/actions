#!/bin/bash -e

for pkg in build cleanup converge dismiss setup run; do ncc build src/$pkg.ts -o $pkg; done
