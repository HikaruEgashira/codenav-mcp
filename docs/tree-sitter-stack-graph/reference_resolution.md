# Basic Reference Resolution

Reference resolution is the fundamental operation in stack graphs - finding which definitions a reference might refer to. This document explains how reference resolution works in tree-sitter-stack-graphs with a focus on practical examples.

## The Reference Resolution Problem

In programming languages, references must be resolved to their corresponding definitions:

```python
# Definition
x = 42

# Reference
print(x)  # This reference to 'x' must be resolved to the definition above
```

Reference resolution answers the question: "When I see a name used at position X, where was that name defined?"

## Resolution Process Overview

The process of resolving references involves several steps:

1. **Locate Reference**: Find the reference node in the stack graph
2. **Initialize Path Finding**: Set up the path finding algorithm
3. **Find Paths**: Search for paths from the reference to potential definitions
4. **Filter Results**: Apply precedence rules to select the best matches
5. **Return Locations**: Map the definition nodes back to source locations

## Example: Simple Variable Resolution

Consider this simple Python program:

```python
x = 10
print(x)
```

### Stack Graph Structure

The stack graph for this program would include:

1. **Pop Symbol Node** for the definition of `x`
2. **Push Symbol Node** for the reference to `x` in `print(x)`
3. **Scope Node** for the module scope containing both
4. **Edges** connecting these nodes appropriately

### Resolution Code

Here's how to resolve the reference using the tree-sitter-stack-graphs API:

```rust
use stack_graphs::graph::StackGraph;
use stack_graphs::paths::PathFinder;
use tree_sitter_stack_graphs::{StackGraphLanguage, Variables, NoCancellation};

// Set up the stack graph
let mut stack_graph = StackGraph::new();
let file_handle = stack_graph.get_or_create_file("example.py");
let python_source = "x = 10\nprint(x)";

// Load the language and build the graph
let python_language = StackGraphLanguage::from_str(
    tree_sitter_python::LANGUAGE.into(),
    PYTHON_TSG_RULES,
)?;
let mut globals = Variables::new();
globals.set("FILE_PATH", "example.py")?;
python_language.build_stack_graph_into(
    &mut stack_graph,
    file_handle,
    python_source,
    &globals,
    &NoCancellation,
)?;

// Find the reference node
let reference_position = stack_graph.source_position(
    file_handle,
    1,  // Line 2 (0-indexed)
    6,  // Column 7 (0-indexed)
)?;
let reference_node = stack_graph.node_for_position(reference_position)?;

// Resolve the reference
let path_finder = PathFinder::new(&stack_graph);
let paths = path_finder.find_all_paths_forward_from(reference_node, null)?;

// Get the definition locations
for path in paths {
    let definition_node = path.end_node;
    if let Some(position) = stack_graph.source_info(definition_node) {
        println!("Definition found at {}:{}:{}", 
            position.file.name,
            position.span.start.line + 1,
            position.span.start.column + 1
        );
    }
}
```

This would output: `Definition found at example.py:1:1`

## Example: Handling Scopes and Shadowing

Consider a more complex example with nested scopes and shadowing:

```python
x = 10
def foo():
    x = 20
    print(x)  # Should resolve to the inner x
print(x)      # Should resolve to the outer x
```

The stack graph represents these scopes with:

1. **Module Scope** containing the outer `x` definition
2. **Function Scope** for `foo` containing the inner `x` definition
3. **Appropriately Connected Edges** between scopes

### Resolution with Precedence

Stack graphs handle shadowing through edge precedence. Inner scope definitions typically have higher precedence than outer ones:

```rust
// Find the reference to x inside the function
let inner_reference = stack_graph.node_for_position(
    stack_graph.source_position(file_handle, 3, 10)?
)?;

// Find paths
let paths = path_finder.find_all_paths_forward_from(inner_reference, null)?;

// By default, paths are ordered by precedence
// The inner definition (x = 20) should be the first result
```

## Example: Cross-File Resolution

Resolution often spans multiple files:

```python
# module_a.py
def helper():
    return 42

# main.py
from module_a import helper
result = helper()  # Reference to helper defined in module_a.py
```

Resolving cross-file references requires:

1. Building stack graphs for both files
2. Computing partial paths
3. Stitching partial paths together during path finding

```rust
// Build graphs for both files
python_language.build_stack_graph_into(&mut stack_graph, file_a, module_a_source, &globals_a, &NoCancellation)?;
python_language.build_stack_graph_into(&mut stack_graph, file_main, main_source, &globals_main, &NoCancellation)?;

// Find reference in main.py
let reference = stack_graph.node_for_position(
    stack_graph.source_position(file_main, 1, 10)?
)?;

// Resolve - will automatically traverse file boundaries
let paths = path_finder.find_all_paths_forward_from(reference, null)?;
```

## Advanced Resolution Scenarios

### 1. Method Resolution in Classes

Method calls on objects require resolving both the object and the method:

```python
class MyClass:
    def method(self):
        pass

obj = MyClass()
obj.method()  # Resolving this requires multiple steps
```

The resolution involves:
1. Resolving `obj` to its definition
2. Finding the class type of `obj`
3. Resolving `method` within that class's scope

### 2. Handling Imports

Import statements create references to external definitions:

```python
from math import sqrt
result = sqrt(4)  # Resolving sqrt requires following the import
```

The graph structure for imports typically includes:
- **Push Symbol Node** for the reference to the imported name
- **Edge to the Jump-to-Scope Node** that enables cross-module jumps
- **Connection to the Root Node** for global lookups

### 3. Handling Qualified Names

Qualified names like `module.submodule.function` require multiple resolution steps:

```python
import os.path
name = os.path.basename("/tmp/file.txt")
```

Each component is resolved in sequence, pushing symbols and scopes as needed.

## Performance Considerations

For large codebases, performance optimizations include:

1. **Partial Path Caching**: Precompute and cache partial paths
2. **Database Storage**: Store stack graphs and partial paths persistently
3. **Incremental Updates**: Only rebuild graphs for changed files
4. **Parallelization**: Process multiple files concurrently

## Understanding Resolution Failures

When resolution fails, it's typically for one of these reasons:

1. **Missing Definition**: The referenced name isn't defined
2. **Scope Issues**: The reference can't "see" the definition due to scope rules
3. **Parse Errors**: The source code couldn't be parsed correctly
4. **Rule Issues**: The stack graph construction rules don't handle the language construct

Debugging tools include:
- Path visualization
- Debugging output of symbol and scope stacks
- Tracing the path finding algorithm