import { createAuthenticatedClient } from "../taigaAuth.js";
import { authenticationService } from "./authenticationServices.js";

/**
 * Service for project-related operations in Taiga API
 */
export class ProjectService {
  /**
   * Get a list of all projects the user has access to
   * @returns {Promise<Array>} - List of projects
   */
  async listProjects() {
    try {
      const client = await createAuthenticatedClient();

      // Primero obtenemos la información del usuario actual
      const currentUser = await authenticationService.getCurrentUser();
      const userId = currentUser.id;

      // Luego obtenemos los proyectos donde el usuario es miembro
      const response = await client.get("/projects", {
        params: {
          member: userId,
        },
      });

      return response.data;
    } catch (error) {
      console.error("Failed to list projects:", error.message);
      throw new Error("Failed to list projects from Taiga");
    }
  }

  /**
   * Get details of a specific project
   * @param {string} projectId - Project ID or slug
   * @returns {Promise<Object>} - Project details
   */
  async getProject(projectId) {
    try {
      const client = await createAuthenticatedClient();
      const response = await client.get(`/projects/${projectId}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to get project ${projectId}:`, error.message);
      throw new Error(`Failed to get project details from Taiga`);
    }
  }

  /**
   * Get a project by its slug
   * @param {string} slug - Project slug
   * @returns {Promise<Object>} - Project details
   */
  async getProjectBySlug(slug) {
    try {
      const client = await createAuthenticatedClient();
      const response = await client.get(`/projects/by_slug?slug=${slug}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to get project by slug ${slug}:`, error.message);
      throw new Error(`Failed to get project details from Taiga`);
    }
  }

  /**
   * Create a new project
   * @param {Object} projectData - Project data
   * @param {string} projectData.name - Project name
   * @param {string} projectData.description - Project description
   * @param {Object} [projectData.options] - Additional project options
   * @returns {Promise<Object>} - Created project
   */
  async createProject(projectData) {
    try {
      const client = await createAuthenticatedClient();
      const response = await client.post("/projects", projectData);
      return response.data;
    } catch (error) {
      console.error("Failed to create project:", error.message);
      throw new Error("Failed to create project in Taiga");
    }
  }

  /**
   * Update a project
   * @param {string|number} projectId - Project ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} - Updated project
   */
  async updateProject(projectId, updateData) {
    try {
      const client = await createAuthenticatedClient();
      const response = await client.patch(`/projects/${projectId}`, updateData);
      return response.data;
    } catch (error) {
      console.error(`Failed to update project ${projectId}:`, error.message);
      throw new Error("Failed to update project in Taiga");
    }
  }

  /**
   * Delete a project
   * @param {string|number} projectId - Project ID
   * @returns {Promise<Object>} - Deletion confirmation
   */
  async deleteProject(projectId) {
    try {
      const client = await createAuthenticatedClient();
      await client.delete(`/projects/${projectId}`);
      return { status: "deleted", project_id: projectId };
    } catch (error) {
      console.error(`Failed to delete project ${projectId}:`, error.message);
      throw new Error("Failed to delete project from Taiga");
    }
  }

  /**
   * Get project members
   * @param {string|number} projectId - Project ID
   * @returns {Promise<Array>} - List of project members
   */
  async getProjectMembers(projectId) {
    try {
      const client = await createAuthenticatedClient();
      const response = await client.get("/memberships", {
        params: { project: projectId },
      });
      return response.data;
    } catch (error) {
      console.error(
        `Failed to get project members for project ${projectId}:`,
        error.message
      );
      throw new Error("Failed to get project members from Taiga");
    }
  }

  /**
   * Invite a user to a project
   * @param {string|number} projectId - Project ID
   * @param {string} email - User email
   * @param {string|number} roleId - Role ID
   * @returns {Promise<Object>} - Invitation result
   */
  async inviteProjectUser(projectId, email, roleId) {
    try {
      const client = await createAuthenticatedClient();
      const response = await client.post("/memberships", {
        project_id: projectId,
        username: email,
        role_id: roleId,
      });
      return response.data;
    } catch (error) {
      console.error(
        `Failed to invite user ${email} to project ${projectId}:`,
        error.message
      );
      throw new Error("Failed to invite user to project in Taiga");
    }
  }

  /**
   * Get project statistics
   * @param {string|number} projectId - Project ID
   * @returns {Promise<Object>} - Project statistics
   */
  async getProjectStats(projectId) {
    try {
      const client = await createAuthenticatedClient();
      const response = await client.get(`/projects/${projectId}/stats`);
      return response.data;
    } catch (error) {
      console.error(
        `Failed to get project stats for ${projectId}:`,
        error.message
      );
      throw new Error("Failed to get project statistics from Taiga");
    }
  }

  /**
   * Search items across the project
   * @param {string|number} projectId - Project ID
   * @param {string} text - Search text
   * @returns {Promise<Object>} - Search results
   */
  async searchProject(projectId, text) {
    try {
      const client = await createAuthenticatedClient();
      const response = await client.get("/search", {
        params: { project: projectId, text },
      });
      return response.data;
    } catch (error) {
      console.error(`Failed to search project ${projectId}:`, error.message);
      throw new Error("Failed to search project in Taiga");
    }
  }

  /**
   * Export project data
   * @param {string|number} projectId - Project ID
   * @returns {Promise<Object>} - Export result
   */
  async exportProject(projectId) {
    try {
      const client = await createAuthenticatedClient();
      const response = await client.post(`/exporter/${projectId}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to export project ${projectId}:`, error.message);
      throw new Error("Failed to export project from Taiga");
    }
  }

  /**
   * Get export status
   * @param {string} exportId - Export ID
   * @returns {Promise<Object>} - Export status
   */
  async getExportStatus(exportId) {
    try {
      const client = await createAuthenticatedClient();
      const response = await client.get(`/exporter/${exportId}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to get export status ${exportId}:`, error.message);
      throw new Error("Failed to get export status from Taiga");
    }
  }
}

// Export a singleton instance
export const projectService = new ProjectService();
