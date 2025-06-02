import { z } from "zod";
import { projectService } from "../services/projectServices.js";

/**
 * Register project tools
 * @param {McpServer} server - The MCP server instance
 * @param {TaigaService} taigaService - The Taiga service instance
 */
export function registerProjectTools(server) {
  // Add tool for listing projects
  server.tool(
    "taiga_listProjects",
    "Get a list of all projects the user has access to",
    {},
    async () => {
      try {
        const projects = await projectService.listProjects();

        return {
          content: [
            {
              type: "text",
              text: `Your Taiga Projects:\n\n${projects
                .map((p) => `- ${p.name} (ID: ${p.id}, Slug: ${p.slug})`)
                .join("\n")}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Failed to list projects: ${error.message}`,
            },
          ],
        };
      }
    }
  );

  // Add tool for getting project details
  server.tool(
    "taiga_getProject",
    "Get details of a specific project by ID or slug",
    {
      projectIdentifier: z.string().describe("Project ID or slug"),
    },
    async ({ projectIdentifier }) => {
      try {
        let project; // Try to get project by ID first
        if (!isNaN(projectIdentifier)) {
          try {
            project = await projectService.getProject(projectIdentifier);
          } catch (error) {
            // If getting by ID fails, try by slug
            project = await projectService.getProjectBySlug(projectIdentifier);
          }
        } else {
          // If it's not a number, try by slug
          project = await projectService.getProjectBySlug(projectIdentifier);
        }

        return {
          content: [
            {
              type: "text",
              text: `Project Details:

Name: ${project.name}
ID: ${project.id}
Slug: ${project.slug}
Description: ${project.description || "No description"}
Created: ${new Date(project.created_date).toLocaleString()}
Total Members: ${project.total_memberships}
            `,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Failed to get project details: ${error.message}`,
            },
          ],
        };
      }
    }
  );

  // Add tool for creating a project
  server.tool(
    "taiga_createProject",
    "Create a new project with name and description",
    {
      name: z.string().describe("Project name"),
      description: z.string().describe("Project description"),
      isPrivate: z
        .boolean()
        .optional()
        .describe("Whether the project is private (default: false)"),
    },
    async ({ name, description, isPrivate = false }) => {
      try {
        const projectData = {
          name,
          description,
          is_private: isPrivate,
        };
        const createdProject = await projectService.createProject(projectData);

        return {
          content: [
            {
              type: "text",
              text: `Project created successfully!

Name: ${createdProject.name}
ID: ${createdProject.id}
Slug: ${createdProject.slug}
Description: ${createdProject.description}
Private: ${createdProject.is_private ? "Yes" : "No"}
            `,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Failed to create project: ${error.message}`,
            },
          ],
        };
      }
    }
  );

  // Add tool for updating a project
  server.tool(
    "taiga_updateProject",
    "Update an existing project",
    {
      projectIdentifier: z.string().describe("Project ID or slug"),
      name: z.string().optional().describe("New project name"),
      description: z.string().optional().describe("New project description"),
      isPrivate: z
        .boolean()
        .optional()
        .describe("Whether the project is private"),
    },
    async ({ projectIdentifier, name, description, isPrivate }) => {
      try {
        let projectId = projectIdentifier;
        if (isNaN(projectIdentifier)) {
          const project = await projectService.getProjectBySlug(
            projectIdentifier
          );
          projectId = project.id;
        }

        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (description !== undefined) updateData.description = description;
        if (isPrivate !== undefined) updateData.is_private = isPrivate;

        const updatedProject = await projectService.updateProject(
          projectId,
          updateData
        );

        return {
          content: [
            {
              type: "text",
              text: `Project updated successfully!

Name: ${updatedProject.name}
ID: ${updatedProject.id}
Slug: ${updatedProject.slug}
Description: ${updatedProject.description}
Private: ${updatedProject.is_private ? "Yes" : "No"}
            `,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Failed to update project: ${error.message}`,
            },
          ],
        };
      }
    }
  );

  // Add tool for deleting a project
  server.tool(
    "taiga_deleteProject",
    "Delete a project (IRREVERSIBLE)",
    {
      projectIdentifier: z.string().describe("Project ID or slug"),
      confirm: z
        .boolean()
        .describe("Confirmation that you want to delete the project"),
    },
    async ({ projectIdentifier, confirm }) => {
      try {
        if (!confirm) {
          return {
            content: [
              {
                type: "text",
                text: "Project deletion cancelled. Please set 'confirm' to true to proceed with deletion.",
              },
            ],
          };
        }
        let projectId = projectIdentifier;
        if (isNaN(projectIdentifier)) {
          const project = await projectService.getProjectBySlug(
            projectIdentifier
          );
          projectId = project.id;
        }

        await projectService.deleteProject(projectId);

        return {
          content: [
            {
              type: "text",
              text: `Project ${projectIdentifier} has been permanently deleted.`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Failed to delete project: ${error.message}`,
            },
          ],
        };
      }
    }
  );

  // Add tool for getting project by slug
  server.tool(
    "taiga_getProjectBySlug",
    "Get project details specifically by slug (useful when you only have the slug)",
    {
      slug: z.string().describe("Project slug"),
    },
    async ({ slug }) => {
      try {
        const project = await projectService.getProjectBySlug(slug);

        return {
          content: [
            {
              type: "text",
              text: `Project Details (by slug):

Name: ${project.name}
ID: ${project.id}
Slug: ${project.slug}
Description: ${project.description || "No description"}
Created: ${new Date(project.created_date).toLocaleDateString()}
Modified: ${new Date(project.modified_date).toLocaleDateString()}
Owner: ${project.owner?.full_name || "Unknown"}
Is Private: ${project.is_private ? "Yes" : "No"}
Total Milestones: ${project.total_milestones || 0}
Total Story Points: ${project.total_story_points || 0}
              `,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Failed to get project by slug: ${error.message}`,
            },
          ],
        };
      }
    }
  );

  // Search project
  server.tool(
    "taiga_searchProject",
    "Search for items within a project",
    {
      projectId: z
        .union([z.string(), z.number()])
        .describe("Project ID or slug"),
      searchText: z.string().describe("Text to search for"),
    },
    async ({ projectId, searchText }) => {
      try {
        // Resolve project ID if slug is provided
        let resolvedProjectId = projectId;
        if (typeof projectId === "string" && isNaN(Number(projectId))) {
          const project = await projectService.getProjectBySlug(projectId);
          resolvedProjectId = project.id;
        }

        const results = await projectService.searchProject(
          resolvedProjectId,
          searchText
        );

        let output = `Search Results for "${searchText}":\n\n`;

        // Format user stories
        if (results.userstories && results.userstories.length > 0) {
          output += `User Stories:\n${results.userstories
            .map((us) => `- #${us.ref}: ${us.subject}`)
            .join("\n")}\n\n`;
        }

        // Format tasks
        if (results.tasks && results.tasks.length > 0) {
          output += `Tasks:\n${results.tasks
            .map((task) => `- #${task.ref}: ${task.subject}`)
            .join("\n")}\n\n`;
        }

        // Format issues
        if (results.issues && results.issues.length > 0) {
          output += `Issues:\n${results.issues
            .map((issue) => `- #${issue.ref}: ${issue.subject}`)
            .join("\n")}\n\n`;
        }

        // Format epics
        if (results.epics && results.epics.length > 0) {
          output += `Epics:\n${results.epics
            .map((epic) => `- #${epic.ref}: ${epic.subject}`)
            .join("\n")}\n\n`;
        }

        // Format wiki pages
        if (results.wikipages && results.wikipages.length > 0) {
          output += `Wiki Pages:\n${results.wikipages
            .map((page) => `- ${page.slug}`)
            .join("\n")}\n\n`;
        }

        if (output === `Search Results for "${searchText}":\n\n`) {
          output = "No results found for your search.";
        }

        return {
          content: [
            {
              type: "text",
              text: output,
            },
          ],
        };
      } catch (error) {
        throw new Error(`Failed to search project: ${error.message}`);
      }
    }
  );

  // Export project
  server.tool(
    "taiga_exportProject",
    "Export project data (async operation)",
    {
      projectId: z
        .union([z.string(), z.number()])
        .describe("Project ID or slug"),
    },
    async ({ projectId }) => {
      try {
        // Resolve project ID if slug is provided        let resolvedProjectId = projectId;
        if (typeof projectId === "string" && isNaN(Number(projectId))) {
          const project = await projectService.getProjectBySlug(projectId);
          resolvedProjectId = project.id;
        }

        const exportResult = await projectService.exportProject(
          resolvedProjectId
        );

        return {
          content: [
            {
              type: "text",
              text: `Project export initiated:
Export ID: ${exportResult.export_id || "N/A"}
Status: ${exportResult.status || "Started"}

Use the export ID with taiga_getExportStatus to check progress.`,
            },
          ],
        };
      } catch (error) {
        throw new Error(`Failed to export project: ${error.message}`);
      }
    }
  );

  // Get export status
  server.tool(
    "taiga_getExportStatus",
    "Check the status of a project export",
    {
      exportId: z.string().describe("Export ID returned from export operation"),
    },
    async ({ exportId }) => {
      try {
        const status = await projectService.getExportStatus(exportId);

        return {
          content: [
            {
              type: "text",
              text: `Export Status:
Export ID: ${exportId}
Status: ${status.status || "Unknown"}
${status.url ? `Download URL: ${status.url}` : ""}
${status.error ? `Error: ${status.error}` : ""}`,
            },
          ],
        };
      } catch (error) {
        throw new Error(`Failed to get export status: ${error.message}`);
      }
    }
  );

  // Invite user to project
  server.tool(
    "taiga_inviteProjectUser",
    "Invite a user to join a project",
    {
      projectId: z
        .union([z.string(), z.number()])
        .describe("Project ID or slug"),
      email: z.string().email().describe("Email address of the user to invite"),
      roleId: z.number().describe("Role ID for the user in the project"),
    },
    async ({ projectId, email, roleId }) => {
      try {
        // Resolve project ID if slug is provided
        let resolvedProjectId = projectId;
        if (typeof projectId === "string" && isNaN(Number(projectId))) {
          const project = await projectService.getProjectBySlug(projectId);
          resolvedProjectId = project.id;
        }

        const invitation = await projectService.inviteProjectUser(
          resolvedProjectId,
          email,
          roleId
        );

        return {
          content: [
            {
              type: "text",
              text: `User invitation sent:
Email: ${email}
Project: ${invitation.project_name || "Unknown"}
Role: ${invitation.role_name || "Unknown"}
Status: Invitation sent`,
            },
          ],
        };
      } catch (error) {
        throw new Error(`Failed to invite user to project: ${error.message}`);
      }
    }
  );
  // Add tool for getting project statistics
  server.tool(
    "taiga_getProjectStats",
    "Get statistics for a specific project",
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

        const stats = await projectService.getProjectStats(projectId);

        return {
          content: [
            {
              type: "text",
              text: `Project Statistics:

Total User Stories: ${stats.total_story_points || 0}
Completed User Stories: ${stats.completed_story_points || 0}
Total Tasks: ${stats.total_tasks || 0}
Completed Tasks: ${stats.completed_tasks || 0}
Total Issues: ${stats.total_issues || 0}
Closed Issues: ${stats.closed_issues || 0}
Total Milestones: ${stats.total_milestones || 0}
            `,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Failed to get project statistics: ${error.message}`,
            },
          ],
        };
      }
    }
  );
}
