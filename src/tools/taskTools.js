import { z } from "zod";
import { projectService } from "../services/projectServices.js";
import { userStoryService } from "../services/userStoryServices.js";
import { taskService } from "../services/taskServices.js";

/**
 * Register task tools
 * @param {McpServer} server - The MCP server instance
 * @param {TaigaService} taigaService - The Taiga service instance
 */
export function registerTaskTools(server) {
  // Add tool for creating a task
  server.tool(
    "taiga_createTask",
    "Create a new task associated with a user story with optional description, status, and tags",
    {
      projectIdentifier: z.string().describe("Project ID or slug"),
      userStoryIdentifier: z
        .string()
        .describe("User story ID or reference number"),
      subject: z.string().describe("Task title/subject"),
      description: z.string().optional().describe("Task description"),
      status: z
        .string()
        .optional()
        .describe('Status name (e.g., "New", "In progress")'),
      tags: z.array(z.string()).optional().describe("Array of tags"),
    },
    async ({
      projectIdentifier,
      userStoryIdentifier,
      subject,
      description,
      status,
      tags,
    }) => {
      try {
        // Get project ID if a slug was provided
        let projectId = projectIdentifier;
        if (isNaN(projectIdentifier)) {
          const project = await projectService.getProjectBySlug(
            projectIdentifier
          );
          projectId = project.id;
        }

        // Get user story ID if a reference number was provided        let userStoryId = userStoryIdentifier;
        if (userStoryIdentifier.startsWith("#")) {
          // Remove the # prefix
          const refNumber = userStoryIdentifier.substring(1); // Get all user stories for the project
          const userStories = await userStoryService.listUserStories(projectId);
          // Find the user story with the matching reference number
          const userStory = userStories.find(
            (us) => us.ref.toString() === refNumber
          );
          if (userStory) {
            userStoryId = userStory.id;
          } else {
            throw new Error(
              `User story with reference #${refNumber} not found`
            );
          }
        }

        // Get status ID if a status name was provided
        let statusId = undefined;
        if (status) {
          const statuses = await taskService.getTaskStatuses(projectId);
          const matchingStatus = statuses.find(
            (s) => s.name.toLowerCase() === status.toLowerCase()
          );

          if (matchingStatus) {
            statusId = matchingStatus.id;
          }
        }

        // Create the task
        const taskData = {
          project: projectId,
          user_story: userStoryId,
          subject,
          description,
          status: statusId,
          tags,
        };

        const createdTask = await taskService.createTask(taskData);

        return {
          content: [
            {
              type: "text",
              text: `Task created successfully!

Subject: ${createdTask.subject}
Reference: #${createdTask.ref}
Status: ${createdTask.status_extra_info?.name || "Default status"}
Project: ${createdTask.project_extra_info?.name}
User Story: #${createdTask.user_story_extra_info?.ref} - ${
                createdTask.user_story_extra_info?.subject
              }
            `,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Failed to create task: ${error.message}`,
            },
          ],
        };
      }
    }
  );

  // Add tool for listing tasks
  server.tool(
    "taiga_listTasks",
    "List all tasks for a specific project",
    {
      projectIdentifier: z.string().describe("Project ID or slug"),
      userStoryId: z.string().optional().describe("Filter by user story ID"),
      assignedTo: z.string().optional().describe("Filter by assigned user ID"),
      status: z.string().optional().describe("Filter by status name"),
    },
    async ({ projectIdentifier, userStoryId, assignedTo, status }) => {
      try {
        let projectId = projectIdentifier;
        if (isNaN(projectIdentifier)) {
          const project = await projectService.getProjectBySlug(
            projectIdentifier
          );
          projectId = project.id;
        }

        const filters = {};
        if (userStoryId) filters.user_story = userStoryId;
        if (assignedTo) filters.assigned_to = assignedTo;
        if (status) filters.status = status;

        const tasks = await taskService.listTasks(projectId, filters);

        if (tasks.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: "No tasks found in this project.",
              },
            ],
          };
        }

        return {
          content: [
            {
              type: "text",
              text: `Tasks in Project:

${tasks
  .map(
    (task) =>
      `- #${task.ref}: ${task.subject} (Status: ${
        task.status_extra_info?.name || "Unknown"
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
              text: `Failed to list tasks: ${error.message}`,
            },
          ],
        };
      }
    }
  );

  // Get individual task details
  server.tool(
    "taiga_getTask",
    "Get details of a specific task by ID",
    {
      taskId: z.number().describe("Task ID"),
    },
    async ({ taskId }) => {
      try {
        const task = await taskService.getTask(taskId);

        return {
          content: [
            {
              type: "text",
              text: `Task Details:
ID: ${task.id}
Subject: ${task.subject}
Description: ${task.description || "No description"}
Status: ${task.status_extra_info?.name || "Unknown"}
Assigned to: ${task.assigned_to_extra_info?.full_name || "Unassigned"}
Project: ${task.project_extra_info?.name || "Unknown"}
User Story: ${task.user_story_extra_info?.subject || "None"}
Created: ${task.created_date}
Modified: ${task.modified_date}
Due Date: ${task.due_date || "No due date"}
Watchers: ${task.watchers?.length || 0}`,
            },
          ],
        };
      } catch (error) {
        throw new Error(`Failed to get task: ${error.message}`);
      }
    }
  );

  // Update task
  server.tool(
    "taiga_updateTask",
    "Update an existing task",
    {
      taskId: z.number().describe("Task ID to update"),
      subject: z.string().optional().describe("New task subject"),
      description: z.string().optional().describe("New task description"),
      statusName: z.string().optional().describe("New status name"),
      assignedTo: z.number().optional().describe("User ID to assign task to"),
      dueDate: z.string().optional().describe("Due date (YYYY-MM-DD format)"),
    },
    async ({
      taskId,
      subject,
      description,
      statusName,
      assignedTo,
      dueDate,
    }) => {
      try {
        const updateData = {};

        if (subject !== undefined) updateData.subject = subject;
        if (description !== undefined) updateData.description = description;
        if (assignedTo !== undefined) updateData.assigned_to = assignedTo;
        if (dueDate !== undefined) updateData.due_date = dueDate; // Handle status name to ID conversion if provided
        if (statusName) {
          // We need to get the task first to know which project it belongs to
          const task = await taskService.getTask(taskId);
          const statuses = await taskService.getTaskStatuses(task.project);
          const matchingStatus = statuses.find(
            (s) => s.name.toLowerCase() === statusName.toLowerCase()
          );

          if (matchingStatus) {
            updateData.status = matchingStatus.id;
          }
        }

        const updatedTask = await taskService.updateTask(taskId, updateData);

        return {
          content: [
            {
              type: "text",
              text: `Task updated successfully:
ID: ${updatedTask.id}
Subject: ${updatedTask.subject}
Status: ${updatedTask.status_extra_info?.name || "Unknown"}
Assigned to: ${updatedTask.assigned_to_extra_info?.full_name || "Unassigned"}`,
            },
          ],
        };
      } catch (error) {
        throw new Error(`Failed to update task: ${error.message}`);
      }
    }
  );

  // Delete task
  server.tool(
    "taiga_deleteTask",
    "Delete a task",
    {
      taskId: z.number().describe("Task ID to delete"),
    },
    async ({ taskId }) => {
      try {
        await taskService.deleteTask(taskId);

        return {
          content: [
            {
              type: "text",
              text: `Task ${taskId} has been deleted successfully.`,
            },
          ],
        };
      } catch (error) {
        throw new Error(`Failed to delete task: ${error.message}`);
      }
    }
  );

  // Assign task to user
  server.tool(
    "taiga_assignTask",
    "Assign a task to a user",
    {
      taskId: z.number().describe("Task ID"),
      userId: z.number().describe("User ID to assign the task to"),
    },
    async ({ taskId, userId }) => {
      try {
        await taskService.assignTaskToUser(taskId, userId);

        return {
          content: [
            {
              type: "text",
              text: `Task ${taskId} has been assigned to user ${userId}.`,
            },
          ],
        };
      } catch (error) {
        throw new Error(`Failed to assign task: ${error.message}`);
      }
    }
  );

  // Unassign task from user
  server.tool(
    "taiga_unassignTask",
    "Unassign a task from its current user",
    {
      taskId: z.number().describe("Task ID"),
    },
    async ({ taskId }) => {
      try {
        await taskService.unassignTaskFromUser(taskId);

        return {
          content: [
            {
              type: "text",
              text: `Task ${taskId} has been unassigned.`,
            },
          ],
        };
      } catch (error) {
        throw new Error(`Failed to unassign task: ${error.message}`);
      }
    }
  );

  // Add tool for getting task statuses
  server.tool(
    "taiga_getTaskStatuses",
    "Get all available task statuses for a project",
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

        const statuses = await taskService.getTaskStatuses(projectId);

        return {
          content: [
            {
              type: "text",
              text: `Task Statuses for Project:

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
              text: `Failed to get task statuses: ${error.message}`,
            },
          ],
        };
      }
    }
  );
}
