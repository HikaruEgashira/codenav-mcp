# Tree-Sitter Integration

tree-sitter-stack-graphs enables the creation of stack graphs from tree-sitter syntax trees, providing a bridge between parsed source code and name resolution capabilities.

## Tree-Sitter Overview

Tree-sitter is a parser generator tool and incremental parsing library that builds concrete syntax trees for source code. It's designed to be:

1. **Fast and Incremental**: Can parse code incrementally as it changes
2. **Language-Agnostic**: Supports many programming languages through grammar definitions
3. **Robust**: Can produce partial syntax trees even for code with errors

## Integration with Stack Graphs

The integration between tree-sitter and stack graphs works through several steps:

1. **Parsing**: Tree-sitter parses source code into a concrete syntax tree
2. **Rule Application**: Graph construction rules (written in tree-sitter's graph DSL) are applied to the syntax tree
3. **Node Creation**: Stack graph nodes are created based on matched syntax patterns
4. **Edge Creation**: Edges are added between nodes to represent relationships
5. **Attribute Assignment**: Nodes are annotated with additional information like symbols, source locations, and debug data

## Graph Construction DSL

The tree-sitter graph DSL allows defining patterns that match syntax tree nodes and specify what stack graph nodes and edges to create. For example:

```
(function_definition name: (identifier) @id) @func {
  node def
  attr (def) type = "pop_symbol", 
              symbol = (source-text @id),
              source_node = @func,
              is_definition
  
  node body
  edge def -> body
}
```

This pattern:
- Matches function definitions in the syntax tree
- Creates a "pop_symbol" node representing the definition
- Sets its symbol to the identifier's text
- Connects it to a body node

## Prerequisites for Integration

To use tree-sitter-stack-graphs with a language, you need:

1. A tree-sitter grammar for the language
2. Stack graph construction rules defined using the graph DSL
3. The tree-sitter-stack-graphs library

## Implementation Details

Internally, the integration uses:

1. **Tree-Sitter Queries**: To match patterns in the syntax tree
2. **Variable Binding**: To collect and pass information from matched syntax nodes
3. **Graph Construction**: To build the stack graph incrementally

## API and Usage

The library provides APIs for:

1. Loading and parsing stack graph construction rules
2. Building stack graphs from source code using these rules
3. Accessing and manipulating the resulting graph

Example Rust code:
```rust
let grammar = tree_sitter_python::LANGUAGE.into();
let tsg_source = STACK_GRAPH_RULES;
let mut language = StackGraphLanguage::from_str(grammar, tsg_source)?;
let mut stack_graph = StackGraph::new();
let file_handle = stack_graph.get_or_create_file("test.py");
language.build_stack_graph_into(
    &mut stack_graph, 
    file_handle, 
    python_source, 
    &globals, 
    &NoCancellation
)?;
```

## Benefits of Integration

This integration provides several advantages:

1. **Language Independence**: Write name resolution rules without language-specific analyzers
2. **Efficiency**: Leverage tree-sitter's incremental parsing with stack graphs' incremental analysis
3. **Flexibility**: Define custom name resolution semantics for any language
4. **Consistency**: Use a common framework for different languages