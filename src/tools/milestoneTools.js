import { z } from "zod";
import { projectService } from "../services/projectServices.js";
import { milestoneService } from "../services/milestoneServices.js";

/**
 * Register milestone management tools
 * @param {McpServer} server - The MCP server instance
 */
export function registerMilestoneTools(server) {
  // List milestones
  server.tool(
    "taiga_listMilestones",
    "List all milestones (sprints) for a specific project",
    {
      projectIdentifier: z.string().describe("Project ID or slug"),
      closed: z
        .boolean()
        .optional()
        .describe("Filter by closed status (true for closed, false for open)"),
    },
    async ({ projectIdentifier, closed }) => {
      try {
        // Resolve project ID if slug is provided
        let resolvedProjectId = projectIdentifier;
        if (isNaN(Number(projectIdentifier))) {
          const project = await projectService.getProjectBySlug(
            projectIdentifier
          );
          resolvedProjectId = project.id;
        }

        const milestones = await milestoneService.listMilestones(
          resolvedProjectId
        );

        // Filter by closed status if specified
        const filteredMilestones =
          closed !== undefined
            ? milestones.filter((m) => m.closed === closed)
            : milestones;

        return {
          content: [
            {
              type: "text",
              text: `Milestones for project ${projectIdentifier}:

${filteredMilestones
  .map(
    (milestone) =>
      `Milestone: ${milestone.name}
  - ID: ${milestone.id}
  - Status: ${milestone.closed ? "CLOSED" : "OPEN"}
  - Start: ${milestone.estimated_start || "Not set"}
  - Finish: ${milestone.estimated_finish || "Not set"}
  - Created: ${milestone.created_date}
  ${
    milestone.user_stories?.length
      ? `- User Stories: ${milestone.user_stories.length}`
      : ""
  }
  ${
    milestone.total_points !== undefined
      ? `- Total Points: ${milestone.total_points}`
      : ""
  }
  ${
    milestone.closed_points !== undefined
      ? `- Closed Points: ${milestone.closed_points}`
      : ""
  }
`
  )
  .join("\n")}

Total: ${filteredMilestones.length} milestone(s)${
                closed !== undefined ? ` (${closed ? "closed" : "open"})` : ""
              }`,
            },
          ],
        };
      } catch (error) {
        throw new Error(`Failed to list milestones: ${error.message}`);
      }
    }
  );

  // Get milestone
  server.tool(
    "taiga_getMilestone",
    "Get details of a specific milestone by ID",
    {
      milestoneId: z.number().describe("Milestone ID"),
    },
    async ({ milestoneId }) => {
      try {
        const milestone = await milestoneService.getMilestone(milestoneId);
        return {
          content: [
            {
              type: "text",
              text: `Milestone Details:

${milestone.name}
Project: ${milestone.project_extra_info?.name || milestone.project}
Status: ${milestone.closed ? "CLOSED" : "OPEN"}
Start Date: ${milestone.estimated_start || "Not set"}
Finish Date: ${milestone.estimated_finish || "Not set"}
Created: ${milestone.created_date}
Modified: ${milestone.modified_date}

Progress:
- Total Points: ${milestone.total_points || 0}
- Closed Points: ${milestone.closed_points || 0}
- User Stories: ${milestone.user_stories?.length || 0}
- Tasks: ${milestone.total_tasks || 0}
- Closed Tasks: ${milestone.closed_tasks || 0}

${milestone.disponibility ? `Disponibility: ${milestone.disponibility}` : ""}
${milestone.slug ? `Slug: ${milestone.slug}` : ""}
`,
            },
          ],
        };
      } catch (error) {
        throw new Error(`Failed to get milestone: ${error.message}`);
      }
    }
  );

  // Create milestone
  server.tool(
    "taiga_createMilestone",
    "Create a new milestone (sprint) in a project",
    {
      projectIdentifier: z.string().describe("Project ID or slug"),
      name: z.string().describe("Milestone name"),
      estimatedStart: z.string().describe("Start date (YYYY-MM-DD format)"),
      estimatedFinish: z.string().describe("Finish date (YYYY-MM-DD format)"),
      disponibility: z
        .number()
        .optional()
        .describe("Disponibility percentage (0-100)"),
    },
    async ({
      projectIdentifier,
      name,
      estimatedStart,
      estimatedFinish,
      disponibility,
    }) => {
      try {
        // Resolve project ID if slug is provided
        let resolvedProjectId = projectIdentifier;
        if (isNaN(Number(projectIdentifier))) {
          const project = await projectService.getProjectBySlug(
            projectIdentifier
          );
          resolvedProjectId = project.id;
        }

        const milestoneData = {
          project: resolvedProjectId,
          name,
          estimated_start: estimatedStart,
          estimated_finish: estimatedFinish,
          ...(disponibility !== undefined && { disponibility }),
        };

        const milestone = await milestoneService.createMilestone(milestoneData);
        return {
          content: [
            {
              type: "text",
              text: `Milestone created successfully!

${milestone.name}
Project: ${milestone.project_extra_info?.name || milestone.project}
Status: ${milestone.closed ? "CLOSED" : "OPEN"}
Start Date: ${milestone.estimated_start}
Finish Date: ${milestone.estimated_finish}
Created: ${milestone.created_date}
${milestone.disponibility ? `Disponibility: ${milestone.disponibility}%` : ""}
${milestone.slug ? `Slug: ${milestone.slug}` : ""}
`,
            },
          ],
        };
      } catch (error) {
        throw new Error(`Failed to create milestone: ${error.message}`);
      }
    }
  );

  // Update milestone
  server.tool(
    "taiga_updateMilestone",
    "Update an existing milestone",
    {
      milestoneId: z.number().describe("Milestone ID to update"),
      name: z.string().optional().describe("New milestone name"),
      estimatedStart: z
        .string()
        .optional()
        .describe("New start date (YYYY-MM-DD format)"),
      estimatedFinish: z
        .string()
        .optional()
        .describe("New finish date (YYYY-MM-DD format)"),
      disponibility: z
        .number()
        .optional()
        .describe("New disponibility percentage (0-100)"),
      closed: z
        .boolean()
        .optional()
        .describe("Whether to close/open the milestone"),
    },
    async ({
      milestoneId,
      name,
      estimatedStart,
      estimatedFinish,
      disponibility,
      closed,
    }) => {
      try {
        const updateData = {};
        if (name) updateData.name = name;
        if (estimatedStart) updateData.estimated_start = estimatedStart;
        if (estimatedFinish) updateData.estimated_finish = estimatedFinish;
        if (disponibility !== undefined)
          updateData.disponibility = disponibility;
        if (closed !== undefined) updateData.closed = closed;

        const milestone = await milestoneService.updateMilestone(
          milestoneId,
          updateData
        );
        return {
          content: [
            {
              type: "text",
              text: `Milestone updated successfully!

${milestone.name}
Project: ${milestone.project_extra_info?.name || milestone.project}
Status: ${milestone.closed ? "CLOSED" : "OPEN"}
Start Date: ${milestone.estimated_start || "Not set"}
Finish Date: ${milestone.estimated_finish || "Not set"}
Modified: ${milestone.modified_date}
${milestone.disponibility ? `Disponibility: ${milestone.disponibility}%` : ""}

Progress:
- Total Points: ${milestone.total_points || 0}
- Closed Points: ${milestone.closed_points || 0}
- User Stories: ${milestone.user_stories?.length || 0}
`,
            },
          ],
        };
      } catch (error) {
        throw new Error(`Failed to update milestone: ${error.message}`);
      }
    }
  );

  // Delete milestone
  server.tool(
    "taiga_deleteMilestone",
    "Delete a milestone",
    {
      milestoneId: z.number().describe("Milestone ID to delete"),
    },
    async ({ milestoneId }) => {
      try {
        await milestoneService.deleteMilestone(milestoneId);
        return {
          content: [
            {
              type: "text",
              text: `Milestone ${milestoneId} deleted successfully.`,
            },
          ],
        };
      } catch (error) {
        throw new Error(`Failed to delete milestone: ${error.message}`);
      }
    }
  );

  // Close milestone
  server.tool(
    "taiga_closeMilestone",
    "Close a milestone (sprint)",
    {
      milestoneId: z.number().describe("Milestone ID to close"),
    },
    async ({ milestoneId }) => {
      try {
        const milestone = await milestoneService.updateMilestone(milestoneId, {
          closed: true,
        });
        return {
          content: [
            {
              type: "text",
              text: `Milestone closed successfully!

${milestone.name}
Status: CLOSED
Final Stats:
- Total Points: ${milestone.total_points || 0}
- Closed Points: ${milestone.closed_points || 0}
- Completion: ${
                milestone.total_points
                  ? Math.round(
                      (milestone.closed_points / milestone.total_points) * 100
                    )
                  : 0
              }%
`,
            },
          ],
        };
      } catch (error) {
        throw new Error(`Failed to close milestone: ${error.message}`);
      }
    }
  );

  // Reopen milestone
  server.tool(
    "taiga_reopenMilestone",
    "Reopen a closed milestone",
    {
      milestoneId: z.number().describe("Milestone ID to reopen"),
    },
    async ({ milestoneId }) => {
      try {
        const milestone = await milestoneService.updateMilestone(milestoneId, {
          closed: false,
        });
        return {
          content: [
            {
              type: "text",
              text: `Milestone reopened successfully!

${milestone.name}
Status: OPEN
Current Stats:
- Total Points: ${milestone.total_points || 0}
- Closed Points: ${milestone.closed_points || 0}
- Completion: ${
                milestone.total_points
                  ? Math.round(
                      (milestone.closed_points / milestone.total_points) * 100
                    )
                  : 0
              }%
`,
            },
          ],
        };
      } catch (error) {
        throw new Error(`Failed to reopen milestone: ${error.message}`);
      }
    }
  );

  // Get milestone statistics
  server.tool(
    "taiga_getMilestoneStats",
    "Get statistics for a specific milestone",
    {
      milestoneId: z.number().describe("Milestone ID"),
    },
    async ({ milestoneId }) => {
      try {
        const stats = await milestoneService.getMilestoneStats(milestoneId);

        return {
          content: [
            {
              type: "text",
              text: `Milestone Statistics:
Milestone ID: ${milestoneId}
Total Points: ${stats.total_points || 0}
Completed Points: ${stats.completed_points || 0}
Total User Stories: ${stats.total_userstories || 0}
Completed User Stories: ${stats.completed_userstories || 0}
Total Tasks: ${stats.total_tasks || 0}
Completed Tasks: ${stats.completed_tasks || 0}
Progress: ${stats.completed_points || 0}/${
                stats.total_points || 0
              } points (${Math.round(
                ((stats.completed_points || 0) / (stats.total_points || 1)) *
                  100
              )}%)`,
            },
          ],
        };
      } catch (error) {
        throw new Error(`Failed to get milestone statistics: ${error.message}`);
      }
    }
  );
}
