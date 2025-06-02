import { createAuthenticatedClient } from "../taigaAuth.js";

/**
 * Service for issue-related operations in Taiga
 */
export class IssueService {
  /**
   * List issues for a project
   * @param {string|number} projectId - Project ID
   * @param {Object} [filters] - Optional filters
   * @returns {Promise<Array>} - List of issues
   */
  async listIssues(projectId, filters = {}) {
    try {
      const client = await createAuthenticatedClient();
      const response = await client.get("/issues", {
        params: { project: projectId, ...filters },
      });
      return response.data;
    } catch (error) {
      console.error(
        `Failed to list issues for project ${projectId}:`,
        error.message
      );
      throw new Error("Failed to list issues from Taiga");
    }
  }

  /**
   * Create a new issue
   * @param {Object} issueData - Issue data
   * @param {string|number} issueData.project - Project ID
   * @param {string} issueData.subject - Issue subject/title
   * @param {string|number} issueData.priority - Priority ID
   * @param {string|number} issueData.status - Status ID
   * @param {string|number} issueData.severity - Severity ID
   * @param {string|number} issueData.type - Type ID
   * @param {string} [issueData.description] - Issue description
   * @returns {Promise<Object>} - Created issue
   */
  async createIssue(issueData) {
    try {
      const client = await createAuthenticatedClient();
      const response = await client.post("/issues", issueData);
      return response.data;
    } catch (error) {
      console.error("Failed to create issue:", error.message);
      throw new Error("Failed to create issue in Taiga");
    }
  }

  /**
   * Get a specific issue
   * @param {string|number} issueId - Issue ID
   * @returns {Promise<Object>} - Issue details
   */
  async getIssue(issueId) {
    try {
      const client = await createAuthenticatedClient();
      const response = await client.get(`/issues/${issueId}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to get issue ${issueId}:`, error.message);
      throw new Error("Failed to get issue from Taiga");
    }
  }

  /**
   * Update an issue
   * @param {string|number} issueId - Issue ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} - Updated issue
   */
  async updateIssue(issueId, updateData) {
    try {
      const client = await createAuthenticatedClient();
      const response = await client.patch(`/issues/${issueId}`, updateData);
      return response.data;
    } catch (error) {
      console.error(`Failed to update issue ${issueId}:`, error.message);
      throw new Error("Failed to update issue in Taiga");
    }
  }

  /**
   * Delete an issue
   * @param {string|number} issueId - Issue ID
   * @returns {Promise<Object>} - Deletion confirmation
   */
  async deleteIssue(issueId) {
    try {
      const client = await createAuthenticatedClient();
      await client.delete(`/issues/${issueId}`);
      return { status: "deleted", issue_id: issueId };
    } catch (error) {
      console.error(`Failed to delete issue ${issueId}:`, error.message);
      throw new Error("Failed to delete issue from Taiga");
    }
  }

  /**
   * Assign an issue to a user
   * @param {string|number} issueId - Issue ID
   * @param {string|number} userId - User ID
   * @returns {Promise<Object>} - Updated issue
   */
  async assignIssueToUser(issueId, userId) {
    return this.updateIssue(issueId, { assigned_to: userId });
  }

  /**
   * Unassign an issue from a user
   * @param {string|number} issueId - Issue ID
   * @returns {Promise<Object>} - Updated issue
   */
  async unassignIssueFromUser(issueId) {
    return this.updateIssue(issueId, { assigned_to: null });
  }

  /**
   * Get issue statuses for a project
   * @param {string|number} projectId - Project ID
   * @returns {Promise<Array>} - List of issue statuses
   */
  async getIssueStatuses(projectId) {
    try {
      const client = await createAuthenticatedClient();
      const response = await client.get("/issue-statuses", {
        params: { project: projectId },
      });
      return response.data;
    } catch (error) {
      console.error(
        `Failed to get issue statuses for project ${projectId}:`,
        error.message
      );
      throw new Error("Failed to get issue statuses from Taiga");
    }
  }

  /**
   * Get issue priorities for a project
   * @param {string|number} projectId - Project ID
   * @returns {Promise<Array>} - List of issue priorities
   */
  async getIssuePriorities(projectId) {
    try {
      const client = await createAuthenticatedClient();
      const response = await client.get("/priorities", {
        params: { project: projectId },
      });
      return response.data;
    } catch (error) {
      console.error(
        `Failed to get issue priorities for project ${projectId}:`,
        error.message
      );
      throw new Error("Failed to get issue priorities from Taiga");
    }
  }

  /**
   * Get issue severities for a project
   * @param {string|number} projectId - Project ID
   * @returns {Promise<Array>} - List of issue severities
   */
  async getIssueSeverities(projectId) {
    try {
      const client = await createAuthenticatedClient();
      const response = await client.get("/severities", {
        params: { project: projectId },
      });
      return response.data;
    } catch (error) {
      console.error(
        `Failed to get issue severities for project ${projectId}:`,
        error.message
      );
      throw new Error("Failed to get issue severities from Taiga");
    }
  }

  /**
   * Get issue types for a project
   * @param {string|number} projectId - Project ID
   * @returns {Promise<Array>} - List of issue types
   */
  async getIssueTypes(projectId) {
    try {
      const client = await createAuthenticatedClient();
      const response = await client.get("/issue-types", {
        params: { project: projectId },
      });
      return response.data;
    } catch (error) {
      console.error(
        `Failed to get issue types for project ${projectId}:`,
        error.message
      );
      throw new Error("Failed to get issue types from Taiga");
    }
  }
}

// Export a singleton instance
export const issueService = new IssueService();
