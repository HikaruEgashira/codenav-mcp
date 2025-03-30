# Python Example

This document provides a practical example of using tree-sitter-stack-graphs to create name resolution rules for Python. Python is a good example language because it has a variety of interesting name binding features including modules, classes, nested functions, and imports.

## Basic Setup

First, let's set up a Python stack graph language:

```rust
use tree_sitter_stack_graphs::StackGraphLanguage;

// Load the Python grammar
let python_grammar = tree_sitter_python::language().into();

// Load stack graph construction rules
let tsg_rules = include_str!("python.tsg");
let python_language = StackGraphLanguage::from_str(python_grammar, tsg_rules)?;
```

## Stack Graph Construction Rules

Here are examples of stack graph construction rules for Python using the tree-sitter Graph DSL:

### 1. Module Definition

Python modules are implicitly defined and made available to the import system:

```
global FILE_PATH
global ROOT_NODE

(module) @mod {
  // Get module name from file path
  let file_stem = (path-filestem FILE_PATH)
  let dir = (path-dir FILE_PATH)
  let mod_name = (path-join dir file_stem)
  
  // Create module definition node
  node mod_def
  attr (mod_def)
    type = "pop_symbol",
    symbol = mod_name,
    is_definition,
    source_node = @mod,
    empty_source_span,
    syntax_type = "module"
  
  // Create module scope
  node mod_scope
  attr (mod_scope) is_exported
  
  // Connect nodes
  edge ROOT_NODE -> mod_def
  edge mod_def -> mod_scope
}
```

### 2. Function Definition

Handle function definitions and create appropriate scopes:

```
(function_definition
  name: (identifier) @name
  body: (block) @body
) @func {
  // Function definition node
  node func_def
  attr (func_def)
    type = "pop_symbol",
    symbol = (source-text @name),
    is_definition,
    source_node = @func,
    syntax_type = "function",
    definiens_node = @body
  
  // Function scope
  node func_scope
  attr (func_scope) is_exported
  
  // Connect to parent scope (will be module scope or another function)
  edge enclosing_scope -> func_def
  edge func_def -> func_scope
  
  // Store function scope for nested definitions
  let prev_scope = enclosing_scope
  let enclosing_scope = func_scope
}
```

### 3. Variable Assignment

Create definitions for variables when they're assigned:

```
(assignment 
  left: (identifier) @var
) @assign {
  // Variable definition
  node var_def
  attr (var_def)
    type = "pop_symbol",
    symbol = (source-text @var),
    is_definition,
    source_node = @var,
    syntax_type = "variable"
  
  // Connect to enclosing scope
  edge enclosing_scope -> var_def
}
```

### 4. Variable Reference

Create references when variables are used:

```
(identifier) @id {
  // Skip if this identifier is in a defining position
  if (not (has-parent @id assignment left: (_)))
  if (not (has-parent @id function_definition name: (_)))
  if (not (has-parent @id class_definition name: (_))) {
    // Create reference node
    node var_ref
    attr (var_ref)
      type = "push_symbol",
      symbol = (source-text @id),
      is_reference,
      source_node = @id
    
    // Connect to enclosing scope
    edge var_ref -> enclosing_scope
  }
}
```

### 5. Class Definition

Handle class definitions with their special scope rules:

```
(class_definition
  name: (identifier) @name
  body: (block) @body
) @class {
  // Class definition node
  node class_def
  attr (class_def)
    type = "pop_symbol",
    symbol = (source-text @name),
    is_definition,
    source_node = @class,
    syntax_type = "class",
    definiens_node = @body
  
  // Class scope
  node class_scope
  attr (class_scope) is_exported
  
  // Connect to parent scope
  edge enclosing_scope -> class_def
  edge class_def -> class_scope
  
  // Store class scope for method definitions
  let prev_scope = enclosing_scope
  let enclosing_scope = class_scope
}
```

### 6. Import Statements

Handle Python imports, which make external definitions available:

```
(import_statement
  name: (dotted_name (identifier) @mod_name)
) @import {
  // Reference to imported module
  node mod_ref
  attr (mod_ref)
    type = "push_symbol",
    symbol = (source-text @mod_name),
    is_reference,
    source_node = @mod_name
  
  // Connect to root and jump node
  edge mod_ref -> ROOT_NODE
  edge mod_ref -> JUMP_TO_SCOPE_NODE
}
```

### 7. Attribute Access (Object.Property)

Handle attribute access using push scoped symbols:

```
(attribute
  object: (_) @obj
  attribute: (identifier) @attr
) @attr_access {
  // Create node for the object
  node obj_ref
  attr (obj_ref)
    type = "reference",
    source_node = @obj
  
  // Create node for the attribute
  node attr_ref
  attr (attr_ref)
    type = "push_scoped_symbol",
    symbol = (source-text @attr),
    is_reference,
    source_node = @attr_access
  
  // Connect them
  edge attr_ref -> obj_ref
}
```

## Full Example

Here's a more complete set of Python stack graph rules that handle basic Python constructs:

```
global ROOT_NODE
global JUMP_TO_SCOPE_NODE
global FILE_PATH

// Initialize context
let enclosing_scope = "#null"

// Module definition
(module) @mod {
  let file_stem = (path-filestem FILE_PATH)
  let mod_name = file_stem
  
  // Module definition and scope
  node mod_def
  attr (mod_def)
    type = "pop_symbol",
    symbol = mod_name,
    is_definition,
    source_node = @mod,
    empty_source_span
  
  node mod_scope
  attr (mod_scope) is_exported
  
  edge ROOT_NODE -> mod_def
  edge mod_def -> mod_scope
  
  // Set enclosing scope for subsequent definitions
  let enclosing_scope = mod_scope
}

// Function definitions
(function_definition
  name: (identifier) @name
  body: (block) @body
) @func {
  node func_def
  attr (func_def)
    type = "pop_symbol",
    symbol = (source-text @name),
    is_definition,
    source_node = @func
  
  node func_scope
  attr (func_scope) is_exported
  
  edge enclosing_scope -> func_def
  edge func_def -> func_scope
  
  // Save previous scope and set new enclosing scope
  let prev_scope = enclosing_scope
  let enclosing_scope = func_scope
  
  // Process function body with new scope
  // ...
  
  // Restore previous scope after processing body
  let enclosing_scope = prev_scope
}

// Variable references
(identifier) @id {
  if (not (is-defining-occurrence @id)) {
    node var_ref
    attr (var_ref)
      type = "push_symbol",
      symbol = (source-text @id),
      is_reference,
      source_node = @id
    
    edge var_ref -> enclosing_scope
  }
}

// ... additional rules for classes, imports, etc.
```

## Using the Example

With these rules defined, you can process Python files and perform name resolution:

```rust
use stack_graphs::graph::StackGraph;
use tree_sitter_stack_graphs::{Variables, NoCancellation};

// Create a stack graph
let mut stack_graph = StackGraph::new();
let file_handle = stack_graph.get_or_create_file("example.py");

// Set up global variables
let mut globals = Variables::new();
globals.set("FILE_PATH", "example.py")?;

// Build the stack graph for the Python file
python_language.build_stack_graph_into(
    &mut stack_graph,
    file_handle,
    python_source_code,
    &globals,
    &NoCancellation
)?;

// Now you can perform name resolution queries
// ...
```

## Handling Python-Specific Features

The example above covers basic Python constructs, but real-world Python has additional complexities:

1. **Class inheritance** requires special handling to resolve methods through the inheritance chain
2. **Decorators** can modify the behavior of functions and classes
3. **Star imports** (`from module import *`) bring many names into scope
4. **Dynamic features** like `getattr` and `__getattr__` are challenging for static analysis

These require more advanced stack graph construction rules.