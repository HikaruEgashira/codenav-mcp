# CLI Tool

The tree-sitter-stack-graphs Command Line Interface (CLI) provides a way to work with stack graphs directly from the command line. It allows developers to index source code, query for definitions and references, and perform other stack graph operations without writing custom code.

## Installation

The CLI can be installed using Cargo:

```bash
cargo install --features cli tree-sitter-stack-graphs
```

After installation, the CLI is available as `tree-sitter-stack-graphs` in your path.

Alternatively, you can run it directly from the source repository:

```bash
cargo run --features cli -- <command>
```

## Core Commands

### Indexing Source Code

The `index` command analyzes source code and builds a stack graph database:

```bash
tree-sitter-stack-graphs index SOURCE_DIR
```

Options:
- `-f`: Force re-indexing of all files, even if they haven't changed
- `--language`: Specify the language to use (if not auto-detected)
- `--db`: Specify the database path (defaults to `.stack-graphs` in the current directory)

### Querying for Definitions

Find the definition(s) for a reference at a specific location:

```bash
tree-sitter-stack-graphs query definition SOURCE_PATH:LINE:COLUMN
```

This command:
1. Looks up the reference at the specified position
2. Finds all possible definitions it could refer to
3. Outputs the locations of those definitions

### Checking Database Status

View the status of the stack graph database:

```bash
tree-sitter-stack-graphs status SOURCE_DIR
```

This shows statistics about indexed files, the database size, and other information.

### Cleaning the Database

Empty or remove the stack graph database:

```bash
tree-sitter-stack-graphs clean
```

Options:
- `--delete`: Completely delete the database instead of just emptying it

## Language Development Commands

### Initializing a New Language Project

Create a new project for developing stack graph rules for a language:

```bash
tree-sitter-stack-graphs init PROJECT_DIR
```

This interactive command:
1. Asks for information about the language
2. Sets up a project structure with templates
3. Creates a README with instructions

### Testing Stack Graph Rules

Test stack graph rules against sample code:

```bash
tree-sitter-stack-graphs test TESTS_DIR
```

The test directory should contain:
- Source files
- Test specification files describing expected results

## Advanced Features

### Visualization

Generate visualizations of stack graphs:

```bash
tree-sitter-stack-graphs visualize SOURCE_FILE
```

Options:
- `--format`: Output format (dot, json)
- `--output`: Output file path

### Path Finding Debugging

Debug the path finding algorithm:

```bash
tree-sitter-stack-graphs debug-path SOURCE_PATH:LINE:COLUMN
```

This shows step-by-step how paths are found from a reference to its definitions.

## Configuration

The CLI can be configured using:

1. Command-line flags
2. Configuration files (`.stack-graphs.toml`)
3. Environment variables

Configuration options include:
- Database location
- Language detection rules
- Performance settings
- Debug output levels

## Workflow Integration

The CLI can be integrated into development workflows:

1. **IDE Extensions**: Use the CLI to provide name resolution in editors
2. **CI Pipelines**: Run indexing and queries as part of continuous integration
3. **Pre-commit Hooks**: Validate that references resolve to definitions
4. **Language Servers**: Power language servers with stack graph capabilities

## Example Workflow

A typical workflow using the CLI might look like:

1. Initialize a project for a language:
   ```bash
   tree-sitter-stack-graphs init my-lang-sg
   ```

2. Develop stack graph rules for the language

3. Index a codebase:
   ```bash
   tree-sitter-stack-graphs index ~/projects/my-project
   ```

4. Look up definitions:
   ```bash
   tree-sitter-stack-graphs query definition ~/projects/my-project/src/main.py:42:12
   ```