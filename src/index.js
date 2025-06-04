import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import dotenv from "dotenv";
import { projectService } from "./services/projectServices.js";
import { registerAuthenticationTools } from "./tools/authenticationTools.js";
import { registerEpicTools } from "./tools/epicTools.js";
import { registerIssueTools } from "./tools/issueTools.js";
import { registerMilestoneTools } from "./tools/milestoneTools.js";
import { registerProjectTools } from "./tools/projectTools.js";
import { registerTaskTools } from "./tools/taskTools.js";
import { registerUserStoryTools } from "./tools/userStoryTools.js";
import { registerWikiTools } from "./tools/wikiTools.js";

// Load environment variables
dotenv.config();

// Create a new MCP server
const server = new McpServer({
  name: "Taiga MCP",
  version: "1.0.0",
});

// Add resources for documentation and context
server.resource("taiga-api-docs", "docs://taiga/api", async (uri) => ({
  contents: [
    {
      uri: uri.href,
      text: `Taiga API Documentation

This MCP server provides comprehensive access to the Taiga project management platform.
You can perform the following operations:

PROJECT MANAGEMENT:
- List, get, create, update, delete projects
- Get project statistics and search within projects
- Export project data
- Invite users to projects

USER STORY MANAGEMENT:
- List, get, create, update, delete user stories
- Assign/unassign user stories to users
- Get user story statuses

TASK MANAGEMENT:
- List, get, create, update, delete tasks
- Assign/unassign tasks to users
- Get task statuses

ISSUE MANAGEMENT:
- List, get, create, update, delete issues
- Assign/unassign issues to users
- Get issue statuses, priorities, severities, and types

EPIC MANAGEMENT:
- List, get, create, update, delete epics
- Assign/unassign epics to users

MILESTONE/SPRINT MANAGEMENT:
- List, get, create, update, delete milestones
- Get milestone statistics

USER MANAGEMENT:
- List users, get user details, get current user
- Get project members

WIKI MANAGEMENT:
- List, get, create, update, delete wiki pages

AUTHENTICATION:
- Authenticate with Taiga credentials

The server connects to the Taiga API at ${
        process.env.TAIGA_API_URL || "https://api.taiga.io/api/v1"
      }.

Authentication uses credentials: ${process.env.TAIGA_USERNAME} / ${
        process.env.TAIGA_PASSWORD
      }

All tools support both project IDs and project slugs for identification.
Status names are automatically resolved to IDs for updates.

        `,
    },
  ],
}));

// Add resource for projects
server.resource("projects", "taiga://projects", async (uri) => {
  try {
    const projects = await projectService.listProjects();
    return {
      contents: [
        {
          uri: uri.href,
          text: `Your Taiga Projects:

${projects.map((p) => `- ${p.name} (ID: ${p.id}, Slug: ${p.slug})`).join("\n")}
            `,
        },
      ],
    };
  } catch (error) {
    return {
      contents: [
        {
          uri: uri.href,
          text: `Error fetching projects: ${error.message}`,
        },
      ],
    };
  }
});

// Register all tools
registerAuthenticationTools(server);
registerProjectTools(server);
registerUserStoryTools(server);
registerTaskTools(server);
registerEpicTools(server);
registerIssueTools(server);
registerMilestoneTools(server);
//registerWikiTools(server);

// Start the server
const transport = new StdioServerTransport();
await server.connect(transport);

//console.log("Taiga MCP server started");
