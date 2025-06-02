import { createAuthenticatedClient } from "../taigaAuth.js";

/**
 * Service for user story-related operations in Taiga
 */
export class UserStoryService {
  /**
   * List user stories for a project
   * @param {string} projectId - Project ID
   * @returns {Promise<Array>} - List of user stories
   */
  async listUserStories(projectId) {
    try {
      const client = await createAuthenticatedClient();
      const response = await client.get("/userstories", {
        params: { project: projectId },
      });
      return response.data;
    } catch (error) {
      console.error(
        `Failed to list user stories for project ${projectId}:`,
        error.message
      );
      throw new Error("Failed to list user stories from Taiga");
    }
  }

  /**
   * Create a new user story in a project
   * @param {Object} userStoryData - User story data
   * @param {string} userStoryData.project - Project ID
   * @param {string} userStoryData.subject - User story subject/title
   * @param {string} [userStoryData.description] - User story description
   * @param {number} [userStoryData.status] - Status ID
   * @param {Array} [userStoryData.tags] - Array of tags
   * @returns {Promise<Object>} - Created user story
   */
  async createUserStory(userStoryData) {
    try {
      const client = await createAuthenticatedClient();
      const response = await client.post("/userstories", userStoryData);
      return response.data;
    } catch (error) {
      console.error("Failed to create user story:", error.message);
      throw new Error("Failed to create user story in Taiga");
    }
  }

  /**
   * Get user story statuses for a project
   * @param {string} projectId - Project ID
   * @returns {Promise<Array>} - List of user story statuses
   */
  async getUserStoryStatuses(projectId) {
    try {
      const client = await createAuthenticatedClient();
      const response = await client.get("/userstory-statuses", {
        params: { project: projectId },
      });
      return response.data;
    } catch (error) {
      console.error(
        `Failed to get user story statuses for project ${projectId}:`,
        error.message
      );
      throw new Error("Failed to get user story statuses from Taiga");
    }
  }

  /**
   * Get a specific user story
   * @param {string|number} userStoryId - User story ID
   * @returns {Promise<Object>} - User story details
   */
  async getUserStory(userStoryId) {
    try {
      const client = await createAuthenticatedClient();
      const response = await client.get(`/userstories/${userStoryId}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to get user story ${userStoryId}:`, error.message);
      throw new Error("Failed to get user story from Taiga");
    }
  }

  /**
   * Update a user story
   * @param {string|number} userStoryId - User story ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} - Updated user story
   */
  async updateUserStory(userStoryId, updateData) {
    try {
      const client = await createAuthenticatedClient();
      const response = await client.patch(
        `/userstories/${userStoryId}`,
        updateData
      );
      return response.data;
    } catch (error) {
      console.error(
        `Failed to update user story ${userStoryId}:`,
        error.message
      );
      throw new Error("Failed to update user story in Taiga");
    }
  }

  /**
   * Delete a user story
   * @param {string|number} userStoryId - User story ID
   * @returns {Promise<Object>} - Deletion confirmation
   */
  async deleteUserStory(userStoryId) {
    try {
      const client = await createAuthenticatedClient();
      await client.delete(`/userstories/${userStoryId}`);
      return { status: "deleted", user_story_id: userStoryId };
    } catch (error) {
      console.error(
        `Failed to delete user story ${userStoryId}:`,
        error.message
      );
      throw new Error("Failed to delete user story from Taiga");
    }
  }

  /**
   * Assign a user story to a user
   * @param {string|number} userStoryId - User story ID
   * @param {string|number} userId - User ID
   * @returns {Promise<Object>} - Updated user story
   */
  async assignUserStoryToUser(userStoryId, userId) {
    return this.updateUserStory(userStoryId, { assigned_to: userId });
  }

  /**
   * Unassign a user story from a user
   * @param {string|number} userStoryId - User story ID
   * @returns {Promise<Object>} - Updated user story
   */
  async unassignUserStoryFromUser(userStoryId) {
    return this.updateUserStory(userStoryId, { assigned_to: null });
  }
}

// Export a singleton instance
export const userStoryService = new UserStoryService();
