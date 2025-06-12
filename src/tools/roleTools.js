import { z } from "zod";
import { roleService } from "../services/roleServices.js";
import { projectService } from "../services/projectServices.js";

/**
 * Register role tools
 * @param {McpServer} server - The MCP server instance
 */
export function registerRoleTools(server) {
  // Add tool for listing roles
  server.tool(
    "taiga_listRoles",
    "Get a list of all roles, optionally filtered by project",
    {
      projectIdentifier: z
        .string()
        .optional()
        .describe("Optional project ID or slug to filter roles"),
    },
    async ({ projectIdentifier }) => {
      try {
        let projectId = null;

        // Resolve project ID if slug is provided
        if (projectIdentifier) {
          if (isNaN(projectIdentifier)) {
            const project = await projectService.getProjectBySlug(
              projectIdentifier
            );
            projectId = project.id;
          } else {
            projectId = projectIdentifier;
          }
        }

        const roles = await roleService.listRoles(projectId);

        const output = projectId
          ? `Roles for project ${projectIdentifier}:\n\n${roles
              .map(
                (role) =>
                  `- ${role.name} (ID: ${role.id})${
                    role.permissions
                      ? ` - Permissions: ${role.permissions.length} permissions`
                      : ""
                  }`
              )
              .join("\n")}`
          : `All available roles:\n\n${roles
              .map(
                (role) =>
                  `- ${role.name} (ID: ${role.id})${
                    role.project_name ? ` - Project: ${role.project_name}` : ""
                  }`
              )
              .join("\n")}`;

        return {
          content: [
            {
              type: "text",
              text: output,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Failed to list roles: ${error.message}`,
            },
          ],
        };
      }
    }
  );

  // Add tool for getting role details
  server.tool(
    "taiga_getRole",
    "Get details of a specific role by ID",
    {
      roleId: z.union([z.string(), z.number()]).describe("Role ID"),
    },
    async ({ roleId }) => {
      try {
        const role = await roleService.getRole(roleId);

        let permissionsText = "";
        if (role.permissions && role.permissions.length > 0) {
          permissionsText = `\nPermissions:\n${role.permissions
            .map((perm) => `- ${perm}`)
            .join("\n")}`;
        }

        return {
          content: [
            {
              type: "text",
              text: `Role Details:

Name: ${role.name}
ID: ${role.id}
Order: ${role.order || "N/A"}
Computable: ${role.computable ? "Yes" : "No"}${
                role.project ? `\nProject: ${role.project}` : ""
              }${
                role.project_name ? `\nProject Name: ${role.project_name}` : ""
              }${permissionsText}
              `,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Failed to get role details: ${error.message}`,
            },
          ],
        };
      }
    }
  );
}
