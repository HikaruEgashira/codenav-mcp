# Graph DSL

The Graph DSL (Domain Specific Language) in tree-sitter-stack-graphs is a specialized language for defining how stack graphs should be constructed from tree-sitter parse trees. It provides a declarative way to specify pattern matching on syntax trees and the corresponding stack graph nodes and edges to create.

## Basic Structure

The Graph DSL uses "stanzas" that contain patterns and actions:

```
(pattern) @capture {
  // Actions to perform when pattern matches
}
```

Each stanza consists of:
1. A pattern that matches parts of the syntax tree
2. Optional named captures that bind parts of the matched subtree to variables
3. A block of actions to perform when the pattern matches

## Pattern Matching

Patterns in the Graph DSL match tree-sitter syntax nodes by their structure. For example:

```
(function_definition 
  name: (identifier) @id
  body: (_) @body
) @func
```

This pattern:
- Matches a `function_definition` node
- Captures its `name` field (which must be an `identifier`) as `@id`
- Captures its `body` field (which can be any node) as `@body`
- Captures the entire function definition as `@func`

## Node Creation

The primary action in the Graph DSL is creating stack graph nodes:

```
node new_node
```

This creates a new stack graph node and assigns it to the variable `new_node` for further reference in the stanza.

## Attribute Assignment

Attributes can be assigned to nodes to specify their properties:

```
attr (node_var) 
  type = "pop_symbol",
  symbol = (source-text @id),
  source_node = @func,
  is_definition
```

Common attributes include:
- `type`: The type of stack graph node (`scope`, `push_symbol`, `pop_symbol`, etc.)
- `symbol`: The symbol associated with the node
- `source_node`: The syntax node this graph node is associated with
- `is_definition` / `is_reference`: Whether the node represents a definition or reference
- `syntax_type`: Information about the syntax type
- `definiens_node`: The node representing what a definition covers

## Edge Creation

Edges between nodes are created using the `edge` statement:

```
edge node1 -> node2
```

Edges can also have attributes:

```
edge node1 -> node2
attr (node1 -> node2) precedence = 1
```

## Functions and Variables

The Graph DSL includes functions for manipulating values:

- `source-text`: Extract text from a syntax node
- Path manipulation functions: `path-dir`, `path-filename`, `path-join`, etc.

Global variables provide context:
- `FILE_PATH`: Path of the current file
- `ROOT_NODE`: The root node of the stack graph
- `JUMP_TO_SCOPE_NODE`: The jump-to-scope singleton node

## Example

A complete example of a Graph DSL stanza for a function definition:

```
global ROOT_NODE

(function_definition
  name: (identifier) @id
  body: (_) @body
) @func {
  // Create definition node
  node def
  attr (def) 
    type = "pop_symbol",
    symbol = (source-text @id),
    source_node = @func,
    is_definition,
    definiens_node = @body,
    syntax_type = "function"
  
  // Create body scope node
  node body_scope
  
  // Connect nodes
  edge ROOT_NODE -> def
  edge def -> body_scope
}
```

## Debugging Support

The DSL supports attaching debug information to nodes:

```
attr (node) debug_kind = "function_scope"
```

These attributes don't affect the semantics but help with debugging and visualization.

## Key Features

1. **Declarative**: Define patterns and transformations rather than procedural code
2. **Pattern-based**: Match on syntax structure rather than traversing manually
3. **Context-aware**: Access to file paths and global nodes
4. **Flexible**: Can express complex transformations from syntax to stack graphs