#!/usr/bin/env node

import { glob } from 'glob';
import { readFileSync, writeFileSync } from 'fs';
import { dirname, relative, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = join(__dirname, '..');
const MARKETPLACE_PATH = join(ROOT_DIR, '.claude-plugin', 'marketplace.json');

async function syncMarketplace() {
  // Find all plugin.json files
  const pluginJsonFiles = await glob('plugins/*/.claude-plugin/plugin.json', {
    cwd: ROOT_DIR,
    absolute: true,
  });

  if (pluginJsonFiles.length === 0) {
    console.log('No plugin.json files found');
    return;
  }

  // Read current marketplace.json
  let marketplace;
  try {
    marketplace = JSON.parse(readFileSync(MARKETPLACE_PATH, 'utf-8'));
  } catch (err) {
    console.error('Failed to read marketplace.json:', err.message);
    process.exit(1);
  }

  // Build plugins array from plugin.json files
  const plugins = [];

  for (const pluginJsonPath of pluginJsonFiles) {
    try {
      const pluginJson = JSON.parse(readFileSync(pluginJsonPath, 'utf-8'));
      const pluginDir = dirname(dirname(pluginJsonPath)); // Go up from .claude-plugin to plugin root
      const relativePath = './' + relative(ROOT_DIR, pluginDir);

      const pluginEntry = {
        name: pluginJson.name,
        source: relativePath,
        description: pluginJson.description,
        version: pluginJson.version,
      };

      // Add optional metadata fields if present
      if (pluginJson.keywords) {
        pluginEntry.keywords = pluginJson.keywords;
      }
      if (pluginJson.author) {
        pluginEntry.author = pluginJson.author;
      }
      if (pluginJson.homepage) {
        pluginEntry.homepage = pluginJson.homepage;
      }
      if (pluginJson.repository) {
        pluginEntry.repository = pluginJson.repository;
      }
      if (pluginJson.license) {
        pluginEntry.license = pluginJson.license;
      }
      if (pluginJson.category) {
        pluginEntry.category = pluginJson.category;
      }
      if (pluginJson.tags) {
        pluginEntry.tags = pluginJson.tags;
      }

      // NOTE: Don't copy component paths (commands, agents, skills, hooks, mcpServers, lspServers)
      // These are defined in the plugin's own plugin.json and will be read from there when installed.
      // Marketplace entries only need metadata, not internal plugin config.

      // Add marketplace-specific fields if present
      if (pluginJson.strict !== undefined) {
        pluginEntry.strict = pluginJson.strict;
      }

      plugins.push(pluginEntry);
      console.log(`Synced plugin: ${pluginJson.name} (${pluginJson.version})`);
    } catch (err) {
      console.error(`Failed to process ${pluginJsonPath}:`, err.message);
    }
  }

  // Sort plugins by name for consistent output
  plugins.sort((a, b) => a.name.localeCompare(b.name));

  // Update marketplace.json
  marketplace.plugins = plugins;

  // Write updated marketplace.json
  writeFileSync(MARKETPLACE_PATH, JSON.stringify(marketplace, null, 2) + '\n');
  console.log(`Updated ${MARKETPLACE_PATH} with ${plugins.length} plugin(s)`);
}

syncMarketplace().catch((err) => {
  console.error('Sync failed:', err);
  process.exit(1);
});
