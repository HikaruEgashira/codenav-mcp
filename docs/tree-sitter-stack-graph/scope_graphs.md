# Scope Graphs

Scope graphs are a theoretical framework for modeling name binding and resolution in programming languages. They provide the foundational concepts that stack graphs build upon and extend to create an incremental analysis system.

## Origin and Development

Scope graphs were developed by researchers at TU Delft, primarily in Eelco Visser's programming languages research group. Key papers include:

1. "A Theory of Name Resolution" (2015) by Neron, Tolmach, Visser, and Wachsmuth
2. "Scopes as Types" (2018) by Van Antwerpen, Poulsen, Rouvoet, and Visser
3. "A Constraint Language for Static Semantic Analysis based on Scope Graphs" (2016) by Van Antwerpen, Neron, Tolmach, and Visser

## Core Concepts

### Scopes and Declarations

In scope graphs:

- **Scopes** are first-class entities representing regions where names are accessible
- **Declarations** introduce named entities within scopes
- **References** refer to declarations and must be resolved

### Edges and Paths

Scopes are connected by various types of edges:

- **Lexical Edges** connect nested scopes (e.g., a function scope to its containing module scope)
- **Import Edges** connect a scope to an imported scope
- **Nominal Edges** connect a scope to its associated named scope (e.g., a class to its name)

A path in a scope graph represents a possible resolution of a reference to a declaration.

### Name Resolution

Name resolution in scope graphs follows these principles:

1. **Visibility**: A declaration is visible in its containing scope and in scopes that have paths to it
2. **Shadowing**: When multiple declarations of the same name are visible, resolution is determined by a specificity ordering (generally preferring "closer" declarations)
3. **Reachability**: A declaration must be reachable from a reference via a valid path

## Key Features

### Language-Agnostic Design

Scope graphs provide a unified framework for name resolution across different programming languages, abstracting away language-specific details.

### Formal Foundations

Scope graphs have formal mathematical underpinnings, including:
- A calculus for describing name binding rules
- Formal semantics for resolution and visibility
- Proof techniques for name resolution properties

### Support for Complex Features

Scope graphs can model sophisticated language features:

1. **Lexical Scoping**: Variable shadowing and nested scopes
2. **Modules and Imports**: Cross-file references
3. **Object-Oriented Features**: Inheritance, method resolution
4. **Type-Dependent Name Resolution**: Resolving methods based on receiver types

## Limitations of Scope Graphs

While powerful, original scope graphs have limitations that stack graphs address:

### Non-Incremental Design

Classic scope graphs are not designed for incremental analysis:
- The entire graph is typically constructed at once
- Changes to one file may require rebuilding the entire graph
- No built-in mechanism for reusing previous analysis results

### Handling of Field Access

Consider a field access expression like `a.b`:
1. In classic scope graphs, resolving this requires first resolving `a`
2. Then a new reference node for `b` is created at the location where `a` is defined
3. This is not incremental, as changes to uses of `a` require updating its definition site

### Limited Scalability

Due to their non-incremental nature, classic scope graphs can struggle with:
- Very large codebases
- Frequent changes to source code
- Cross-package references where dependencies change

## Relationship to Stack Graphs

Stack graphs extend scope graphs with:

1. **Incrementality**: Decomposing the analysis to work on a per-file basis
2. **Stacks**: Using dual stacks (symbol and scope) to track resolution state
3. **Partial Paths**: Computing and stitching together partial path fragments
4. **Edge Precedence**: Explicitly modeling resolution precedence via edge attributes

The key insight of stack graphs is to view name resolution as a path-finding problem where:
- We must maintain a stack of what we're looking for
- Resolution can be "paused" and "resumed" when traversing different parts of the code
- Path finding can cross file boundaries through stitching

## Applications Beyond Name Resolution

Both scope graphs and stack graphs have applications beyond basic name resolution:

1. **Type Inference**: Inferring types through constraints on the graph
2. **Data Flow Analysis**: Tracking how data flows through programs
3. **Program Verification**: Proving properties about variable usage and scope
4. **Language Interoperability**: Modeling interactions between different languages

## Current Research

Ongoing research in scope graphs includes:
- Constraint-based extensions for more powerful static analysis
- Applications to gradual typing systems
- Formalizations of dynamic language semantics
- Integration with program transformation systems