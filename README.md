# æ‑CI Repo

This template is ready for GitHub Actions. It runs the demos, writes Witnesses, and uploads them as CI artifacts.

[![ae-ci](https://github.com/chadlieoak/ae/actions/workflows/ae-ci.yml/badge.svg)](https://github.com/<you>/<repo>/actions/workflows/ae-ci.yml)


## Use

```bash
# unpack
unzip ae-ts-repo.zip -d ae-ci
cd ae-ci

# init repo
git init
git add -A
git commit -m "init: æ-ci repo"

# create a new GitHub repo (via UI), then add remote and push:
git remote add origin https://github.com/<you>/<repo>.git
git branch -M main
git push -u origin main
```

GitHub will run **Actions → ae-ci** on each push. Download artifacts to see `.ae/witnesses.jsonl` and `ci.log`.
