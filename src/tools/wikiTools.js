import { z } from "zod";
import { projectService } from "../services/projectServices.js";
import { wikiService } from "../services/wikiServices.js";

/**
 * Register wiki tools
 * @param {McpServer} server - The MCP server instance
 * @param {TaigaService} taigaService - The Taiga service instance
 */
export function registerWikiTools(server) {
  // Add tool for listing wiki pages
  server.tool(
    "taiga_listWikiPages",
    "List all wiki pages for a specific project",
    { projectIdentifier: z.string().describe("Project ID or slug") },
    async ({ projectIdentifier }) => {
      try {
        let projectId = projectIdentifier;
        if (isNaN(projectIdentifier)) {
          const project = await projectService.getProjectBySlug(
            projectIdentifier
          );
          projectId = project.id;
        }

        const wikiPages = await wikiService.listWikiPages(projectId);

        if (wikiPages.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: "No wiki pages found in this project.",
              },
            ],
          };
        }

        return {
          content: [
            {
              type: "text",
              text: `Wiki Pages in Project:

${wikiPages
  .map(
    (page) =>
      `- ${page.slug}: ${
        page.content ? page.content.substring(0, 100) + "..." : "No content"
      }`
  )
  .join("\n")}
            `,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Failed to list wiki pages: ${error.message}`,
            },
          ],
        };
      }
    }
  );

  // Add tool for getting a specific wiki page
  server.tool(
    "taiga_getWikiPage",
    "Get details of a specific wiki page",
    { wikiPageId: z.string().describe("Wiki page ID") },
    async ({ wikiPageId }) => {
      try {
        const wikiPage = await wikiService.getWikiPage(wikiPageId);

        return {
          content: [
            {
              type: "text",
              text: `Wiki Page Details:

Title: ${wikiPage.slug}
Project: ${wikiPage.project_extra_info?.name || wikiPage.project}
Owner: ${wikiPage.owner_extra_info?.full_name || wikiPage.owner}
Created: ${new Date(wikiPage.created_date).toLocaleDateString()}
Modified: ${new Date(wikiPage.modified_date).toLocaleDateString()}

Content:
${wikiPage.content || "No content"}
              `,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Failed to get wiki page: ${error.message}`,
            },
          ],
        };
      }
    }
  );

  // Add tool for creating a new wiki page
  server.tool(
    "taiga_createWikiPage",
    "Create a new wiki page in a project",
    {
      projectIdentifier: z.string().describe("Project ID or slug"),
      slug: z.string().describe("Page slug/title"),
      content: z.string().describe("Page content in markdown format"),
    },
    async ({ projectIdentifier, slug, content }) => {
      try {
        let projectId = projectIdentifier;
        if (isNaN(projectIdentifier)) {
          const project = await projectService.getProjectBySlug(
            projectIdentifier
          );
          projectId = project.id;
        }

        const wikiPageData = {
          project: projectId,
          slug: slug,
          content: content,
        };

        const newWikiPage = await wikiService.createWikiPage(wikiPageData);

        return {
          content: [
            {
              type: "text",
              text: `Wiki page created successfully!

Page ID: ${newWikiPage.id}
Slug: ${newWikiPage.slug}
Project: ${newWikiPage.project_extra_info?.name || newWikiPage.project}
Created: ${new Date(newWikiPage.created_date).toLocaleDateString()}

Content preview:
${newWikiPage.content.substring(0, 200)}${
                newWikiPage.content.length > 200 ? "..." : ""
              }
              `,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Failed to create wiki page: ${error.message}`,
            },
          ],
        };
      }
    }
  );

  // Add tool for updating a wiki page
  server.tool(
    "taiga_updateWikiPage",
    "Update an existing wiki page",
    {
      wikiPageId: z.string().describe("Wiki page ID"),
      slug: z.string().optional().describe("New page slug/title"),
      content: z
        .string()
        .optional()
        .describe("New page content in markdown format"),
    },
    async ({ wikiPageId, slug, content }) => {
      try {
        const updateData = {};
        if (slug) updateData.slug = slug;
        if (content) updateData.content = content;

        if (Object.keys(updateData).length === 0) {
          return {
            content: [
              {
                type: "text",
                text: "No updates provided. Please specify slug or content to update.",
              },
            ],
          };
        }

        const updatedWikiPage = await wikiService.updateWikiPage(
          wikiPageId,
          updateData
        );

        return {
          content: [
            {
              type: "text",
              text: `Wiki page updated successfully!

Page ID: ${updatedWikiPage.id}
Slug: ${updatedWikiPage.slug}
Project: ${updatedWikiPage.project_extra_info?.name || updatedWikiPage.project}
Modified: ${new Date(updatedWikiPage.modified_date).toLocaleDateString()}

Content preview:
${updatedWikiPage.content.substring(0, 200)}${
                updatedWikiPage.content.length > 200 ? "..." : ""
              }
              `,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Failed to update wiki page: ${error.message}`,
            },
          ],
        };
      }
    }
  );

  // Add tool for deleting a wiki page
  server.tool(
    "taiga_deleteWikiPage",
    "Delete a wiki page",
    { wikiPageId: z.string().describe("Wiki page ID") },
    async ({ wikiPageId }) => {
      try {
        const result = await wikiService.deleteWikiPage(wikiPageId);

        return {
          content: [
            {
              type: "text",
              text: `Wiki page deleted successfully!

Deleted page ID: ${result.wiki_page_id}
Status: ${result.status}
              `,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Failed to delete wiki page: ${error.message}`,
            },
          ],
        };
      }
    }
  );
}
