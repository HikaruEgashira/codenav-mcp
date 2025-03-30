# tree-sitter-stack-graphs

> tree-sitter-stack-graphs is a Rust implementation that enables the creation of stack graphs using tree-sitter grammars for name resolution and static analysis in programming languages.

tree-sitter-stack-graphs combines two powerful tools: tree-sitter (a parser generator that can build concrete syntax trees) and stack graphs (an incremental variant of scope graphs used for name binding and resolution). It allows developers to define name resolution rules for programming languages by creating stack graph nodes and edges from parsed syntax trees.

## Core Concepts
- [Stack Graphs](stack_graphs.md): An incremental variant of scope graphs that allows for efficient name resolution across programming languages
- [Tree-Sitter Integration](tree_sitter_integration.md): How tree-sitter syntax trees are converted into stack graph structures
- [Graph DSL](graph_dsl.md): The domain-specific language used to define stack graph construction rules from tree-sitter parse trees
- [Node Types](node_types.md): Different types of nodes in stack graphs and their specific roles in name resolution

## Components
- [CLI Tool](cli_tool.md): Command-line interface for indexing code and performing name resolution queries
- [Graph Construction](graph_construction.md): How stack graphs are built from source code
- [Path Finding](path_finding.md): How name bindings are resolved by finding paths in stack graphs
- [Incremental Analysis](incremental_analysis.md): How stack graphs enable efficient code analysis when only portions of code change

## Examples
- [Python Example](python_example.md): Example of stack graph construction rules for Python
- [Basic Reference Resolution](reference_resolution.md): How to resolve references to definitions using stack graphs

## Optional
- [Scope Graphs](scope_graphs.md): The theoretical foundation that stack graphs are built upon
- [Implementation Details](implementation_details.md): Lower-level implementation aspects of stack graphs in Rust