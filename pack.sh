#!/bin/bash -e

for pkg in build build-and-publish cleanup converge deploy dismiss install publish run; do ncc build src/$pkg.ts -o $pkg; done
