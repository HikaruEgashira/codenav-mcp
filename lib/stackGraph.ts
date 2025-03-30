/**
 * Helper class for communicating with Tree-Sitter Stack Graph CLI
 */
export class StackGraphCli {
  private cliPath: string;

  /**
   * Constructor
   * @param cliPath Path to Tree-Sitter Stack Graph CLI (defaults to 'tree-sitter-stack-graphs' on system path)
   */
  constructor(cliPath = "tree-sitter-stack-graphs") {
    this.cliPath = cliPath;
  }

  /**
   * Internal method to execute commands
   * @param args Array of command arguments
   * @returns Command execution output
   */
  protected async executeCommand(args: string[]): Promise<string> {
    try {
      const command = [this.cliPath, ...args];
      console.error(`[executing] ${command.join(" ")}`);
      
      const process = new Deno.Command(command[0], {
        args: command.slice(1),
        stdout: "piped",
        stderr: "piped",
      });
      
      const { stdout, stderr, code } = await process.output();
      
      if (code !== 0) {
        const errorMessage = new TextDecoder().decode(stderr);
        console.error(`[error] ${errorMessage}`);
        throw new Error(`Command execution error (${code}): ${errorMessage}`);
      }
      
      return new TextDecoder().decode(stdout);
    } catch (error) {
      console.error(`[error] ${error.message}`);
      throw new Error(`Command execution error: ${error.message}`);
    }
  }

  /**
   * Parse source code and build stack graph database
   * @param sourceDir Path to source directory to index
   * @param options Options (force, language, db)
   * @returns Execution result
   */
  async createIndex(
    sourceDir: string,
    options?: { force?: boolean; language?: string; db?: string }
  ): Promise<string> {
    const args = ["index", sourceDir];
    
    if (options?.force) {
      args.push("-f");
    }
    
    if (options?.language) {
      args.push(`--language ${options.language}`);
    }
    
    if (options?.db) {
      args.push(`--db ${options.db}`);
    }
    
    return this.executeCommand(args);
  }

  /**
   * Search for definition of reference at specific position
   * @param sourcePath Source file path
   * @param line Reference line number
   * @param column Reference column number
   * @returns Execution result
   */
  async queryDefinition(
    sourcePath: string,
    line: number,
    column: number
  ): Promise<string> {
    const position = `${sourcePath}:${line}:${column}`;
    return this.executeCommand(["query", "definition", position]);
  }

  /**
   * Display stack graph database status
   * @param sourceDir Directory containing source code to check
   * @returns Execution result
   */
  async status(sourceDir: string): Promise<string> {
    return this.executeCommand(["status", sourceDir]);
  }

  /**
   * Clear or delete stack graph database
   * @param options Options (delete)
   * @returns Execution result
   */
  async clean(options?: { delete?: boolean }): Promise<string> {
    const args = ["clean"];
    
    if (options?.delete) {
      args.push("--delete");
    }
    
    return this.executeCommand(args);
  }

  /**
   * Create new project for language stack graph rule development
   * @param projectDir Project directory to create
   * @returns Execution result
   */
  async init(projectDir: string): Promise<string> {
    return this.executeCommand(["init", projectDir]);
  }

  /**
   * Test stack graph rules against sample code
   * @param testsDir Path to test directory
   * @returns Execution result
   */
  async test(testsDir: string): Promise<string> {
    return this.executeCommand(["test", testsDir]);
  }

  /**
   * Generate stack graph visualization
   * @param sourceFile Source file to visualize
   * @param options Options (format, output)
   * @returns Execution result
   */
  async visualize(
    sourceFile: string,
    options?: { format?: string; output?: string }
  ): Promise<string> {
    const args = ["visualize", sourceFile];
    
    if (options?.format) {
      args.push(`--format ${options.format}`);
    }
    
    if (options?.output) {
      args.push(`--output ${options.output}`);
    }
    
    return this.executeCommand(args);
  }

  /**
   * Debug path search algorithm
   * @param sourcePath Source file path
   * @param line Reference line number
   * @param column Reference column number
   * @returns Execution result
   */
  async debugPath(
    sourcePath: string,
    line: number,
    column: number
  ): Promise<string> {
    const position = `${sourcePath}:${line}:${column}`;
    return this.executeCommand(["debug-path", position]);
  }
}
