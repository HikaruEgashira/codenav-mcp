# Path Finding

Path finding is the core algorithm in stack graphs for resolving name bindings. It determines which definitions a reference might refer to by finding paths through the graph that connect references to definitions.

## Core Concepts

### Paths and Name Binding

A path in a stack graph represents a possible name binding - connecting a reference to a definition. The path finding algorithm searches for valid paths that satisfy the constraints encoded in the graph structure.

### The Dual-Stack Approach

During path finding, two stacks are maintained:

1. **Symbol Stack**: Contains the symbols being resolved
2. **Scope Stack**: Contains the scopes being considered

Different node types in the path manipulate these stacks in specific ways:

- **Push Symbol** nodes push a symbol onto the symbol stack
- **Pop Symbol** nodes pop a symbol from the symbol stack
- **Push Scoped Symbol** nodes push both a symbol and a scope
- **Pop Scoped Symbol** nodes pop both a symbol and a scope
- **Drop Scopes** nodes clear the scope stack

## Algorithm Overview

The path finding algorithm in stack graphs works as follows:

1. **Start at a Reference**: Begin at a push symbol node representing a reference
2. **Forward Search**: Follow edges forward from the reference
3. **Stack Manipulation**: Update symbol and scope stacks based on encountered nodes
4. **Match Definitions**: When a definition (pop symbol node) is reached that matches the symbol stack, record the path
5. **Precedence Resolution**: If multiple paths are found, use precedence to determine the best matches

## Path Finding Phases

### 1. Path Initialization

The search begins at a specific reference node (typically a push symbol node):

```rust
let reference_node = graph.node_for_position(file, line, column)?;
let path_finder = PathFinder::new(graph);
```

### 2. Forward Exploration

The algorithm explores the graph forward from the reference node:

```rust
let paths = path_finder.find_all_paths_forward_from(reference_node, null)?;
```

This explores all possible paths that could connect the reference to definitions.

### 3. Stack Manipulation

As nodes are encountered, the symbol and scope stacks are updated:

- **Push Symbol Node**: Adds a symbol to the symbol stack
- **Pop Symbol Node**: Removes a symbol from the symbol stack; path is valid if the popped symbol matches
- **Scope Nodes**: Used to navigate through different scopes
- **Jump-to-Scope Node**: Enables non-local jumps between scopes

### 4. Path Collection

Valid paths (those that connect references to definitions) are collected:

```rust
let paths: Vec<Path> = path_finder.find_all_paths(reference_node)?;
```

### 5. Precedence Resolution

When multiple paths are found, they are filtered based on precedence:

```rust
let best_paths = paths.filter_by_precedence();
```

Edges with higher precedence values are preferred, allowing for proper handling of shadowing.

## Partial Paths and Stitching

For efficiency, the path finding process often uses "partial paths":

1. **Partial Paths**: Precomputed path fragments that are specific to each file
2. **Stitching**: Combining partial paths from different files to form complete paths

This approach allows for incremental analysis, as partial paths can be reused when only some files change.

```rust
// Compute partial paths for a file
let partials = path_finder.compute_partial_paths_for_file(file_handle)?;

// Stitch partial paths together
let paths = path_finder.stitch_partial_paths(partial_paths)?;
```

## Cycle Detection and Handling

The path finding algorithm includes mechanisms to detect and handle cycles in the graph:

```rust
let path_finder = PathFinder::new(graph)
    .with_cycle_detection(true);
```

Cycle detection prevents infinite loops during path finding, which can occur in recursive references.

## Path Caching

For performance, paths can be cached:

```rust
let cached_path_finder = CachedPathFinder::new(graph);
let paths = cached_path_finder.find_all_paths(reference_node)?;
```

This avoids redundant computation for the same queries.

## Path Result Structure

A found path includes:

1. **Start Node**: The reference node
2. **End Node**: The definition node
3. **Path Steps**: The sequence of nodes and edges traversed
4. **Symbol Stack**: The final symbol stack state
5. **Scope Stack**: The final scope stack state

## Example Scenarios

### 1. Local Variable Resolution

For a local variable reference, the path might be:

1. Start at the reference (push_symbol node)
2. Follow edges to the containing scope
3. Navigate to the variable definition (pop_symbol node)
4. Verify the symbol matches and return the path

### 2. Member Access Resolution

For a member access like `object.property`:

1. First resolve `object` to find its definition
2. Push the property name onto the symbol stack
3. Navigate to the object's scope
4. Look for a definition of the property in that scope

### 3. Import Resolution

For an imported name:

1. Start at the reference
2. Navigate to the import statement
3. Jump to the module being imported
4. Find the definition in that module

## Performance Considerations

Several techniques optimize path finding performance:

1. **Partial Path Caching**: Precomputing and caching partial paths
2. **Precedence-Based Pruning**: Avoiding exploration of lower-precedence paths
3. **Early Termination**: Stopping once suitable paths are found
4. **Path Limits**: Setting maximum limits on path length and count

## Applications

The path finding algorithm enables various features:

1. **Go to Definition**: Finding where a symbol is defined
2. **Find References**: Determining all uses of a definition
3. **Rename Refactoring**: Ensuring all references are updated
4. **Static Analysis**: Verifying that all references resolve to definitions