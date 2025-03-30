# Stack Graphs

Stack graphs provide a framework for performing name resolution for any programming language while abstracting away the specific name resolution rules for each language. They are an incremental variant of scope graphs, designed to efficiently resolve name bindings across multiple files and packages.

## Core Concepts

### Name Binding
In stack graphs, name binding maps references to their possible definitions. These bindings are represented by paths within the graph structure. The graph connects definition nodes and reference nodes, allowing path-finding algorithms to resolve which definitions a reference might refer to.

### Incremental Analysis
A key innovation of stack graphs is their incremental nature. When source code changes, only the affected files need to be reanalyzed, and previously computed results for unchanged files can be reused. This makes stack graphs particularly efficient for large codebases.

### Symbol and Scope Stacks
During path finding in a stack graph, two stacks are maintained:
- **Symbol Stack**: Tracks which symbols are being resolved
- **Scope Stack**: Controls which scopes are used to look for those symbols

This dual-stack approach enables resolving complex constructs like field access expressions (e.g., `object.property`) by pausing the resolution of one component to handle another.

## Node Types

Stack graphs use various node types to model different aspects of name resolution:

1. **Scope Nodes**: Represent lexical scopes within the code
2. **Push Symbol Nodes**: Push a symbol onto the symbol stack
3. **Pop Symbol Nodes**: Pop a symbol from the symbol stack, often associated with definitions
4. **Push Scoped Symbol Nodes**: Push both a symbol and scope information
5. **Pop Scoped Symbol Nodes**: Pop both symbol and scope information
6. **Drop Scopes Nodes**: Clear scope information

## Relationship to Scope Graphs

Stack graphs are based on the scope graphs formalism developed at TU Delft. While scope graphs also model name binding with a graph structure, stack graphs add incrementality, making them more practical for real-world development tools where files change frequently.

The key innovation is maintaining stacks during path resolution, allowing the algorithm to "pause" one resolution to start another, then resume the original resolution. This approach enables resolving complex expressions like `A.foo` with a single execution of the path-finding algorithm while keeping the graph structure modular and incremental.

## Applications

Stack graphs are particularly useful for:
- IDE features like "go to definition" and "find references"
- Static analysis tools that need to understand name bindings
- Language servers that require incremental analysis
- Cross-language analysis where consistent name resolution is needed