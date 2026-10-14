# requests

One folder per teacher request: `requests/<iid>/{spec.json,request.lock.json,layout.json}`, where `<iid>` is the
GitLab issue IID. Written by the Duo intake agent and edited (layout only) by the fixer agent. See
[docs/contracts.md](../docs/contracts.md) §1. Humans and Claude Code don't edit these during recorded or judged runs.
