
import { McpServer } from "@modelcontextprotocol/server";
import { serveStdio } from "@modelcontextprotocol/server/stdio";
import * as z from "zod/v4";

const server = new McpServer({
  name: "learning-mcp-server",
  version: "1.0.0",
});

// TOOL 1: Add two numbers
server.registerTool(
  "add_numbers",
  {
    title: "Add Numbers",
    description: "Add two numbers and return their sum.",
    inputSchema: {
      a: z.number().describe("First number"),
      b: z.number().describe("Second number"),
    },
  },
  async ({ a, b }) => {
    const result = a + b;

    return {
      content: [
        {
          type: "text",
          text: `${a} + ${b} = ${result}`,
        },
      ],
    };
  }
);

// TOOL 2: Get current date and time
server.registerTool(
  "get_current_time",
  {
    title: "Get Current Time",
    description: "Get the current date and time of this computer.",
    inputSchema: {},
  },
  async () => {
    const now = new Date();

    return {
      content: [
        {
          type: "text",
          text: now.toString(),
        },
      ],
    };
  }
);

// TOOL 3: Analyze text
server.registerTool(
  "analyze_text",
  {
    title: "Analyze Text",
    description:
      "Count characters, words, and sentences in the provided text.",
    inputSchema: {
      text: z.string().min(1).describe("Text to analyze"),
    },
  },
  async ({ text }) => {
    const characters = text.length;
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    const sentences = text
      .split(/[.!?]+/)
      .filter((sentence) => sentence.trim().length > 0).length;

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              characters,
              words,
              sentences,
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

// TOOL 4: Generate a personalized greeting
server.registerTool(
  "greet_user",
  {
    title: "Greet User",
    description: "Generate a greeting using the user's name.",
    inputSchema: {
      name: z.string().min(1).describe("User's name"),
    },
  },
  async ({ name }) => {
    return {
      content: [
        {
          type: "text",
          text: `Hello, ${name}! Welcome to my MCP server.`,
        },
      ],
    };
  }
);

// Start the MCP server using stdio.
void serveStdio(() => server);

console.error("Learning MCP server started.");
