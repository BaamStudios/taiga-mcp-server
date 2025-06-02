import { z } from "zod";
import { projectService } from "../services/projectServices.js";
import { issueService } from "../services/issueServices.js";

/**
 * Register issue management tools
 * @param {McpServer} server - The MCP server instance
 */
export function registerIssueTools(server) {
  // List issues
  server.tool(
    "taiga_listIssues",
    "List all issues for a specific project",
    {
      projectIdentifier: z.string().describe("Project ID or slug"),
      status: z.string().optional().describe("Filter by status name"),
      assignedTo: z.string().optional().describe("Filter by assigned user ID"),
      priority: z.string().optional().describe("Filter by priority name"),
      severity: z.string().optional().describe("Filter by severity name"),
      type: z.string().optional().describe("Filter by issue type name"),
    },
    async ({
      projectIdentifier,
      status,
      assignedTo,
      priority,
      severity,
      type,
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

        const filters = {};
        if (status) filters.status = status;
        if (assignedTo) filters.assigned_to = assignedTo;
        if (priority) filters.priority = priority;
        if (severity) filters.severity = severity;
        if (type) filters.type = type;

        const issues = await issueService.listIssues(
          resolvedProjectId,
          filters
        );
        return {
          content: [
            {
              type: "text",
              text: `Issues for project ${projectIdentifier}:

${issues
  .map(
    (issue) =>
      `Issue #${issue.ref}: ${issue.subject}
  - Status: ${issue.status_extra_info?.name || "N/A"}
  - Priority: ${issue.priority_extra_info?.name || "N/A"}
  - Severity: ${issue.severity_extra_info?.name || "N/A"}
  - Type: ${issue.type_extra_info?.name || "N/A"}
  - Assigned to: ${issue.assigned_to_extra_info?.full_name || "Unassigned"}
  - Created: ${issue.created_date}
  ${
    issue.description
      ? `- Description: ${issue.description.substring(0, 100)}${
          issue.description.length > 100 ? "..." : ""
        }`
      : ""
  }
`
  )
  .join("\n")}

Total: ${issues.length} issue(s)`,
            },
          ],
        };
      } catch (error) {
        throw new Error(`Failed to list issues: ${error.message}`);
      }
    }
  );

  // Get issue
  server.tool(
    "taiga_getIssue",
    "Get details of a specific issue by ID",
    {
      issueId: z.number().describe("Issue ID"),
    },
    async ({ issueId }) => {
      try {
        const issue = await issueService.getIssue(issueId);
        return {
          content: [
            {
              type: "text",
              text: `Issue Details:

Issue #${issue.ref}: ${issue.subject}
Project: ${issue.project_extra_info?.name || issue.project}
Status: ${issue.status_extra_info?.name || "N/A"}
Priority: ${issue.priority_extra_info?.name || "N/A"}
Severity: ${issue.severity_extra_info?.name || "N/A"}
Type: ${issue.type_extra_info?.name || "N/A"}
Assigned to: ${issue.assigned_to_extra_info?.full_name || "Unassigned"}
Created: ${issue.created_date}
Modified: ${issue.modified_date}
${issue.due_date ? `Due Date: ${issue.due_date}` : "No due date"}

${issue.description ? `Description: ${issue.description}` : "No description"}

Tags: ${issue.tags?.join(", ") || "None"}
Watchers: ${issue.watchers?.length || 0}
`,
            },
          ],
        };
      } catch (error) {
        throw new Error(`Failed to get issue: ${error.message}`);
      }
    }
  );

  // Create issue
  server.tool(
    "taiga_createIssue",
    "Create a new issue in a project",
    {
      projectIdentifier: z.string().describe("Project ID or slug"),
      subject: z.string().describe("Issue subject/title"),
      description: z.string().optional().describe("Issue description"),
      priority: z.string().describe("Priority name"),
      severity: z.string().describe("Severity name"),
      type: z.string().describe("Issue type name"),
      assignedTo: z.number().optional().describe("User ID to assign issue to"),
      dueDate: z.string().optional().describe("Due date (YYYY-MM-DD format)"),
    },
    async ({
      projectIdentifier,
      subject,
      description,
      priority,
      severity,
      type,
      assignedTo,
      dueDate,
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

        const issueData = {
          project: resolvedProjectId,
          subject,
          priority,
          severity,
          type,
          ...(description && { description }),
          ...(assignedTo && { assigned_to: assignedTo }),
          ...(dueDate && { due_date: dueDate }),
        };

        const issue = await issueService.createIssue(issueData);
        return {
          content: [
            {
              type: "text",
              text: `Issue created successfully!

Issue #${issue.ref}: ${issue.subject}
Project: ${issue.project_extra_info?.name || issue.project}
Status: ${issue.status_extra_info?.name || "N/A"}
Priority: ${issue.priority_extra_info?.name || "N/A"}
Severity: ${issue.severity_extra_info?.name || "N/A"}
Type: ${issue.type_extra_info?.name || "N/A"}
Assigned to: ${issue.assigned_to_extra_info?.full_name || "Unassigned"}
Created: ${issue.created_date}
${issue.due_date ? `Due Date: ${issue.due_date}` : ""}
${issue.description ? `Description: ${issue.description}` : ""}
`,
            },
          ],
        };
      } catch (error) {
        throw new Error(`Failed to create issue: ${error.message}`);
      }
    }
  );

  // Update issue
  server.tool(
    "taiga_updateIssue",
    "Update an existing issue",
    {
      issueId: z.number().describe("Issue ID to update"),
      subject: z.string().optional().describe("New issue subject"),
      description: z.string().optional().describe("New issue description"),
      statusName: z.string().optional().describe("New status name"),
      priority: z.string().optional().describe("New priority name"),
      severity: z.string().optional().describe("New severity name"),
      type: z.string().optional().describe("New issue type name"),
      assignedTo: z.number().optional().describe("User ID to assign issue to"),
      dueDate: z.string().optional().describe("Due date (YYYY-MM-DD format)"),
    },
    async ({
      issueId,
      subject,
      description,
      statusName,
      priority,
      severity,
      type,
      assignedTo,
      dueDate,
    }) => {
      try {
        const updateData = {};
        if (subject) updateData.subject = subject;
        if (description) updateData.description = description;
        if (statusName) updateData.status = statusName;
        if (priority) updateData.priority = priority;
        if (severity) updateData.severity = severity;
        if (type) updateData.type = type;
        if (assignedTo) updateData.assigned_to = assignedTo;
        if (dueDate) updateData.due_date = dueDate;

        const issue = await issueService.updateIssue(issueId, updateData);
        return {
          content: [
            {
              type: "text",
              text: `Issue updated successfully!

Issue #${issue.ref}: ${issue.subject}
Project: ${issue.project_extra_info?.name || issue.project}
Status: ${issue.status_extra_info?.name || "N/A"}
Priority: ${issue.priority_extra_info?.name || "N/A"}
Severity: ${issue.severity_extra_info?.name || "N/A"}
Type: ${issue.type_extra_info?.name || "N/A"}
Assigned to: ${issue.assigned_to_extra_info?.full_name || "Unassigned"}
Modified: ${issue.modified_date}
${issue.due_date ? `Due Date: ${issue.due_date}` : ""}
${issue.description ? `Description: ${issue.description}` : ""}
`,
            },
          ],
        };
      } catch (error) {
        throw new Error(`Failed to update issue: ${error.message}`);
      }
    }
  );

  // Delete issue
  server.tool(
    "taiga_deleteIssue",
    "Delete an issue",
    {
      issueId: z.number().describe("Issue ID to delete"),
    },
    async ({ issueId }) => {
      try {
        await issueService.deleteIssue(issueId);
        return {
          content: [
            {
              type: "text",
              text: `Issue ${issueId} deleted successfully.`,
            },
          ],
        };
      } catch (error) {
        throw new Error(`Failed to delete issue: ${error.message}`);
      }
    }
  );

  // Assign issue
  server.tool(
    "taiga_assignIssue",
    "Assign an issue to a user",
    {
      issueId: z.number().describe("Issue ID"),
      userId: z.number().describe("User ID to assign the issue to"),
    },
    async ({ issueId, userId }) => {
      try {
        const issue = await issueService.assignIssueToUser(issueId, userId);
        return {
          content: [
            {
              type: "text",
              text: `Issue assigned successfully!

Issue #${issue.ref}: ${issue.subject}
Assigned to: ${issue.assigned_to_extra_info?.full_name || userId}
`,
            },
          ],
        };
      } catch (error) {
        throw new Error(`Failed to assign issue: ${error.message}`);
      }
    }
  );

  // Unassign issue
  server.tool(
    "taiga_unassignIssue",
    "Unassign an issue from its current user",
    {
      issueId: z.number().describe("Issue ID"),
    },
    async ({ issueId }) => {
      try {
        const issue = await issueService.unassignIssueFromUser(issueId);
        return {
          content: [
            {
              type: "text",
              text: `Issue unassigned successfully!

Issue #${issue.ref}: ${issue.subject}
Status: Unassigned
`,
            },
          ],
        };
      } catch (error) {
        throw new Error(`Failed to unassign issue: ${error.message}`);
      }
    }
  );

  // Get issue statuses
  server.tool(
    "taiga_getIssueStatuses",
    "Get all available issue statuses for a project",
    {
      projectIdentifier: z.string().describe("Project ID or slug"),
    },
    async ({ projectIdentifier }) => {
      try {
        // Resolve project ID if slug is provided
        let resolvedProjectId = projectIdentifier;
        if (isNaN(Number(projectIdentifier))) {
          const project = await projectService.getProjectBySlug(
            projectIdentifier
          );
          resolvedProjectId = project.id;
        }

        const statuses = await issueService.getIssueStatuses(resolvedProjectId);
        return {
          content: [
            {
              type: "text",
              text: `Issue Statuses for project ${projectIdentifier}:

${statuses
  .map(
    (status) =>
      `- ${status.name} (ID: ${status.id})${
        status.is_closed ? " [CLOSED]" : ""
      }`
  )
  .join("\n")}

Total: ${statuses.length} status(es)`,
            },
          ],
        };
      } catch (error) {
        throw new Error(`Failed to get issue statuses: ${error.message}`);
      }
    }
  );

  // Get issue priorities
  server.tool(
    "taiga_getIssuePriorities",
    "Get all available issue priorities for a project",
    {
      projectIdentifier: z.string().describe("Project ID or slug"),
    },
    async ({ projectIdentifier }) => {
      try {
        // Resolve project ID if slug is provided
        let resolvedProjectId = projectIdentifier;
        if (isNaN(Number(projectIdentifier))) {
          const project = await projectService.getProjectBySlug(
            projectIdentifier
          );
          resolvedProjectId = project.id;
        }

        const priorities = await issueService.getIssuePriorities(
          resolvedProjectId
        );
        return {
          content: [
            {
              type: "text",
              text: `Issue Priorities for project ${projectIdentifier}:

${priorities
  .map(
    (priority) =>
      `- ${priority.name} (ID: ${priority.id}) - Order: ${priority.order}`
  )
  .join("\n")}

Total: ${priorities.length} prioritie(s)`,
            },
          ],
        };
      } catch (error) {
        throw new Error(`Failed to get issue priorities: ${error.message}`);
      }
    }
  );

  // Get issue severities
  server.tool(
    "taiga_getIssueSeverities",
    "Get all available issue severities for a project",
    {
      projectIdentifier: z.string().describe("Project ID or slug"),
    },
    async ({ projectIdentifier }) => {
      try {
        // Resolve project ID if slug is provided
        let resolvedProjectId = projectIdentifier;
        if (isNaN(Number(projectIdentifier))) {
          const project = await projectService.getProjectBySlug(
            projectIdentifier
          );
          resolvedProjectId = project.id;
        }

        const severities = await issueService.getIssueSeverities(
          resolvedProjectId
        );
        return {
          content: [
            {
              type: "text",
              text: `Issue Severities for project ${projectIdentifier}:

${severities
  .map(
    (severity) =>
      `- ${severity.name} (ID: ${severity.id}) - Order: ${severity.order}`
  )
  .join("\n")}

Total: ${severities.length} severitie(s)`,
            },
          ],
        };
      } catch (error) {
        throw new Error(`Failed to get issue severities: ${error.message}`);
      }
    }
  );

  // Get issue types
  server.tool(
    "taiga_getIssueTypes",
    "Get all available issue types for a project",
    {
      projectIdentifier: z.string().describe("Project ID or slug"),
    },
    async ({ projectIdentifier }) => {
      try {
        // Resolve project ID if slug is provided
        let resolvedProjectId = projectIdentifier;
        if (isNaN(Number(projectIdentifier))) {
          const project = await projectService.getProjectBySlug(
            projectIdentifier
          );
          resolvedProjectId = project.id;
        }

        const types = await issueService.getIssueTypes(resolvedProjectId);
        return {
          content: [
            {
              type: "text",
              text: `Issue Types for project ${projectIdentifier}:

${types
  .map((type) => `- ${type.name} (ID: ${type.id}) - Order: ${type.order}`)
  .join("\n")}

Total: ${types.length} type(s)`,
            },
          ],
        };
      } catch (error) {
        throw new Error(`Failed to get issue types: ${error.message}`);
      }
    }
  );
}
