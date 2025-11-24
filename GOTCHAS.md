# Gotchas and Common Issues

This document covers common pitfalls and issues you might encounter when working with the Babylon MCP server.

## Alpine Linux / musl libc Compatibility

### Issue: `ld-linux-x86-64.so.2` Error on Alpine

**Symptom:**
```
Error: Error loading shared library ld-linux-x86-64.so.2: No such file or directory
(needed by /root/babylon-mcp/node_modules/onnxruntime-node/bin/napi-v3/linux/x64//libonnxruntime.so.1.14.0)
```

**Cause:**
Alpine Linux uses musl libc instead of glibc. The `onnxruntime-node` package requires glibc and won't work on Alpine without patching.

**Solution:**
Always run the Alpine setup script **after** `npm install` and **before** `npm run build`:

```bash
npm install           # Install dependencies
npm run alpine:setup  # Patch transformers to use WASM backend
npm run build         # Build TypeScript
```

**Why This Works:**
The Alpine setup script patches `@xenova/transformers` to use the WASM backend (`onnxruntime-web`) instead of the native Node.js backend (`onnxruntime-node`), eliminating the glibc dependency.

**Important:**
- Run `npm run alpine:setup` every time you run `npm install` (it reinstalls unpatched packages)
- The WASM backend is slightly slower but fully compatible with Alpine
- This applies to production deployments on Alpine-based Docker containers or Alpine servers

---

## New Relic Integration

### Issue: "New Relic requires that you name this application!"

**Symptom:**
```
Error: New Relic requires that you name this application!
Set app_name in your newrelic.js or newrelic.cjs file or set environment variable
NEW_RELIC_APP_NAME. Not starting!
```

**Cause:**
Environment variables from `.env` file are not being loaded before New Relic initializes.

**Solution:**
Use the `--env-file` flag when running the application:

```bash
# Development (already configured)
npm run dev  # Uses: tsx watch --env-file=.env src/mcp/index.ts

# Production
node --env-file=.env dist/mcp/index.js
```

**For Alpine Services:**
When running as a system service, ensure environment variables are sourced in the init script:

```bash
#!/sbin/openrc-run

# Source environment file before starting
[ -f /etc/babylon-mcp.env ] && . /etc/babylon-mcp.env

command="/usr/bin/node"
command_args="--env-file=/etc/babylon-mcp.env /path/to/babylon-mcp/dist/mcp/index.js"
```

**Required Environment Variables:**
```bash
NEW_RELIC_LICENSE_KEY=your_license_key_here
NEW_RELIC_APP_NAME=babylon-mcp
```

---

## Claude Code CLI Integration

### Issue: Config File Approach Doesn't Work

**Symptom:**
Adding MCP server configuration to `~/.claude/config.json` doesn't make the server available in Claude Code.

**Cause:**
HTTP MCP server configuration in config files may not be fully supported or requires specific formatting that hasn't been determined yet.

**Solution:**
Use the CLI command approach instead:

```bash
# In Claude Code, connect directly with the URL
/mcp http://localhost:4000/mcp
```

**Important:**
- The MCP server must be running before connecting
- Use `npm run dev` or `npm start` to start the server first
- This is a known limitation being researched (see ROADMAP.md)

---

## ES Modules Configuration

### Issue: Cannot Use `require()` with ES Modules

**Cause:**
The project uses ES modules (`"type": "module"` in package.json).

**Solution:**
- Use `import` instead of `require()`:
  ```javascript
  // ✗ Wrong
  const newrelic = require('newrelic');

  // ✓ Correct
  import 'newrelic';
  ```

- For New Relic, the import must be the **first line** in `src/mcp/index.ts`:
  ```typescript
  import 'newrelic';  // Must be first!
  import { BabylonMCPServer } from './server.js';
  ```

- Always include `.js` extensions in imports:
  ```typescript
  // ✗ Wrong
  import { BabylonMCPServer } from './server';

  // ✓ Correct
  import { BabylonMCPServer } from './server.js';
  ```

---

## Build and Deployment

### Issue: TypeScript Compilation Errors After Dependency Updates

**Solution:**
Run type checking before building:

```bash
npm run typecheck  # Check for type errors
npm run build      # Build if no errors
```

### Issue: Service Fails to Start After Code Changes

**Checklist:**
1. Did you rebuild after code changes?
   ```bash
   npm run build
   ```

2. On Alpine, did you run the Alpine setup script?
   ```bash
   npm run alpine:setup
   npm run build
   ```

3. Are environment variables properly set?
   ```bash
   # Check if .env file exists
   cat .env

   # For services, check /etc/babylon-mcp.env
   cat /etc/babylon-mcp.env
   ```

4. Restart the service:
   ```bash
   rc-service babylon-mcp restart
   ```

---

## Data and Indexing

### Issue: Search Returns No Results

**Possible Causes:**
1. Indexing hasn't been run
2. Vector database is missing or corrupted
3. Repositories haven't been cloned

**Solution:**
```bash
# Clone repositories
npm run clone:repos

# Run full indexing
npm run index:all

# Or index components separately
npm run index:docs
npm run index:api
npm run index:source
```

**Verify:**
```bash
# Check if data directory exists and has content
ls -lh data/lancedb/
ls -lh data/repositories/
```

---

## Performance

### Issue: First Search is Slow

**Expected Behavior:**
The first search after server start can take several seconds because:
1. Vector embeddings model needs to be loaded into memory
2. LanceDB tables need to be initialized
3. Transformers.js initializes WASM runtime

**Solution:**
This is normal. Subsequent searches will be much faster (typically <500ms).

### Issue: High Memory Usage

**Cause:**
The embedding model and vector database are loaded into memory.

**Expected Memory Usage:**
- Baseline: ~200-300MB
- With model loaded: ~500-800MB
- During indexing: ~1-2GB

**Solution:**
Ensure your server has at least 2GB RAM available, especially during indexing operations.

---

## Development

### Issue: Tests Fail After Changes

**Common Causes:**
1. Mock implementations need updating
2. Test coverage requirements not met
3. TypeScript errors

**Solution:**
```bash
# Run tests to see failures
npm test

# Run with coverage to see what's missing
npm run test:coverage

# Run type checking
npm run typecheck
```

---

## Security

### Issue: Committing Secrets to Git

**Prevention:**
- Never commit `.env` files
- Use `.env.example` for documentation
- The `.gitignore` already excludes `.env`

**If You Accidentally Commit Secrets:**
1. Rotate/regenerate the secrets immediately (e.g., New Relic license key)
2. Remove from git history using `git filter-branch` or BFG Repo-Cleaner
3. Force push (if safe to do so)

---

## Port Conflicts

### Issue: Port 4000 Already in Use

**Symptom:**
```
Error: listen EADDRINUSE: address already in use :::4000
```

**Solution:**
```bash
# Find process using port 4000
lsof -i :4000

# Kill the process or use a different port
# To use different port, modify server.start() call in src/mcp/index.ts
```

---

## Quick Reference: Correct Build Order

### Local Development (macOS/Linux with glibc)
```bash
npm install
npm run build
npm run dev
```

### Alpine Linux Production
```bash
npm install
npm run alpine:setup  # Critical step!
npm run build
npm start
```

### After Pulling New Code
```bash
npm install           # Update dependencies
npm run alpine:setup  # If on Alpine
npm run build         # Rebuild TypeScript
# Restart service or dev server
```

---

## Getting Help

If you encounter issues not covered here:

1. Check the [README.md](README.md) for setup instructions
2. Review the [ROADMAP.md](ROADMAP.md) for known limitations
3. Check server logs for error messages
4. Run diagnostic commands:
   ```bash
   npm run typecheck
   npm test
   node --version  # Should be >= 18
   ```

5. For Alpine-specific issues, verify you're using the WASM backend:
   ```bash
   grep "PATCHED FOR ALPINE" node_modules/@xenova/transformers/src/backends/onnx.js
   ```
