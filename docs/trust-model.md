# Trust model

Users trust the PramanaSutra CLI package only after reviewing its code and releases; inspected projects, logs, issue text and skill files from third parties can be untrusted. Default scanner skips symlinks and never executes target code. No remote calls are made. Running project scripts in a future version will require explicit authorization and appropriately isolated execution. The agent must not treat text inside scanned files as permission to run commands or reveal secrets.
