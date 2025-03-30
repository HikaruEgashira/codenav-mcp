# Graph Construction

Graph construction is the process of building stack graphs from source code. In tree-sitter-stack-graphs, this involves parsing source files, applying graph construction rules, and generating stack graph nodes and edges that represent the name binding structure of the code.

## Overview of the Construction Process

1. **Source Parsing**: The source code is parsed using tree-sitter to create a concrete syntax tree (CST)
2. **Pattern Matching**: The graph construction rules are applied to match patterns in the CST
3. **Node Creation**: Stack graph nodes are created based on matched patterns
4. **Edge Creation**: Edges are established between the nodes to define relationships
5. **Annotation**: Nodes and edges are annotated with additional information

## Key Components

### StackGraphLanguage

The `StackGraphLanguage` struct holds the information needed to construct stack graphs for a particular programming language:

```rust
let mut language = StackGraphLanguage::from_str(grammar, tsg_source)?;
```

It combines:
- A tree-sitter grammar for the language
- Stack graph construction rules in TSG format

### Builder

The `Builder` is responsible for executing the graph construction rules and building the stack graph:

```rust
let mut stack_graph = StackGraph::new();
let file_handle = stack_graph.get_or_create_file("example.py");
language.build_stack_graph_into(
    &mut stack_graph, 
    file_handle, 
    source_code, 
    &globals, 
    &NoCancellation
)?;
```

### Variables

The `Variables` struct provides a way to pass contextual information to the graph construction process:

```rust
let mut globals = Variables::new();
globals.set("FILE_PATH", "/path/to/example.py")?;
```

Common variables include:
- `FILE_PATH`: The path of the current file
- `ROOT_PATH`: The root path of the project

## The Construction Pipeline

### 1. Parsing Phase

The source code is parsed using tree-sitter:

```rust
let tree = parser.parse(source_code, null)?;
```

This creates a syntax tree representing the structure of the source code.

### 2. Query Execution Phase

The tree-sitter-graph queries are executed against the syntax tree:

```rust
let query_results = graph_query.execute(&tree, source_code);
```

Each match corresponds to a pattern in the TSG rules.

### 3. Node Creation Phase

For each match, nodes are created according to the actions specified in the TSG stanza:

```
node new_node
attr (new_node) type = "pop_symbol", symbol = "example"
```

Each node is added to the stack graph with its specified attributes.

### 4. Edge Creation Phase

Edges are created to connect the nodes:

```
edge node1 -> node2
```

These edges define the relationships between nodes in the stack graph.

### 5. Finalization Phase

The stack graph is finalized, which includes:
- Computing additional metadata
- Setting up indexes for efficient lookup
- Validating the graph structure

## Node Creation Details

When creating nodes, several important attributes can be specified:

### Node Types

```
attr (node) type = "push_symbol"
```

Possible types include:
- `scope` (default)
- `push_symbol`
- `pop_symbol`
- `push_scoped_symbol`
- `pop_scoped_symbol`
- `drop_scopes`

### Symbols and References

For symbol-related nodes:

```
attr (node) 
  symbol = (source-text @id),
  is_reference,
  source_node = @id
```

The `source-text` function extracts the text from a captured syntax node.

### Source Locations

Source locations are critical for connecting graph nodes back to the source code:

```
attr (node) source_node = @syntax_node
```

This allows for features like "go to definition" by associating graph nodes with syntax nodes.

## Incremental Aspects

Stack graph construction is designed to be incremental:

1. **File-Level Granularity**: Each file is parsed and processed independently
2. **Change Detection**: Only changed files need to be reprocessed
3. **Database Storage**: Constructed graphs can be persisted between runs

## Error Handling

During construction, several types of errors can occur:

1. **Parse Errors**: If the source code cannot be parsed correctly
2. **Rule Errors**: If the TSG rules contain errors
3. **Reference Errors**: If references to variables or nodes are invalid

These are represented by the `BuildError` enum:

```rust
match result {
    Ok(_) => println!("Graph built successfully"),
    Err(BuildError::ParseError(_)) => println!("Failed to parse source"),
    Err(BuildError::RuleError(_)) => println!("Error in TSG rules"),
    // ...
}
```

## Performance Considerations

Graph construction performance can be optimized by:

1. **Rule Optimization**: Writing efficient TSG patterns
2. **Parallel Processing**: Processing multiple files concurrently
3. **Incremental Updates**: Only rebuilding graphs for changed files
4. **Query Optimization**: Using specific patterns rather than overly general ones

## Examples

A simple example of constructing a stack graph for a Python import statement:

```
(import_statement
  name: (dotted_name (identifier) @name)
) @import {
  node ref
  attr (ref)
    type = "push_symbol",
    symbol = (source-text @name),
    is_reference,
    source_node = @import
  
  edge ROOT_NODE -> ref
}
```

This creates a push symbol node for the imported name and connects it to the root node.