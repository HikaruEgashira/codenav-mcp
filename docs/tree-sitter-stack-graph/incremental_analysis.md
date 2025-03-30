# Incremental Analysis

Incremental analysis is a fundamental feature of stack graphs that enables efficient code analysis when only portions of code change. This capability is particularly valuable in real-world development environments where files are frequently modified.

## The Need for Incrementality

In traditional static analysis:
1. When a file changes, the entire codebase often needs to be reanalyzed
2. This becomes prohibitively expensive for large codebases
3. Slow analysis leads to poor developer experience, especially in IDEs

Stack graphs address this problem through a principled approach to incremental analysis.

## Core Principles of Incrementality in Stack Graphs

### 1. File-Based Granularity

Stack graphs are built with file-level granularity:
- Each source file is processed independently
- The graph structure for a file depends only on the content of that file
- Changes to one file don't require rebuilding graphs for unchanged files

### 2. Partial Paths

A key innovation in stack graphs is the concept of "partial paths":

- **Definition**: Partial paths are path fragments that start or end at file boundaries
- **Computation**: They are precomputed for each file independently
- **Storage**: Partial paths are stored in a database for reuse
- **Stitching**: Complete paths are formed by stitching together partial paths from different files

### 3. Graph Composition

Stack graphs from individual files can be composed into a complete program graph:

```rust
// Create a combined graph
let mut combined_graph = StackGraph::new();

// Add graphs from individual files
combined_graph.extend(&file1_graph);
combined_graph.extend(&file2_graph);
// ...
```

This composition preserves the structure and semantics of the original graphs.

## The Incremental Analysis Workflow

1. **Initial Analysis**:
   - Parse all source files
   - Build stack graphs for each file
   - Compute and store partial paths

2. **When Files Change**:
   - Identify changed files
   - Rebuild stack graphs only for those files
   - Recompute partial paths only for those files
   - Reuse existing partial paths for unchanged files

3. **Path Finding**:
   - Stitch together partial paths to form complete paths
   - Most partial paths can be reused from previous analyses

## Implementation Details

### Database Storage

Incremental analysis relies on persistent storage:

```rust
// Store partial paths in a database
let database = Database::open("path/to/db")?;
database.add_partial_paths(file_handle, partial_paths)?;

// Later, retrieve them
let stored_paths = database.partial_paths_for_file(file_handle)?;
```

The database stores:
- Graph structures for each file
- Partial paths computed for each file
- Metadata for change detection

### Change Detection

Several strategies detect which files need reanalysis:

1. **Timestamp-based**: Compare file modification times
2. **Hash-based**: Compare content hashes
3. **Version-based**: Track file versions explicitly

### Path Stitching

The stitching process combines partial paths:

```rust
let stitcher = PartialPathStitcher::new(&graph);
let complete_paths = stitcher.stitch(partial_paths)?;
```

This is efficient because:
- Partial paths are typically small compared to complete paths
- The number of partial paths is much smaller than potential complete paths
- Stitching operations can be optimized and parallelized

## Benefits of Incremental Analysis

### 1. Performance

Incremental analysis offers significant performance improvements:
- Analysis time becomes proportional to the size of changes, not codebase size
- Large codebases can be analyzed efficiently
- Path finding results can be delivered with low latency

### 2. Scalability

The approach scales well to large codebases:
- Memory usage is controlled by processing files independently
- Parallelization is natural as files can be processed concurrently
- Distributed analysis becomes possible

### 3. IDE Integration

Incremental analysis is ideal for IDE integration:
- Quick response to edits for features like "go to definition"
- Background analysis can efficiently update as files change
- Low-latency results maintain a smooth user experience

## Limitations and Considerations

### 1. Cross-File Dependencies

Despite incrementality, some changes have wider impact:
- Changes to exported symbols may affect many files
- Structural changes to core libraries can invalidate many partial paths
- In the worst case, most files might need reanalysis

### 2. Database Size

The database of partial paths can grow large:
- Each file may have many partial paths
- Storage requirements grow with codebase size
- Pruning strategies may be needed for very large codebases

### 3. Initial Analysis Cost

The first analysis is still a full analysis:
- Initial indexing still processes the entire codebase
- Large projects have significant startup cost
- This cost is amortized over subsequent incremental updates

## Example Scenario

Consider a Python project with a change to a single file:

1. **Before Change**:
   - All files have been analyzed
   - Partial paths are stored in the database
   - Lookups are fast using stitched paths

2. **After Change to `utils.py`**:
   - Only `utils.py` needs reanalysis
   - Its stack graph is rebuilt
   - Its partial paths are recomputed
   - Partial paths for other files are reused
   - Complete paths are stitched using the updated partial paths

3. **Result**:
   - Analysis time is proportional to the size of `utils.py`, not the entire project
   - Developer experiences minimal delay
   - All name lookups reflect the latest code state