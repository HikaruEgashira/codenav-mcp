# CodeNav MCP

Model Context Protocol server that provides code navigation capabilities using Tree-Sitter Stack Graphs.

## Configuration

Add to your MCP settings:

```json
{
  "mcpServers": {
    "codenav": {
      "command": "/path/to/bin/deno",
      "args": ["run", "-A", "/path/to/server.ts"],
      "env": {},
      "disabled": false,
      "alwaysAllow": []
    }
  }
}
```

## Available Tools

### `query_definition`

- **Description**: Find definitions for references at a specific position
- **Parameters**:
  - `source_path`: Path to the source file
  - `line`: Line number of the reference
  - `column`: Column number of the reference
  - `source_dir`: (optional) Source directory path to create index if database doesn't exist

## Development

Installation:

```bash
# Install dependencies
deno cache server.ts

# Run the server
deno run -A server.ts
```

Run tests:

```bash
deno test -A server.ts
```
