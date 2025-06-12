import { createAuthenticatedClient } from "../taigaAuth.js";

/**
 * Service for role-related operations in Taiga API
 */
export class RoleService {
  /**
   * Get a list of all roles, optionally filtered by project
   * @param {string|number} [projectId] - Optional project ID to filter roles
   * @returns {Promise<Array>} - List of roles
   */
  async listRoles(projectId = null) {
    try {
      const client = await createAuthenticatedClient();
      const params = projectId ? { project: projectId } : {};

      const response = await client.get("/roles", { params });
      return response.data;
    } catch (error) {
      console.error("Failed to list roles:", error.message);
      throw new Error("Failed to list roles from Taiga");
    }
  }

  /**
   * Get details of a specific role
   * @param {string|number} roleId - Role ID
   * @returns {Promise<Object>} - Role details
   */
  async getRole(roleId) {
    try {
      const client = await createAuthenticatedClient();
      const response = await client.get(`/roles/${roleId}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to get role ${roleId}:`, error.message);
      throw new Error(`Failed to get role details from Taiga`);
    }
  }
}

// Export a singleton instance
export const roleService = new RoleService();
