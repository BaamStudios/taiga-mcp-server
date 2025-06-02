import { createAuthenticatedClient } from "../taigaAuth.js";

/**
 * Service for milestone-related operations in Taiga
 */
export class MilestoneService {
  /**
   * List milestones (sprints) for a project
   * @param {string|number} projectId - Project ID
   * @returns {Promise<Array>} - List of milestones
   */
  async listMilestones(projectId) {
    try {
      const client = await createAuthenticatedClient();
      const response = await client.get("/milestones", {
        params: { project: projectId },
      });
      return response.data;
    } catch (error) {
      console.error(
        `Failed to list milestones for project ${projectId}:`,
        error.message
      );
      throw new Error("Failed to list milestones from Taiga");
    }
  }

  /**
   * Create a new milestone (sprint)
   * @param {Object} milestoneData - Milestone data
   * @param {string|number} milestoneData.project - Project ID
   * @param {string} milestoneData.name - Milestone name
   * @param {string} milestoneData.estimated_start - Start date (YYYY-MM-DD)
   * @param {string} milestoneData.estimated_finish - Finish date (YYYY-MM-DD)
   * @returns {Promise<Object>} - Created milestone
   */
  async createMilestone(milestoneData) {
    try {
      const client = await createAuthenticatedClient();
      const response = await client.post("/milestones", milestoneData);
      return response.data;
    } catch (error) {
      console.error("Failed to create milestone:", error.message);
      throw new Error("Failed to create milestone in Taiga");
    }
  }

  /**
   * Get a specific milestone
   * @param {string|number} milestoneId - Milestone ID
   * @returns {Promise<Object>} - Milestone details
   */
  async getMilestone(milestoneId) {
    try {
      const client = await createAuthenticatedClient();
      const response = await client.get(`/milestones/${milestoneId}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to get milestone ${milestoneId}:`, error.message);
      throw new Error("Failed to get milestone from Taiga");
    }
  }

  /**
   * Update a milestone
   * @param {string|number} milestoneId - Milestone ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} - Updated milestone
   */
  async updateMilestone(milestoneId, updateData) {
    try {
      const client = await createAuthenticatedClient();
      const response = await client.patch(
        `/milestones/${milestoneId}`,
        updateData
      );
      return response.data;
    } catch (error) {
      console.error(
        `Failed to update milestone ${milestoneId}:`,
        error.message
      );
      throw new Error("Failed to update milestone in Taiga");
    }
  }

  /**
   * Delete a milestone
   * @param {string|number} milestoneId - Milestone ID
   * @returns {Promise<Object>} - Deletion confirmation
   */
  async deleteMilestone(milestoneId) {
    try {
      const client = await createAuthenticatedClient();
      await client.delete(`/milestones/${milestoneId}`);
      return { status: "deleted", milestone_id: milestoneId };
    } catch (error) {
      console.error(
        `Failed to delete milestone ${milestoneId}:`,
        error.message
      );
      throw new Error("Failed to delete milestone from Taiga");
    }
  }

  /**
   * Get milestone statistics
   * @param {string|number} milestoneId - Milestone ID
   * @returns {Promise<Object>} - Milestone statistics
   */
  async getMilestoneStats(milestoneId) {
    try {
      const client = await createAuthenticatedClient();
      const response = await client.get(`/milestones/${milestoneId}/stats`);
      return response.data;
    } catch (error) {
      console.error(
        `Failed to get milestone stats for ${milestoneId}:`,
        error.message
      );
      throw new Error("Failed to get milestone statistics from Taiga");
    }
  }
}

// Export a singleton instance
export const milestoneService = new MilestoneService();
