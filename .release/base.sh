#!/bin/sh

branch_is_master()
{
    if [ "$(git branch --show-current)" = "master" ]; then
        echo "ERROR: run the release scripts in a feature branch! (not master)"
        return 0
    fi

    return 1
}

repo_is_clean()
{
    if [ -z "$(git status --porcelain)" ]; then
        return 0
    fi

    return 1
}

assure_repo_is_clean()
{
    if repo_is_clean; then return 0; fi

    echo
    echo "ERROR: Uncommitted changes, cowardly refusing to continue..."
    echo
    sleep 2

    git status

    return 1
}
