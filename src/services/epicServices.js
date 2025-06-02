import { createAuthenticatedClient } from "../taigaAuth.js";

/**
 * Service for epic-related operations in Taiga
 */
export class EpicService {
  /**
   * List epics for a project
   * @param {string|number} projectId - Project ID
   * @param {Object} [filters] - Optional filters
   * @returns {Promise<Array>} - List of epics
   */
  async listEpics(projectId, filters = {}) {
    try {
      const client = await createAuthenticatedClient();
      const response = await client.get("/epics", {
        params: { project: projectId, ...filters },
      });
      return response.data;
    } catch (error) {
      console.error(
        `Failed to list epics for project ${projectId}:`,
        error.message
      );
      throw new Error("Failed to list epics from Taiga");
    }
  }

  /**
   * Create a new epic
   * @param {Object} epicData - Epic data
   * @param {string|number} epicData.project - Project ID
   * @param {string} epicData.subject - Epic subject/title
   * @param {string} [epicData.description] - Epic description
   * @param {string} [epicData.color] - Epic color
   * @returns {Promise<Object>} - Created epic
   */
  async createEpic(epicData) {
    try {
      const client = await createAuthenticatedClient();
      const response = await client.post("/epics", epicData);
      return response.data;
    } catch (error) {
      console.error("Failed to create epic:", error.message);
      throw new Error("Failed to create epic in Taiga");
    }
  }

  /**
   * Get a specific epic
   * @param {string|number} epicId - Epic ID
   * @returns {Promise<Object>} - Epic details
   */
  async getEpic(epicId) {
    try {
      const client = await createAuthenticatedClient();
      const response = await client.get(`/epics/${epicId}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to get epic ${epicId}:`, error.message);
      throw new Error("Failed to get epic from Taiga");
    }
  }

  /**
   * Update an epic
   * @param {string|number} epicId - Epic ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} - Updated epic
   */
  async updateEpic(epicId, updateData) {
    try {
      const client = await createAuthenticatedClient();
      const response = await client.patch(`/epics/${epicId}`, updateData);
      return response.data;
    } catch (error) {
      console.error(`Failed to update epic ${epicId}:`, error.message);
      throw new Error("Failed to update epic in Taiga");
    }
  }

  /**
   * Delete an epic
   * @param {string|number} epicId - Epic ID
   * @returns {Promise<Object>} - Deletion confirmation
   */
  async deleteEpic(epicId) {
    try {
      const client = await createAuthenticatedClient();
      await client.delete(`/epics/${epicId}`);
      return { status: "deleted", epic_id: epicId };
    } catch (error) {
      console.error(`Failed to delete epic ${epicId}:`, error.message);
      throw new Error("Failed to delete epic from Taiga");
    }
  }

  /**
   * Assign an epic to a user
   * @param {string|number} epicId - Epic ID
   * @param {string|number} userId - User ID
   * @returns {Promise<Object>} - Updated epic
   */
  async assignEpicToUser(epicId, userId) {
    return this.updateEpic(epicId, { assigned_to: userId });
  }

  /**
   * Unassign an epic from a user
   * @param {string|number} epicId - Epic ID
   * @returns {Promise<Object>} - Updated epic
   */
  async unassignEpicFromUser(epicId) {
    return this.updateEpic(epicId, { assigned_to: null });
  }
}

// Export a singleton instance
export const epicService = new EpicService();
