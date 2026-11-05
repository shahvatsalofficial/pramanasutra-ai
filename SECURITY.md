# Security Policy

If you discover a vulnerability, do not open a public exploit-bearing issue. Report it through GitHub's private vulnerability reporting on this repository. Do not include real tokens, private data, or customer environments.

The CLI is a local, read-only scanner with no runtime dependencies and no network calls in the scan path. It has not had an independent security review. It does not execute the target project's tests. Reports are decision support, not a security assessment. See `documents/pramanasutra/09-security-and-privacy.md`.
