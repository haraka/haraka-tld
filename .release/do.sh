#!/bin/sh

usage() {
    echo "do.sh {major | minor | patch}"
    exit
}

. .release/base.sh || exit

if branch_is_master; then exit; fi

case "$1" in
    "major" )
    ;;
    "minor" )
    ;;
    "patch" )
    ;;
    *)
    usage
    ;;
esac

NEW_VERSION=$(npm --no-git-tag-version version "$1")

YMD=$(date "+%Y-%m-%d")
# echo "Preparing $NEW_VERSION - $YMD"

update_changes() {
    tee .release/new.txt <<EO_CHANGE


#### ${NEW_VERSION//v} - $YMD

-
-
EO_CHANGE

    sed -i '' -e "/#### 1.N.N.*$/r .release/new.txt" Changes.md
    rm .release/new.txt
}

update_changes

if command -v open; then open Changes.md; fi