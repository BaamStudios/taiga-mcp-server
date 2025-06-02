import { z } from "zod";
import { projectService } from "../services/projectServices.js";
import { userStoryService } from "../services/userStoryServices.js";

/**
 * Register user story tools
 * @param {McpServer} server - The MCP server instance
 * @param {TaigaService} taigaService - The Taiga service instance
 */
export function registerUserStoryTools(server) {
  // Add tool for creating a user story
  server.tool(
    "taiga_createUserStory",
    "Create a new user story in a project with optional description, status, and tags",
    {
      projectIdentifier: z.string().describe("Project ID or slug"),
      subject: z.string().describe("User story title/subject"),
      description: z.string().optional().describe("User story description"),
      status: z
        .string()
        .optional()
        .describe('Status name (e.g., "New", "In progress")'),
      tags: z.array(z.string()).optional().describe("Array of tags"),
    },
    async ({ projectIdentifier, subject, description, status, tags }) => {
      try {
        // Get project ID if a slug was provided
        let projectId = projectIdentifier;
        if (isNaN(projectIdentifier)) {
          const project = await projectService.getProjectBySlug(
            projectIdentifier
          );
          projectId = project.id;
        } // Get status ID if a status name was provided
        let statusId = undefined;
        if (status) {
          const statuses = await userStoryService.getUserStoryStatuses(
            projectId
          );
          const matchingStatus = statuses.find(
            (s) => s.name.toLowerCase() === status.toLowerCase()
          );

          if (matchingStatus) {
            statusId = matchingStatus.id;
          }
        }

        // Create the user story
        const userStoryData = {
          project: projectId,
          subject,
          description,
          status: statusId,
          tags,
        };

        const createdStory = await userStoryService.createUserStory(
          userStoryData
        );

        return {
          content: [
            {
              type: "text",
              text: `User story created successfully!

Subject: ${createdStory.subject}
Reference: #${createdStory.ref}
Status: ${createdStory.status_extra_info?.name || "Default status"}
Project: ${createdStory.project_extra_info?.name}
            `,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Failed to create user story: ${error.message}`,
            },
          ],
        };
      }
    }
  );

  // Add tool for listing user stories in a project
  server.tool(
    "taiga_listUserStories",
    "List all user stories for a specific project",
    {
      projectIdentifier: z.string().describe("Project ID or slug"),
    },
    async ({ projectIdentifier }) => {
      try {
        // Get project ID if a slug was provided        let projectId = projectIdentifier;
        if (isNaN(projectIdentifier)) {
          const project = await projectService.getProjectBySlug(
            projectIdentifier
          );
          projectId = project.id;
        }

        const userStories = await userStoryService.listUserStories(projectId);

        if (userStories.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: "No user stories found in this project.",
              },
            ],
          };
        }

        return {
          content: [
            {
              type: "text",
              text: `User Stories in Project:

${userStories
  .map(
    (us) =>
      `- #${us.ref}: ${us.subject} (Status: ${
        us.status_extra_info?.name || "Unknown"
      })`
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
              text: `Failed to list user stories: ${error.message}`,
            },
          ],
        };
      }
    }
  );

  // Add tool for getting a specific user story
  server.tool(
    "taiga_getUserStory",
    "Get details of a specific user story by ID",
    {
      userStoryId: z.number().describe("User story ID"),
    },
    async ({ userStoryId }) => {
      try {
        const userStory = await userStoryService.getUserStory(userStoryId);

        return {
          content: [
            {
              type: "text",
              text: `User Story Details:

ID: ${userStory.id}
Reference: #${userStory.ref}
Subject: ${userStory.subject}
Description: ${userStory.description || "No description"}
Status: ${userStory.status_extra_info?.name || "Unknown"}
Project: ${userStory.project_extra_info?.name}
Assigned To: ${userStory.assigned_to_extra_info?.full_name || "Unassigned"}
Points: ${userStory.total_points || "Not estimated"}
Created: ${new Date(userStory.created_date).toLocaleDateString()}
Modified: ${new Date(userStory.modified_date).toLocaleDateString()}
Tags: ${userStory.tags?.join(", ") || "No tags"}
              `,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Failed to get user story: ${error.message}`,
            },
          ],
        };
      }
    }
  );

  // Add tool for updating a user story
  server.tool(
    "taiga_updateUserStory",
    "Update an existing user story",
    {
      userStoryId: z.number().describe("User story ID to update"),
      subject: z.string().optional().describe("New user story subject"),
      description: z.string().optional().describe("New user story description"),
      statusName: z.string().optional().describe("New status name"),
      assignedTo: z.number().optional().describe("User ID to assign story to"),
      points: z.number().optional().describe("Story points"),
      tags: z.array(z.string()).optional().describe("Array of tags"),
    },
    async ({
      userStoryId,
      subject,
      description,
      statusName,
      assignedTo,
      points,
      tags,
    }) => {
      try {
        // Build update data object
        const updateData = {};
        if (subject !== undefined) updateData.subject = subject;
        if (description !== undefined) updateData.description = description;
        if (assignedTo !== undefined) updateData.assigned_to = assignedTo;
        if (points !== undefined) updateData.total_points = points;
        if (tags !== undefined) updateData.tags = tags;

        // Handle status name conversion to ID
        if (statusName !== undefined) {
          const userStory = await userStoryService.getUserStory(userStoryId);
          const statuses = await userStoryService.getUserStoryStatuses(
            userStory.project
          );
          const matchingStatus = statuses.find(
            (s) => s.name.toLowerCase() === statusName.toLowerCase()
          );

          if (matchingStatus) {
            updateData.status = matchingStatus.id;
          } else {
            throw new Error(`Status "${statusName}" not found`);
          }
        }

        const updatedStory = await userStoryService.updateUserStory(
          userStoryId,
          updateData
        );

        return {
          content: [
            {
              type: "text",
              text: `User story updated successfully!

ID: ${updatedStory.id}
Reference: #${updatedStory.ref}
Subject: ${updatedStory.subject}
Status: ${updatedStory.status_extra_info?.name || "Unknown"}
Assigned To: ${updatedStory.assigned_to_extra_info?.full_name || "Unassigned"}
Points: ${updatedStory.total_points || "Not estimated"}
              `,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Failed to update user story: ${error.message}`,
            },
          ],
        };
      }
    }
  );

  // Add tool for deleting a user story
  server.tool(
    "taiga_deleteUserStory",
    "Delete a user story",
    {
      userStoryId: z.number().describe("User story ID to delete"),
    },
    async ({ userStoryId }) => {
      try {
        await userStoryService.deleteUserStory(userStoryId);

        return {
          content: [
            {
              type: "text",
              text: `User story #${userStoryId} has been deleted successfully.`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Failed to delete user story: ${error.message}`,
            },
          ],
        };
      }
    }
  );

  // Add tool for assigning a user story to a user
  server.tool(
    "taiga_assignUserStory",
    "Assign a user story to a specific user",
    {
      userStoryId: z.number().describe("User story ID"),
      userId: z.number().describe("User ID to assign the story to"),
    },
    async ({ userStoryId, userId }) => {
      try {
        const updatedStory = await userStoryService.assignUserStoryToUser(
          userStoryId,
          userId
        );

        return {
          content: [
            {
              type: "text",
              text: `User story assigned successfully!

Story: #${updatedStory.ref} - ${updatedStory.subject}
Assigned To: ${updatedStory.assigned_to_extra_info?.full_name || "Unknown user"}
              `,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Failed to assign user story: ${error.message}`,
            },
          ],
        };
      }
    }
  );

  // Add tool for unassigning a user story
  server.tool(
    "taiga_unassignUserStory",
    "Unassign a user story from its current user",
    {
      userStoryId: z.number().describe("User story ID"),
    },
    async ({ userStoryId }) => {
      try {
        const updatedStory = await userStoryService.unassignUserStoryFromUser(
          userStoryId
        );

        return {
          content: [
            {
              type: "text",
              text: `User story unassigned successfully!

Story: #${updatedStory.ref} - ${updatedStory.subject}
Status: Now unassigned
              `,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Failed to unassign user story: ${error.message}`,
            },
          ],
        };
      }
    }
  );

  // Add tool for getting user story statuses
  server.tool(
    "taiga_getUserStoryStatuses",
    "Get all available user story statuses for a project",
    {
      projectIdentifier: z.string().describe("Project ID or slug"),
    },
    async ({ projectIdentifier }) => {
      try {
        // Get project ID if a slug was provided
        let projectId = projectIdentifier;
        if (isNaN(projectIdentifier)) {
          const project = await projectService.getProjectBySlug(
            projectIdentifier
          );
          projectId = project.id;
        }

        const statuses = await userStoryService.getUserStoryStatuses(projectId);

        return {
          content: [
            {
              type: "text",
              text: `User Story Statuses for Project:

${statuses
  .map(
    (status) =>
      `- ${status.name} (ID: ${status.id})${
        status.is_closed ? " [Closed]" : ""
      }`
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
              text: `Failed to get user story statuses: ${error.message}`,
            },
          ],
        };
      }
    }
  );
}
