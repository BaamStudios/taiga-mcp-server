import { createAuthenticatedClient } from "../taigaAuth.js";

/**
 * Service for wiki-related operations in Taiga
 */
export class WikiService {
  /**
   * List wiki pages for a project
   * @param {string|number} projectId - Project ID
   * @returns {Promise<Array>} - List of wiki pages
   */
  async listWikiPages(projectId) {
    try {
      const client = await createAuthenticatedClient();
      const response = await client.get("/wiki", {
        params: { project: projectId },
      });
      return response.data;
    } catch (error) {
      console.error(
        `Failed to list wiki pages for project ${projectId}:`,
        error.message
      );
      throw new Error("Failed to list wiki pages from Taiga");
    }
  }

  /**
   * Get a specific wiki page
   * @param {string|number} wikiPageId - Wiki page ID
   * @returns {Promise<Object>} - Wiki page details
   */
  async getWikiPage(wikiPageId) {
    try {
      const client = await createAuthenticatedClient();
      const response = await client.get(`/wiki/${wikiPageId}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to get wiki page ${wikiPageId}:`, error.message);
      throw new Error("Failed to get wiki page from Taiga");
    }
  }

  /**
   * Create a new wiki page
   * @param {Object} wikiPageData - Wiki page data
   * @param {string|number} wikiPageData.project - Project ID
   * @param {string} wikiPageData.slug - Page slug
   * @param {string} wikiPageData.content - Page content
   * @returns {Promise<Object>} - Created wiki page
   */
  async createWikiPage(wikiPageData) {
    try {
      const client = await createAuthenticatedClient();
      const response = await client.post("/wiki", wikiPageData);
      return response.data;
    } catch (error) {
      console.error("Failed to create wiki page:", error.message);
      throw new Error("Failed to create wiki page in Taiga");
    }
  }

  /**
   * Update a wiki page
   * @param {string|number} wikiPageId - Wiki page ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} - Updated wiki page
   */
  async updateWikiPage(wikiPageId, updateData) {
    try {
      const client = await createAuthenticatedClient();
      const response = await client.patch(`/wiki/${wikiPageId}`, updateData);
      return response.data;
    } catch (error) {
      console.error(`Failed to update wiki page ${wikiPageId}:`, error.message);
      throw new Error("Failed to update wiki page in Taiga");
    }
  }

  /**
   * Delete a wiki page
   * @param {string|number} wikiPageId - Wiki page ID
   * @returns {Promise<Object>} - Deletion confirmation
   */
  async deleteWikiPage(wikiPageId) {
    try {
      const client = await createAuthenticatedClient();
      await client.delete(`/wiki/${wikiPageId}`);
      return { status: "deleted", wiki_page_id: wikiPageId };
    } catch (error) {
      console.error(`Failed to delete wiki page ${wikiPageId}:`, error.message);
      throw new Error("Failed to delete wiki page from Taiga");
    }
  }
}

// Export a singleton instance
export const wikiService = new WikiService();
