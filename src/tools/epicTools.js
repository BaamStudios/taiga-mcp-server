import { z } from "zod";
import { projectService } from "../services/projectServices.js";
import { epicService } from "../services/epicServices.js";

/**
 * Register epic management tools
 * @param {McpServer} server - The MCP server instance
 */
export function registerEpicTools(server) {
  // List epics
  server.tool(
    "taiga_listEpics",
    "List all epics for a specific project",
    {
      projectIdentifier: z.string().describe("Project ID or slug"),
      status: z.string().optional().describe("Filter by status name"),
      assignedTo: z.string().optional().describe("Filter by assigned user ID"),
    },
    async ({ projectIdentifier, status, assignedTo }) => {
      try {
        // Resolve project ID if slug is provided
        let resolvedProjectId = projectIdentifier;
        if (isNaN(Number(projectIdentifier))) {
          const project = await projectService.getProjectBySlug(
            projectIdentifier
          );
          resolvedProjectId = project.id;
        }

        const filters = {};
        if (status) filters.status = status;
        if (assignedTo) filters.assigned_to = assignedTo;

        const epics = await epicService.listEpics(resolvedProjectId, filters);
        return {
          content: [
            {
              type: "text",
              text: `Epics for project ${projectIdentifier}:

${epics
  .map(
    (epic) =>
      `Epic #${epic.ref}: ${epic.subject}
  - Status: ${epic.status_extra_info?.name || "N/A"}
  - Assigned to: ${epic.assigned_to_extra_info?.full_name || "Unassigned"}
  - Created: ${epic.created_date}
  - Color: ${epic.color || "Default"}
  ${epic.description ? `- Description: ${epic.description}` : ""}
`
  )
  .join("\n")}

Total: ${epics.length} epic(s)`,
            },
          ],
        };
      } catch (error) {
        throw new Error(`Failed to list epics: ${error.message}`);
      }
    }
  );

  // Get epic
  server.tool(
    "taiga_getEpic",
    "Get details of a specific epic by ID",
    {
      epicId: z.number().describe("Epic ID"),
    },
    async ({ epicId }) => {
      try {
        const epic = await epicService.getEpic(epicId);
        return {
          content: [
            {
              type: "text",
              text: `Epic Details:

Epic #${epic.ref}: ${epic.subject}
Project: ${epic.project_extra_info?.name || epic.project}
Status: ${epic.status_extra_info?.name || "N/A"}
Assigned to: ${epic.assigned_to_extra_info?.full_name || "Unassigned"}
Created: ${epic.created_date}
Modified: ${epic.modified_date}
Color: ${epic.color || "Default"}
${epic.description ? `Description: ${epic.description}` : "No description"}

Tags: ${epic.tags?.join(", ") || "None"}
Watchers: ${epic.watchers?.length || 0}
`,
            },
          ],
        };
      } catch (error) {
        throw new Error(`Failed to get epic: ${error.message}`);
      }
    }
  );

  // Create epic
  server.tool(
    "taiga_createEpic",
    "Create a new epic in a project",
    {
      projectIdentifier: z.string().describe("Project ID or slug"),
      subject: z.string().describe("Epic subject/title"),
      description: z.string().optional().describe("Epic description"),
      color: z.string().optional().describe("Epic color"),
      assignedTo: z.number().optional().describe("User ID to assign epic to"),
    },
    async ({ projectIdentifier, subject, description, color, assignedTo }) => {
      try {
        // Resolve project ID if slug is provided
        let resolvedProjectId = projectIdentifier;
        if (isNaN(Number(projectIdentifier))) {
          const project = await projectService.getProjectBySlug(
            projectIdentifier
          );
          resolvedProjectId = project.id;
        }

        const epicData = {
          project: resolvedProjectId,
          subject,
          ...(description && { description }),
          ...(color && { color }),
          ...(assignedTo && { assigned_to: assignedTo }),
        };

        const epic = await epicService.createEpic(epicData);
        return {
          content: [
            {
              type: "text",
              text: `Epic created successfully!

Epic #${epic.ref}: ${epic.subject}
Project: ${epic.project_extra_info?.name || epic.project}
Status: ${epic.status_extra_info?.name || "N/A"}
Assigned to: ${epic.assigned_to_extra_info?.full_name || "Unassigned"}
Created: ${epic.created_date}
Color: ${epic.color || "Default"}
${epic.description ? `Description: ${epic.description}` : ""}
`,
            },
          ],
        };
      } catch (error) {
        throw new Error(`Failed to create epic: ${error.message}`);
      }
    }
  );

  // Update epic
  server.tool(
    "taiga_updateEpic",
    "Update an existing epic",
    {
      epicId: z.number().describe("Epic ID to update"),
      subject: z.string().optional().describe("New epic subject"),
      description: z.string().optional().describe("New epic description"),
      color: z.string().optional().describe("New epic color"),
      assignedTo: z.number().optional().describe("User ID to assign epic to"),
      statusName: z.string().optional().describe("New status name"),
    },
    async ({ epicId, subject, description, color, assignedTo, statusName }) => {
      try {
        const updateData = {};
        if (subject) updateData.subject = subject;
        if (description) updateData.description = description;
        if (color) updateData.color = color;
        if (assignedTo) updateData.assigned_to = assignedTo;
        if (statusName) updateData.status = statusName;

        const epic = await epicService.updateEpic(epicId, updateData);
        return {
          content: [
            {
              type: "text",
              text: `Epic updated successfully!

Epic #${epic.ref}: ${epic.subject}
Project: ${epic.project_extra_info?.name || epic.project}
Status: ${epic.status_extra_info?.name || "N/A"}
Assigned to: ${epic.assigned_to_extra_info?.full_name || "Unassigned"}
Modified: ${epic.modified_date}
Color: ${epic.color || "Default"}
${epic.description ? `Description: ${epic.description}` : ""}
`,
            },
          ],
        };
      } catch (error) {
        throw new Error(`Failed to update epic: ${error.message}`);
      }
    }
  );

  // Delete epic
  server.tool(
    "taiga_deleteEpic",
    "Delete an epic",
    {
      epicId: z.number().describe("Epic ID to delete"),
    },
    async ({ epicId }) => {
      try {
        await epicService.deleteEpic(epicId);
        return {
          content: [
            {
              type: "text",
              text: `Epic ${epicId} deleted successfully.`,
            },
          ],
        };
      } catch (error) {
        throw new Error(`Failed to delete epic: ${error.message}`);
      }
    }
  );

  // Assign epic
  server.tool(
    "taiga_assignEpic",
    "Assign an epic to a user",
    {
      epicId: z.number().describe("Epic ID"),
      userId: z.number().describe("User ID to assign the epic to"),
    },
    async ({ epicId, userId }) => {
      try {
        const epic = await epicService.assignEpicToUser(epicId, userId);
        return {
          content: [
            {
              type: "text",
              text: `Epic assigned successfully!

Epic #${epic.ref}: ${epic.subject}
Assigned to: ${epic.assigned_to_extra_info?.full_name || userId}
`,
            },
          ],
        };
      } catch (error) {
        throw new Error(`Failed to assign epic: ${error.message}`);
      }
    }
  );

  // Unassign epic
  server.tool(
    "taiga_unassignEpic",
    "Unassign an epic from its current user",
    {
      epicId: z.number().describe("Epic ID"),
    },
    async ({ epicId }) => {
      try {
        const epic = await epicService.unassignEpicFromUser(epicId);
        return {
          content: [
            {
              type: "text",
              text: `Epic unassigned successfully!

Epic #${epic.ref}: ${epic.subject}
Status: Unassigned
`,
            },
          ],
        };
      } catch (error) {
        throw new Error(`Failed to unassign epic: ${error.message}`);
      }
    }
  );
}
