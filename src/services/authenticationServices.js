import { createAuthenticatedClient } from "../taigaAuth.js";

/**
 * Authentication services for Taiga API
 */
export class AuthenticationService {
  /**
   * Get the current user's information
   * @returns {Promise<Object>} - User information
   */
  async getCurrentUser() {
    try {
      const client = await createAuthenticatedClient();
      const response = await client.get("/users/me");
      return response.data;
    } catch (error) {
      console.error("Failed to get current user:", error.message);
      throw new Error("Failed to get user information from Taiga");
    }
  }

  /**
   * Get user by ID
   * @param {string|number} userId - User ID
   * @returns {Promise<Object>} - User details
   */
  async getUser(userId) {
    try {
      const client = await createAuthenticatedClient();
      const response = await client.get(`/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to get user ${userId}:`, error.message);
      throw new Error("Failed to get user from Taiga");
    }
  }

  /**
   * List users in the Taiga instance
   * @returns {Promise<Array>} - List of users
   */
  async listUsers() {
    try {
      const client = await createAuthenticatedClient();
      const response = await client.get("/users");
      return response.data;
    } catch (error) {
      console.error("Failed to list users:", error.message);
      throw new Error("Failed to list users from Taiga");
    }
  }
}

// Export a singleton instance
export const authenticationService = new AuthenticationService();
