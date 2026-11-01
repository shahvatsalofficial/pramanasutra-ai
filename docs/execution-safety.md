# Execution safety

The starter has no target test-runner implementation. Static scanning neither installs dependencies nor invokes package scripts. The installer only copies agent instruction files after explicit user invocation and refuses to overwrite without `--force`. Avoid sending source, reports or user information to external providers unless permission is given. Future test runners must require command-level approval, isolated execution, timeout and logs redaction. Release gate output is decision support, not permission to deploy.
