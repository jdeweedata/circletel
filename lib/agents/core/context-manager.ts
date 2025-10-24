/**
 * CircleTel Multi-Agent Orchestration System - Context Manager
 *
 * Purpose: Load and manage domain-specific context from .claude/memory/
 * Architecture: Reads domain memory files and provides them to workers
 *
 * Note: Works with Claude Code's file system (no API needed)
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import type { Layer, DomainContext } from './types';

// ============================================================================
// Context Manager Class
// ============================================================================

export class ContextManager {
  private cache: Map<Layer, DomainContext>;
  private verbose: boolean;

  constructor(options: { verbose?: boolean } = {}) {
    this.cache = new Map();
    this.verbose = options.verbose ?? false;
  }

  /**
   * Load domain-specific context from .claude/memory/
   */
  async loadDomainContext(domain: Layer): Promise<DomainContext> {
    // Check cache first
    if (this.cache.has(domain)) {
      if (this.verbose) {
        console.log(`📚 Context Manager: Using cached ${domain} context`);
      }
      return this.cache.get(domain)!;
    }

    if (this.verbose) {
      console.log(`📚 Context Manager: Loading ${domain} context...`);
    }

    try {
      const memoryPath = path.join(
        process.cwd(),
        '.claude',
        'memory',
        domain,
        'CLAUDE.md'
      );

      const content = await fs.readFile(memoryPath, 'utf-8');

      // Parse patterns and anti-patterns from content
      const patterns = this.extractPatterns(content);
      const antiPatterns = this.extractAntiPatterns(content);

      const context: DomainContext = {
        domain,
        content,
        patterns,
        antiPatterns,
      };

      // Cache for future use
      this.cache.set(domain, context);

      if (this.verbose) {
        console.log(`   ✅ Loaded ${content.length} chars`);
        console.log(`   📋 Patterns: ${patterns.length}`);
        console.log(`   ⚠️  Anti-patterns: ${antiPatterns.length}\n`);
      }

      return context;
    } catch (error) {
      if (this.verbose) {
        console.warn(`   ⚠️  Could not load ${domain} context:`, error);
      }

      // Return empty context if file doesn't exist
      return {
        domain,
        content: '',
        patterns: [],
        antiPatterns: [],
      };
    }
  }

  /**
   * Load multiple domain contexts
   */
  async loadMultipleContexts(domains: Layer[]): Promise<DomainContext[]> {
    const promises = domains.map((domain) => this.loadDomainContext(domain));
    return Promise.all(promises);
  }

  /**
   * Extract patterns from context content
   */
  private extractPatterns(content: string): string[] {
    const patterns: string[] = [];

    // Look for sections with "Pattern", "Best Practice", "Standard"
    const patternRegex = /(?:pattern|best practice|standard):\s*(.+)/gi;
    let match;

    while ((match = patternRegex.exec(content)) !== null) {
      patterns.push(match[1].trim());
    }

    // Also look for bulleted lists under "Patterns" headers
    const patternSectionRegex = /## Patterns\n([\s\S]*?)(?=\n##|\n---|\Z)/i;
    const sectionMatch = content.match(patternSectionRegex);

    if (sectionMatch) {
      const bulletPoints = sectionMatch[1].match(/^[-*]\s+(.+)$/gm);
      if (bulletPoints) {
        bulletPoints.forEach((bullet) => {
          const cleaned = bullet.replace(/^[-*]\s+/, '').trim();
          if (cleaned && !patterns.includes(cleaned)) {
            patterns.push(cleaned);
          }
        });
      }
    }

    return patterns;
  }

  /**
   * Extract anti-patterns from context content
   */
  private extractAntiPatterns(content: string): string[] {
    const antiPatterns: string[] = [];

    // Look for sections with "Anti-pattern", "Avoid", "Don't"
    const antiPatternRegex = /(?:anti-pattern|avoid|don't|never):\s*(.+)/gi;
    let match;

    while ((match = antiPatternRegex.exec(content)) !== null) {
      antiPatterns.push(match[1].trim());
    }

    // Also look for bulleted lists under "Anti-patterns" headers
    const antiPatternSectionRegex = /## Anti-?[Pp]atterns\n([\s\S]*?)(?=\n##|\n---|\Z)/i;
    const sectionMatch = content.match(antiPatternSectionRegex);

    if (sectionMatch) {
      const bulletPoints = sectionMatch[1].match(/^[-*]\s+(.+)$/gm);
      if (bulletPoints) {
        bulletPoints.forEach((bullet) => {
          const cleaned = bullet.replace(/^[-*]\s+/, '').trim();
          if (cleaned && !antiPatterns.includes(cleaned)) {
            antiPatterns.push(cleaned);
          }
        });
      }
    }

    return antiPatterns;
  }

  /**
   * Clear the cache
   */
  clearCache(): void {
    this.cache.clear();
    if (this.verbose) {
      console.log('🗑️  Context Manager: Cache cleared');
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    cachedDomains: Layer[];
    totalSize: number;
  } {
    const cachedDomains = Array.from(this.cache.keys());
    const totalSize = Array.from(this.cache.values()).reduce(
      (sum, ctx) => sum + ctx.content.length,
      0
    );

    return { cachedDomains, totalSize };
  }

  /**
   * Format context for injection into prompts
   */
  formatContextForPrompt(context: DomainContext): string {
    const parts: string[] = [];

    parts.push(`## ${context.domain.toUpperCase()} Domain Context`);
    parts.push('');

    if (context.patterns.length > 0) {
      parts.push('**Best Practices:**');
      context.patterns.forEach((pattern, i) => {
        parts.push(`${i + 1}. ${pattern}`);
      });
      parts.push('');
    }

    if (context.antiPatterns.length > 0) {
      parts.push('**Anti-Patterns to Avoid:**');
      context.antiPatterns.forEach((antiPattern, i) => {
        parts.push(`${i + 1}. ${antiPattern}`);
      });
      parts.push('');
    }

    // Include a summary of the full content if available
    if (context.content) {
      parts.push('**Full Context:**');
      parts.push(context.content);
    }

    return parts.join('\n');
  }

  /**
   * Get recommended context for a task
   */
  async getRecommendedContext(layers: Layer[]): Promise<string> {
    const contexts = await this.loadMultipleContexts(layers);

    const formatted = contexts
      .map((ctx) => this.formatContextForPrompt(ctx))
      .join('\n\n---\n\n');

    return formatted;
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let globalContextManager: ContextManager | null = null;

/**
 * Get the global context manager instance
 */
export function getContextManager(options?: { verbose?: boolean }): ContextManager {
  if (!globalContextManager) {
    globalContextManager = new ContextManager(options);
  }
  return globalContextManager;
}

/**
 * Reset the global context manager (useful for testing)
 */
export function resetContextManager(): void {
  globalContextManager = null;
}
