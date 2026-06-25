# MCP Server Setup (Claude Code)

This doc describes the **Model Context Protocol (MCP)** servers used with this monorepo
and how to configure them in Claude Code.

> ⚠️ **All credentials below are FAKE placeholders.** Replace them with your real values
> from a secret manager / `.env` — never commit real connection strings or API keys.

---

## What lives where

MCP servers for this repo are declared in a project-scoped file at the repo root:

```
D:\AskAide AI\.mcp.json        # checked into the repo (project scope)
```

Claude Code reads this file automatically when launched from the repo. On first load it
prompts you to **approve** each project-scoped server before it connects.

Other config scopes (precedence: local > project > user):
- **User scope:** `~/.claude.json` — personal servers, shared across all your projects.
- **Local scope:** project `.mcp.json` overrides committed via `claude mcp add --scope local`.

---

## Configured servers

### 1. `mongodb` — MongoDB MCP server

Gives Claude read/query access to the application database (collections, schema, find,
aggregate, etc.).

```json
{
  "mcpServers": {
    "mongodb": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "mongodb-mcp-server"],
      "env": {
        "MDB_MCP_CONNECTION_STRING": "mongodb+srv://FAKE_USER:FAKE_PASSWORD@cluster0.xxxxx.mongodb.net/dbname?retryWrites=true&w=majority"
      }
    }
  }
}
```

**Configure it:**
1. Get a connection string from MongoDB Atlas (or your local `mongod`).
2. Replace `FAKE_USER`, `FAKE_PASSWORD`, the cluster host, and `dbname`.
3. Prefer a **read-only** database user for safety.

### 2. `code-review-graph` — persistent code knowledge graph

Exposes a queryable knowledge graph of the codebase (symbols, references, change impact)
that Claude can use during reviews. Backed by the `code-review-graph` CLI.

```json
{
  "mcpServers": {
    "code-review-graph": {
      "type": "stdio",
      "command": "code-review-graph",
      "args": ["mcp"]
    }
  }
}
```

> The example uses the bare command (must be on `PATH`). If the binary isn't on `PATH` for
> the MCP launch environment, use its absolute path instead, e.g.
> `"/home/<user>/.local/bin/code-review-graph"` (Linux/macOS) or the full Windows path.

**Configure it:**
1. Install the CLI: `pip install code-review-graph` (or however your env provides it).
2. Verify it resolves: `code-review-graph --version`.
3. (Optional) Let the installer wire it up automatically:
   `code-review-graph install --platform claude-code`
   — this also adds the `SessionStart` / `PostToolUse` hooks in `.claude/settings.json`.
4. No credentials needed — it operates on the local repo.

---

## Full example `.mcp.json`

```json
{
  "mcpServers": {
    "mongodb": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "mongodb-mcp-server"],
      "env": {
        "MDB_MCP_CONNECTION_STRING": "mongodb+srv://FAKE_USER:FAKE_PASSWORD@cluster0.xxxxx.mongodb.net/dbname?retryWrites=true&w=majority"
      }
    },
    "code-review-graph": {
      "type": "stdio",
      "command": "code-review-graph",
      "args": ["mcp"]
    }
  }
}
```

---

## Adding a server via CLI (alternative to editing JSON)

```bash
# project scope (writes to ./.mcp.json — committed)
claude mcp add --scope project mongodb \
  --env MDB_MCP_CONNECTION_STRING="mongodb+srv://FAKE_USER:FAKE_PASSWORD@cluster0.xxxxx.mongodb.net/dbname" \
  -- npx -y mongodb-mcp-server

claude mcp add --scope project code-review-graph -- code-review-graph mcp
```

Useful management commands:

```bash
claude mcp list            # show configured servers + connection status
claude mcp get mongodb     # inspect one server
claude mcp remove mongodb  # remove a server
```

---

## Applying changes

1. Edit `.mcp.json` (or use `claude mcp add`).
2. Validate the JSON — a malformed file causes Claude Code to skip ALL servers:
   ```bash
   python3 -m json.tool .mcp.json
   ```
3. **Restart Claude Code** (or reconnect MCP servers) so the new config loads.
4. Approve any new project-scoped server when prompted.
5. Confirm with `claude mcp list` / the `/mcp` command in-session.

---

## Security notes

- **Never commit real secrets.** Keep `.mcp.json` placeholders fake; inject real values
  from a `.env` / secret manager, or use a local-scope override that is git-ignored.
- Use least-privilege DB users (read-only where possible).
- Rotate any credential that was ever committed to git history.

---

## OpenCode setup

OpenCode uses a **different config file and format** than Claude Code. The same two
servers are declared under an `mcp` key (not `mcpServers`), `command` is an **array**,
stdio servers use `"type": "local"`, and env vars go under `environment`.

### Where the config lives

| Scope | Path |
|-------|------|
| Project (committed) | `D:\AskAide AI\opencode.json` (repo root) |
| Global (personal) | `~/.config/opencode/opencode.json` |

Project config is merged over global config.

### Configured servers (fake creds)

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "mongodb": {
      "type": "local",
      "command": ["npx", "-y", "mongodb-mcp-server"],
      "enabled": true,
      "environment": {
        "MDB_MCP_CONNECTION_STRING": "mongodb+srv://FAKE_USER:FAKE_PASSWORD@cluster0.xxxxx.mongodb.net/dbname?retryWrites=true&w=majority"
      }
    },
    "code-review-graph": {
      "type": "local",
      "command": ["code-review-graph", "mcp"],
      "enabled": true
    }
  }
}
```

> As with Claude Code: if `code-review-graph` isn't on `PATH` for OpenCode's launch
> environment, use the absolute path as the first array element, e.g.
> `["/home/<user>/.local/bin/code-review-graph", "mcp"]`.

### Remote (HTTP/SSE) servers

If you instead run a server over HTTP (e.g. `code-review-graph serve --http`), use
`"type": "remote"`:

```json
{
  "mcp": {
    "code-review-graph": {
      "type": "remote",
      "url": "http://localhost:8000/mcp",
      "enabled": true,
      "headers": { "Authorization": "Bearer FAKE_TOKEN" }
    }
  }
}
```

### Configure it

1. Create/edit `opencode.json` at the repo root (or `~/.config/opencode/opencode.json`).
2. Add the `$schema` line for editor autocompletion + validation.
3. Replace the fake MongoDB connection string with your real value.
4. Set `"enabled": false` to temporarily disable a server without deleting it.
5. Validate the JSON, then restart OpenCode so it reconnects the servers.

### Format differences vs Claude Code (`.mcp.json`)

| Aspect | Claude Code | OpenCode |
|--------|-------------|----------|
| File | `.mcp.json` | `opencode.json` |
| Top-level key | `mcpServers` | `mcp` |
| stdio type | `"type": "stdio"` | `"type": "local"` |
| HTTP type | `"type": "http"` | `"type": "remote"` |
| Command | `command` + `args` (separate) | `command` (single array) |
| Env vars | `env` | `environment` |
| Enable toggle | — | `enabled` |
