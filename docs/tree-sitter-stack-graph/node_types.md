# Node Types

Stack graphs consist of several specialized node types, each serving a specific purpose in the name resolution process. Understanding these node types is essential for effectively modeling the name binding semantics of programming languages.

## Core Node Types

### Scope Node

**Purpose**: Represents a lexical scope in the source language.

**Characteristics**:
- Default node type (if no explicit type is specified)
- Can be marked as "exported" to be referenced by push scoped symbol nodes
- Typically corresponds to blocks, functions, modules, or other scope-defining constructs

**Example Use**:
```
node module_scope
attr (module_scope) is_exported
```

### Push Symbol Node

**Purpose**: Pushes a symbol onto the symbol stack.

**Characteristics**:
- Requires a `symbol` attribute containing the name being referenced
- Can be marked as a reference with `is_reference`
- Often used for the referencing side of name binding

**Example Use**:
```
node var_ref
attr (var_ref) 
  type = "push_symbol",
  symbol = "my_variable",
  is_reference,
  source_node = @var_ref_syntax
```

### Pop Symbol Node

**Purpose**: Pops a symbol from the symbol stack, typically representing a definition.

**Characteristics**:
- Requires a `symbol` attribute containing the name being defined
- Can be marked as a definition with `is_definition`
- Often used for the definition side of name binding

**Example Use**:
```
node var_def
attr (var_def) 
  type = "pop_symbol",
  symbol = "my_variable",
  is_definition,
  source_node = @var_def_syntax
```

### Push Scoped Symbol Node

**Purpose**: Pushes both a symbol and a scope onto their respective stacks.

**Characteristics**:
- Requires both `symbol` and `scope` attributes
- The `scope` must reference an exported scope node
- Used for qualified names or member access

**Example Use**:
```
node member_access
attr (member_access) 
  type = "push_scoped_symbol",
  symbol = "method_name",
  scope = class_scope
```

### Pop Scoped Symbol Node

**Purpose**: Pops both a symbol and a scope from their respective stacks.

**Characteristics**:
- Requires a `symbol` attribute
- Used for definitions that exist within a particular scope
- Often used for class members or namespace members

**Example Use**:
```
node method_def
attr (method_def) 
  type = "pop_scoped_symbol",
  symbol = "method_name",
  is_definition,
  source_node = @method_def_syntax
```

### Drop Scopes Node

**Purpose**: Clears the scope stack.

**Characteristics**:
- No required attributes
- Used to reset scope context during path finding
- Helps handle certain name resolution scenarios like escaping from inner scopes

**Example Use**:
```
node reset_scopes
attr (reset_scopes) type = "drop_scopes"
```

## Singleton Nodes

### Root Node

**Purpose**: Special node that serves as the entry point for path finding.

**Characteristics**:
- Available as the global variable `ROOT_NODE` in the Graph DSL
- Connected to nodes that should be globally accessible
- Single instance per stack graph

### Jump-to-Scope Node

**Purpose**: Special node that facilitates non-local scope transitions.

**Characteristics**:
- Available as the global variable `JUMP_TO_SCOPE_NODE` in the Graph DSL
- Used for implementing imports, inheritance, and other non-local references
- Single instance per stack graph

## Node Attributes

Nodes can have various attributes that specify their behavior and metadata:

### Common Attributes
- `type`: Specifies the node type
- `is_exported`: Whether the node can be referenced by push scoped symbol nodes
- `source_node`: The source syntax node this graph node corresponds to
- `symbol`: The symbol name for push/pop nodes
- `scope`: Reference to a scope node (for push/pop scoped symbol nodes)
- `is_definition`/`is_reference`: Marks nodes as proper definitions or references
- `syntax_type`: Additional type information for the node
- `definiens_node`: For definition nodes, points to what is being defined
- `empty_source_span`: Uses an empty span at the start of the source node

### Debug Attributes
- Any attribute starting with `debug_` adds debug information
- Example: `debug_kind = "function_scope"`

## Node Connectivity

Nodes are connected by edges that determine how path finding traverses the graph:

- Regular edges connect nodes in the graph
- Edges can have a `precedence` attribute to influence path prioritization
- Higher precedence edges are preferred during path finding (default is 0)

## Usage Patterns

Different node types are combined to model various language constructs:

1. **Variable definition**: Pop symbol node with is_definition
2. **Variable reference**: Push symbol node with is_reference
3. **Scope creation**: Scope node, often with is_exported
4. **Member access**: Push symbol followed by push scoped symbol
5. **Method definition**: Pop scoped symbol with is_definition