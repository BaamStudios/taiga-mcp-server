import { z } from "zod";
import { authenticate } from "../taigaAuth.js";
import { authenticationService } from "../services/authenticationServices.js";

/**
 * Register authentication tools
 * @param {McpServer} server - The MCP server instance
 * @param {TaigaService} taigaService - The Taiga service instance
 */
export function registerAuthenticationTools(server) {
  // Add tool for authenticating with Taiga
  server.tool(
    "taiga_authenticate",
    "Authenticate with Taiga API using username and password credentials",
    {
      username: z.string().optional(),
      password: z.string().optional(),
    },
    async ({ username, password }) => {
      try {
        // Use provided credentials or fall back to environment variables
        const user = username || process.env.TAIGA_USERNAME;
        const pass = password || process.env.TAIGA_PASSWORD;

        if (!user || !pass) {
          return {
            content: [
              {
                type: "text",
                text: "Error: Username and password are required. Please provide them or set them in the environment variables.",
              },
            ],
          };
        }
        await authenticate(user, pass);
        const currentUser = await authenticationService.getCurrentUser();

        return {
          content: [
            {
              type: "text",
              text: `Successfully authenticated as ${currentUser.full_name} (${currentUser.username}).`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Authentication failed: ${error.message}`,
            },
          ],
        };
      }
    }
  );

  // Get current user
  server.tool(
    "taiga_getCurrentUser",
    "Get details of the currently authenticated user",
    {},
    async () => {
      try {
        const user = await authenticationService.getCurrentUser();

        return {
          content: [
            {
              type: "text",
              text: `Current User:
ID: ${user.id}
Username: ${user.username}
Full Name: ${user.full_name || "Not set"}
Email: ${user.email || "Not set"}
Bio: ${user.bio || "No bio"}
Date Joined: ${user.date_joined}
Is Active: ${user.is_active ? "Yes" : "No"}
Language: ${user.lang || "Not set"}
Timezone: ${user.timezone || "Not set"}`,
            },
          ],
        };
      } catch (error) {
        throw new Error(`Failed to get current user: ${error.message}`);
      }
    }
  );

  // Add tool for getting project members
  server.tool(
    "taiga_getProjectMembers",
    "List all members of a specific project",
    {
      projectIdentifier: z.string().describe("Project ID or slug"),
    },
    async ({ projectIdentifier }) => {
      try {
        let projectId = projectIdentifier;
        if (isNaN(projectIdentifier)) {
          const project = await projectService.getProjectBySlug(
            projectIdentifier
          );
          projectId = project.id;
        }

        const members = await projectService.getProjectMembers(projectId);

        if (members.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: "No members found in this project.",
              },
            ],
          };
        }

        return {
          content: [
            {
              type: "text",
              text: `Project Members:

${members
  .map(
    (member) =>
      `- ${member.full_name_display} (${member.username}) - Role: ${member.role_name}`
  )
  .join("\n")}
            `,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Failed to get project members: ${error.message}`,
            },
          ],
        };
      }
    }
  );

  // List users
  server.tool(
    "taiga_listUsers",
    "Get a list of all users in the Taiga instance",
    {},
    async () => {
      try {
        const users = await authenticationService.listUsers();

        const userList = users
          .map(
            (user) =>
              `- ${user.full_name || user.username} (ID: ${user.id}, Email: ${
                user.email || "N/A"
              })`
          )
          .join("\n");

        return {
          content: [
            {
              type: "text",
              text: `Users in Taiga:
${userList}

Total: ${users.length} users`,
            },
          ],
        };
      } catch (error) {
        throw new Error(`Failed to list users: ${error.message}`);
      }
    }
  );

  // Get user details
  server.tool(
    "taiga_getUser",
    "Get details of a specific user by ID",
    {
      userId: z.number().describe("User ID"),
    },
    async ({ userId }) => {
      try {
        const user = await authenticationService.getUser(userId);

        return {
          content: [
            {
              type: "text",
              text: `User Details:
ID: ${user.id}
Username: ${user.username}
Full Name: ${user.full_name || "Not set"}
Email: ${user.email || "Not set"}
Bio: ${user.bio || "No bio"}
Date Joined: ${user.date_joined}
Is Active: ${user.is_active ? "Yes" : "No"}
Language: ${user.lang || "Not set"}
Timezone: ${user.timezone || "Not set"}`,
            },
          ],
        };
      } catch (error) {
        throw new Error(`Failed to get user: ${error.message}`);
      }
    }
  );
}
