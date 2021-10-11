#!/bin/sh

. .release/base.sh || exit

if branch_is_master; then exit; fi

VERSION=$(node -e 'console.log(require("./package.json").version)')

git add package.json
git add Changes.md

git commit -m "Release v$VERSION"

git push --set-upstream origin "$(git branch --show-current)"

if command -v gh; then
    gh pr create
fi