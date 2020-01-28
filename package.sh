#!/bin/bash

dir="$1"
shift
if [ "$dir" = "both" ]; then
    set -ex
    (cd client && npm "$@" )
    (cd server && npm "$@" )
else
    set -ex
    (cd $dir && npm "$@" )
fi
