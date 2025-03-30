# Implementation Details

This document covers the lower-level implementation aspects of tree-sitter-stack-graphs in Rust, focusing on performance, memory management, and internal architecture.

## Memory Management

### Arena Allocation

Stack graphs use arena allocation for efficient memory management:

```rust
use stack_graphs::arena::Arena;

// Create an arena for nodes
let mut arena = Arena::new();

// Allocate nodes in the arena
let node_id = arena.add(NodeData { ... });
```

Benefits of arena allocation:
1. **Reduced Allocation Overhead**: Allocate memory in chunks instead of per node
2. **Cache Locality**: Related nodes are stored contiguously
3. **Simple Deallocation**: Memory is freed all at once when the arena is dropped

### Reference Management

Node references use compact identifiers instead of Rust references:

```rust
// IDs are used instead of references
pub struct NodeID(u32);
pub struct EdgeID(u32);
```

This approach:
- Avoids Rust ownership/borrowing complexity for graph operations
- Enables serialization/deserialization of graphs
- Reduces memory overhead compared to pointer-based references

## Data Structures

### Compact Representations

Stack graphs use compact data structures to reduce memory usage:

```rust
// Symbols are interned for deduplication
pub struct Symbol(u32);

// Paths use specialized storage
pub struct Path {
    nodes: CompactVector<NodeID>,
    edges: CompactVector<EdgeID>,
    // ...
}
```

### Indexing for Fast Lookup

Multiple indexes speed up common operations:

```rust
pub struct StackGraph {
    nodes: Arena<NodeData>,
    edges: Arena<EdgeData>,
    // Indexes for fast lookup
    outgoing_edges: HashMap<NodeID, Vec<EdgeID>>,
    incoming_edges: HashMap<NodeID, Vec<EdgeID>>,
    node_by_symbol: HashMap<Symbol, Vec<NodeID>>,
    // ...
}
```

## Path Finding Implementation

### Forward and Backward Search

Path finding implements both directions of search:

```rust
impl PathFinder {
    // Forward search from reference to definition
    pub fn find_all_paths_forward_from(&self, start_node: NodeID) -> Vec<Path>;
    
    // Backward search from definition to references
    pub fn find_all_paths_backward_from(&self, end_node: NodeID) -> Vec<Path>;
}
```

### Worklist Algorithm

Path finding uses a worklist algorithm to explore the graph efficiently:

```rust
let mut worklist = VecDeque::new();
worklist.push_back(initial_state);

while let Some(state) = worklist.pop_front() {
    // Process state
    // ...
    
    // Add new states to explore
    for next_state in compute_next_states(state) {
        worklist.push_back(next_state);
    }
}
```

### State Deduplication

To avoid exploring the same states repeatedly:

```rust
let mut visited = HashSet::new();

if !visited.contains(&state) {
    visited.insert(state.clone());
    // Process state
    // ...
}
```

## Serialization Format

### Database Schema

Stack graphs use a custom database format for persistent storage:

```rust
pub struct Database {
    connection: rusqlite::Connection,
    // ...
}

impl Database {
    // Database schema creation
    fn create_tables(&self) -> Result<(), Error> {
        self.connection.execute(
            "CREATE TABLE IF NOT EXISTS files (
                id INTEGER PRIMARY KEY,
                path TEXT NOT NULL UNIQUE
            )",
            [],
        )?;
        
        // Additional tables for graphs, partial paths, etc.
        // ...
    }
}
```

### Efficient Binary Format

For serializing partial paths:

```rust
impl Serialize for PartialPath {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        // Use compact binary representation
        // ...
    }
}
```

## Parallelization

### Thread Safety

The core data structures are designed for concurrent use:

```rust
// Thread-safe cancellation flag
pub struct AtomicCancellationFlag {
    cancelled: AtomicBool,
}

impl CancellationFlag for AtomicCancellationFlag {
    fn is_cancelled(&self) -> bool {
        self.cancelled.load(Ordering::Relaxed)
    }
    
    fn cancel(&self) {
        self.cancelled.store(true, Ordering::Relaxed);
    }
}
```

### Parallel File Processing

Multiple files can be processed concurrently:

```rust
use rayon::prelude::*;

files.par_iter().for_each(|file| {
    let mut graph = StackGraph::new();
    language.build_stack_graph_into(&mut graph, file, source, &globals, &cancellation);
    // ...
});
```

## Tree-Sitter Integration

### Query Execution

Stack graph construction leverages tree-sitter's query API:

```rust
let mut parser = tree_sitter::Parser::new();
parser.set_language(language)?;
let tree = parser.parse(source, null)?;

let query = tree_sitter::Query::new(language, query_source)?;
let mut cursor = tree_sitter::QueryCursor::new();
let matches = cursor.matches(&query, tree.root_node(), source.as_bytes());

for match_ in matches {
    // Process match and execute actions
    // ...
}
```

### Variable Binding

Tree-sitter variables are mapped to graph nodes:

```rust
pub struct Variables {
    values: HashMap<String, Value>,
}

impl Variables {
    pub fn set(&mut self, name: &str, value: impl Into<Value>) -> Result<(), VariableError>;
    pub fn get(&self, name: &str) -> Option<&Value>;
}
```

## Error Handling

Stack graphs use custom error types for precise error reporting:

```rust
pub enum BuildError {
    ParseError(ParseError),
    RuleError(RuleError),
    VariableError(VariableError),
    Cancelled,
    // ...
}

pub enum LanguageError {
    InvalidGrammar(String),
    InvalidTSG(String),
    // ...
}
```

## Performance Optimizations

### Symbol Interning

Symbols are interned to deduplicate identical strings:

```rust
pub struct SymbolTable {
    strings: Vec<String>,
    mapping: HashMap<String, Symbol>,
}

impl SymbolTable {
    pub fn intern(&mut self, string: &str) -> Symbol {
        if let Some(symbol) = self.mapping.get(string) {
            return *symbol;
        }
        let symbol = Symbol(self.strings.len() as u32);
        self.strings.push(string.to_string());
        self.mapping.insert(string.to_string(), symbol);
        symbol
    }
}
```

### Path Caching

Frequently used paths are cached:

```rust
pub struct CachedPathFinder<'a> {
    graph: &'a StackGraph,
    cache: HashMap<(NodeID, NodeID), Vec<Path>>,
}

impl<'a> CachedPathFinder<'a> {
    pub fn find_path(&mut self, from: NodeID, to: NodeID) -> Vec<Path> {
        let key = (from, to);
        if let Some(paths) = self.cache.get(&key) {
            return paths.clone();
        }
        let paths = self.compute_paths(from, to);
        self.cache.insert(key, paths.clone());
        paths
    }
}
```

### Early Termination

Path finding can terminate early when valid paths are found:

```rust
pub struct PathFinder<'a> {
    graph: &'a StackGraph,
    max_paths: Option<usize>,
    // ...
}

impl<'a> PathFinder<'a> {
    pub fn with_max_paths(mut self, max_paths: usize) -> Self {
        self.max_paths = Some(max_paths);
        self
    }
}
```

## Testing Infrastructure

### Property-Based Testing

Stack graphs use property-based testing to verify correctness:

```rust
#[test]
fn property_path_roundtrip() {
    proptest!(|(path in arbitrary_path())| {
        let serialized = bincode::serialize(&path).unwrap();
        let deserialized: Path = bincode::deserialize(&serialized).unwrap();
        assert_eq!(path, deserialized);
    });
}
```

### Integration Testing

End-to-end tests verify entire resolution pipelines:

```rust
#[test]
fn test_resolution_python() {
    let source = "x = 1\nprint(x)";
    let mut stack_graph = StackGraph::new();
    let file = stack_graph.get_or_create_file("test.py");
    
    // Build graph
    python_language.build_stack_graph_into(
        &mut stack_graph, file, source, &globals, &NoCancellation
    ).unwrap();
    
    // Find reference
    let reference = find_reference(&stack_graph, file, 1, 6).unwrap();
    
    // Find paths
    let path_finder = PathFinder::new(&stack_graph);
    let paths = path_finder.find_all_paths_forward_from(reference, null).unwrap();
    
    // Verify result
    assert_eq!(paths.len(), 1);
    let definition = paths[0].end_node;
    let source_info = stack_graph.source_info(definition).unwrap();
    assert_eq!(source_info.span.start.line, 0);
    assert_eq!(source_info.span.start.column, 0);
}
```