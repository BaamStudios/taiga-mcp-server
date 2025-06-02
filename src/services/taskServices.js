import { createAuthenticatedClient } from "../taigaAuth.js";

/**
 * Service for task-related operations in Taiga
 */
export class TaskService {
  /**
   * Create a new task associated with a user story
   * @param {Object} taskData - Task data
   * @param {string} taskData.project - Project ID
   * @param {string} taskData.subject - Task subject/title
   * @param {string} [taskData.description] - Task description
   * @param {string} [taskData.user_story] - User story ID
   * @param {string} [taskData.status] - Status ID
   * @param {Array} [taskData.tags] - Array of tags
   * @returns {Promise<Object>} - Created task
   */
  async createTask(taskData) {
    try {
      const client = await createAuthenticatedClient();
      const response = await client.post("/tasks", taskData);
      return response.data;
    } catch (error) {
      console.error("Failed to create task:", error.message);
      throw new Error("Failed to create task in Taiga");
    }
  }

  /**
   * Get task statuses for a project
   * @param {string} projectId - Project ID
   * @returns {Promise<Array>} - List of task statuses
   */
  async getTaskStatuses(projectId) {
    try {
      const client = await createAuthenticatedClient();
      const response = await client.get("/task-statuses", {
        params: { project: projectId },
      });
      return response.data;
    } catch (error) {
      console.error(
        `Failed to get task statuses for project ${projectId}:`,
        error.message
      );
      throw new Error("Failed to get task statuses from Taiga");
    }
  }

  /**
   * List tasks for a project
   * @param {string|number} projectId - Project ID
   * @param {Object} [filters] - Optional filters
   * @returns {Promise<Array>} - List of tasks
   */
  async listTasks(projectId, filters = {}) {
    try {
      const client = await createAuthenticatedClient();
      const response = await client.get("/tasks", {
        params: { project: projectId, ...filters },
      });
      return response.data;
    } catch (error) {
      console.error(
        `Failed to list tasks for project ${projectId}:`,
        error.message
      );
      throw new Error("Failed to list tasks from Taiga");
    }
  }

  /**
   * Get a specific task
   * @param {string|number} taskId - Task ID
   * @returns {Promise<Object>} - Task details
   */
  async getTask(taskId) {
    try {
      const client = await createAuthenticatedClient();
      const response = await client.get(`/tasks/${taskId}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to get task ${taskId}:`, error.message);
      throw new Error("Failed to get task from Taiga");
    }
  }

  /**
   * Update a task
   * @param {string|number} taskId - Task ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} - Updated task
   */
  async updateTask(taskId, updateData) {
    try {
      const client = await createAuthenticatedClient();
      const response = await client.patch(`/tasks/${taskId}`, updateData);
      return response.data;
    } catch (error) {
      console.error(`Failed to update task ${taskId}:`, error.message);
      throw new Error("Failed to update task in Taiga");
    }
  }

  /**
   * Delete a task
   * @param {string|number} taskId - Task ID
   * @returns {Promise<Object>} - Deletion confirmation
   */
  async deleteTask(taskId) {
    try {
      const client = await createAuthenticatedClient();
      await client.delete(`/tasks/${taskId}`);
      return { status: "deleted", task_id: taskId };
    } catch (error) {
      console.error(`Failed to delete task ${taskId}:`, error.message);
      throw new Error("Failed to delete task from Taiga");
    }
  }

  /**
   * Assign a task to a user
   * @param {string|number} taskId - Task ID
   * @param {string|number} userId - User ID
   * @returns {Promise<Object>} - Updated task
   */
  async assignTaskToUser(taskId, userId) {
    return this.updateTask(taskId, { assigned_to: userId });
  }

  /**
   * Unassign a task from a user
   * @param {string|number} taskId - Task ID
   * @returns {Promise<Object>} - Updated task
   */
  async unassignTaskFromUser(taskId) {
    return this.updateTask(taskId, { assigned_to: null });
  }
}

// Export a singleton instance
export const taskService = new TaskService();
