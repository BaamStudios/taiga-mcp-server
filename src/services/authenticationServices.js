import { createAuthenticatedClient } from "../taigaAuth.js";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const TAIGA_API_URL =
  process.env.TAIGA_API_URL || "https://api.taiga.io/api/v1";

/**
 * Create an axios instance without authentication for public endpoints
 * @returns {import('axios').AxiosInstance} - Axios instance for public endpoints
 */
function createUnauthenticatedClient() {
  return axios.create({
    baseURL: TAIGA_API_URL,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

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

  /**
   * Register a new user in Taiga
   * @param {Object} userData - User registration data
   * @param {string} userData.username - Username for the new user
   * @param {string} userData.email - Email address for the new user
   * @param {string} userData.password - Password for the new user
   * @param {string} userData.full_name - Full name of the user
   * @returns {Promise<Object>} - User registration response with auth details
   */
  async registerUser(userData) {
    try {
      const client = await createAuthenticatedClient();

      const registrationData = {
        username: userData.username,
        email: userData.email,
        password: userData.password,
        full_name: userData.full_name,
        type: "public",
        accepted_terms: "true",
      };

      const response = await client.post("/auth/register", registrationData);
      return response.data;
    } catch (error) {
      console.error("Failed to register user:", error.message);
      if (error.response && error.response.data) {
        throw new Error(
          `Registration failed: ${JSON.stringify(error.response.data)}`
        );
      }
      throw new Error("Failed to register user in Taiga");
    }
  }
}

// Export a singleton instance
export const authenticationService = new AuthenticationService();
