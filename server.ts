import { Server } from "npm:@modelcontextprotocol/sdk@1.5.0/server/index.js";
import { StdioServerTransport } from "npm:@modelcontextprotocol/sdk@1.5.0/server/stdio.js";
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  Tool,
  CallToolRequest,
} from "npm:@modelcontextprotocol/sdk@1.5.0/types.js";
import { StackGraphCli } from "./lib/stackGraph.ts";

const TOOLS: Tool[] = [
  {
    name: "query_definition",
    description: "Searches for the definition of a reference at a specific position",
    inputSchema: {
      type: "object",
      properties: {
        source_path: { type: "string", description: "Path to the source file" },
        line: { type: "number", description: "Line number of the reference" },
        column: { type: "number", description: "Column number of the reference" },
        source_dir: { type: "string", description: "Path to the source directory (used to create an index if the DB does not exist)" },
      },
      required: ["source_path", "line", "column"],
    },
  },
];

const server = new Server(
  {
    name: "codenav-mcp",
    version: "0.1.0",
  },
  {
    capabilities: {
      resources: {},
      tools: {
        query_definition: TOOLS[0],
      },
    },
  }
);

server.setRequestHandler(ListResourcesRequestSchema, () => ({
  resources: [],
}));

server.setRequestHandler(ListToolsRequestSchema, () => ({ tools: TOOLS }));
const cli = new StackGraphCli();

/**
 * Function to check if the DB exists
 * @returns Whether the DB file exists
 */
async function checkDbExists(path = ".stack-graphs"): Promise<boolean> {
  try {
    const stat = await Deno.stat(path);
    return stat.isFile || stat.isDirectory;
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      return false;
    }
    throw error;
  }
}

server.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest) => {
  const name = request.params.name;
  const args = request.params.arguments ?? {};

  console.error(`[request] ${name} with args:`, args);

  try {
    let result: string;

    if (name !== "query_definition") {
      return {
        content: [
          {
            type: "text",
            text: `Unknown tool: ${name}`,
          },
        ],
        isError: true,
      };
    }

    const { source_path, line, column, source_dir } = args;

    // Check if the DB exists, and if not, execute create_index
    const dbExists = await checkDbExists();
    if (!dbExists) {
      if (!source_dir) {
        throw new Error("The DB does not exist, so the source_dir parameter is required");
      }

      console.error(`[info] The DB does not exist, creating an index: ${source_dir}`);
      await cli.createIndex(source_dir as string);
    }

    result = await cli.queryDefinition(
      source_path as string,
      line as number,
      column as number
    );

    return {
      content: [
        {
          type: "text",
          text: result,
        },
      ],
      isError: false,
    };
  } catch (error) {
    console.error(`[error] ${error.message}`);
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

if (import.meta.main) {
  await server.connect(new StdioServerTransport());
  console.error("MCP server running on stdio");
}

// Test
import { Client } from "npm:@modelcontextprotocol/sdk@1.5.0/client/index.js";
import { InMemoryTransport } from "npm:@modelcontextprotocol/sdk@1.5.0/inMemory.js";
import { expect } from "jsr:@std/expect@1.0.13";

class MockStackGraphCli extends StackGraphCli {
  override async executeCommand(_args: string[]): Promise<string> {
    return "mock result";
  }
}

Deno.test("query_definition test", async () => {
  const mockCli = new MockStackGraphCli();
  let createdIndex = false;

  const originalCheckDbExists = checkDbExists;
  // @ts-ignore - Temporarily overwrite the global function
  globalThis.checkDbExists = async () => {
    return createdIndex;
  };

  // Create a new server for testing
  const testServer = new Server(
    {
      name: "test-server",
      version: "1.0.0",
    },
    {
      capabilities: {
        resources: {},
        tools: {
          query_definition: TOOLS[0],
        },
      },
    }
  );

  testServer.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest) => {
    const name = request.params.name;
    const args = request.params.arguments ?? {};

    try {
      let result: string;

      if (name === "query_definition") {
        const { source_path, line, column, source_dir } = args;

        if (!createdIndex) {
          if (!source_dir) {
            await mockCli.createIndex(".");
          } else {
            await mockCli.createIndex(source_dir as string);
          }

          createdIndex = true;
        }

        result = await mockCli.queryDefinition(
          source_path as string,
          line as number,
          column as number
        );
      } else {
        result = "Unknown command";
      }

      return {
        content: [
          {
            type: "text",
            text: result,
          },
        ],
        isError: false,
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  });

  try {
    const client = new Client(
      {
        name: "test client",
        version: "1.0",
      },
      {
        capabilities: {},
      }
    );
    const [clientTransport, serverTransport] =
      InMemoryTransport.createLinkedPair();
    await Promise.all([
      client.connect(clientTransport),
      testServer.connect(serverTransport),
    ]);

    // Test when the DB does not exist
    const result1 = await client.callTool({
      name: "query_definition",
      arguments: {
        source_path: "/path/to/file.ts",
        line: 10,
        column: 5,
        source_dir: "/path/to/project"
      },
    });

    expect(result1.isError).toBe(false);
    let content = result1.content as Array<{ type: string, text: string }>;
    expect(content[0].type).toBe("text");
    expect(content[0].text).toBe("Mock test result");

    // Test when the DB already exists
    const result2 = await client.callTool({
      name: "query_definition",
      arguments: {
        source_path: "/path/to/file.ts",
        line: 10,
        column: 5,
      },
    });

    expect(result2.isError).toBe(false);
    content = result2.content as Array<{ type: string, text: string }>;
    expect(content[0].type).toBe("text");
    expect(content[0].text).toBe("Mock test result");
  } finally {
    // @ts-ignore
    globalThis.checkDbExists = originalCheckDbExists;
  }
});
