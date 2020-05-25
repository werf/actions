#!/bin/bash -e

for pkg in build-and-publish cleanup converge deploy install; do ncc build src/$pkg.ts -o $pkg; done
