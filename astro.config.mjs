// @ts-check
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import react from "@astrojs/react";

// https://astro.build/config
export default defineConfig({
  integrations: [
    react(),
    starlight({
      title: "Randy AI Docs - MCP Interactive Guide",
      description:
        "Interactive documentation for MCP (Model Context Protocol) with Randy, your JARVIS-like assistant",
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/withastro/starlight",
        },
      ],
      sidebar: [
        {
          label: "Getting Started",
          items: [
            { label: "Meet Randy", slug: "guides/meet-randy" },
            { label: "Example", slug: "guides/example" },
            { label: "Claude Code & the Evolution of Agentic Coding", slug: "guides/ai-dev-steps" },
            { label: "Context Engineering: The New Vibe Coding - A Summary", slug: "guides/context-eng" },
            { label: "Development Workflow Steps", slug: "guides/workflow-ideas" },
          ],
        },
        {
          label: "Interactive Examples",
          items: [
            { label: "Randy Playground", slug: "examples/randy-playground" },
            { label: "MCP Server Connection", slug: "examples/mcp-connection" },
            { label: "Pocket-Pick Demo", slug: "examples/pocket-pick" },
          ],
        },
        {
          label: "MCP Server Development",
          items: [
            { label: "Go Implementation", slug: "mcp/go-server" },
            { label: "JavaScript Implementation", slug: "mcp/js-server" },
            {
              label: "Server Creation with Randy",
              slug: "mcp/randy-generator",
            },
          ],
        },
        {
          label: "Reference",
          autogenerate: { directory: "reference" },
        },
      ],
    }),
  ],
});
