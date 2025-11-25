/**
 * CircleTel CMS - Content Converter
 *
 * Converts between AI-generated PageContent JSON and HTML for rich text editing
 */

import type { PageContent, ContentSection } from './types';

/**
 * Convert PageContent JSON to HTML for Tiptap editor
 */
export function contentToHTML(content: PageContent): string {
  let html = '';

  // Hero Section
  if (content.hero) {
    html += `<div class="hero-section">`;
    html += `<h1>${escapeHtml(content.hero.headline)}</h1>`;
    html += `<p class="subheadline">${escapeHtml(content.hero.subheadline)}</p>`;

    if (content.hero.cta_primary) {
      html += `<p class="cta-primary"><a href="${escapeHtml(content.hero.cta_primary_url || '#')}">${escapeHtml(content.hero.cta_primary)}</a></p>`;
    }

    if (content.hero.cta_secondary) {
      html += `<p class="cta-secondary"><a href="${escapeHtml(content.hero.cta_secondary_url || '#')}">${escapeHtml(content.hero.cta_secondary)}</a></p>`;
    }

    html += `</div>`;
  }

  // Content Sections
  content.sections.forEach((section) => {
    html += sectionToHTML(section);
  });

  return html;
}

/**
 * Convert a single content section to HTML
 */
function sectionToHTML(section: ContentSection): string {
  let html = '';

  switch (section.type) {
    case 'features':
      html += `<div class="features-section">`;
      html += `<h2>${escapeHtml(section.heading)}</h2>`;
      html += `<div class="features-grid layout-${section.layout}">`;
      section.items.forEach((item) => {
        html += `<div class="feature-item">`;
        html += `<h3>${escapeHtml(item.title)}</h3>`;
        html += `<p>${escapeHtml(item.description)}</p>`;
        if (item.icon) {
          html += `<p class="icon">${escapeHtml(item.icon)}</p>`;
        }
        html += `</div>`;
      });
      html += `</div></div>`;
      break;

    case 'testimonials':
      html += `<div class="testimonials-section">`;
      html += `<h2>${escapeHtml(section.heading)}</h2>`;
      html += `<div class="testimonials-grid">`;
      section.items.forEach((item) => {
        html += `<blockquote class="testimonial">`;
        html += `<p>${escapeHtml(item.quote)}</p>`;
        html += `<cite>— ${escapeHtml(item.author)}${item.company ? `, ${escapeHtml(item.company)}` : ''}</cite>`;
        html += `</blockquote>`;
      });
      html += `</div></div>`;
      break;

    case 'cta':
      html += `<div class="cta-section">`;
      html += `<h2>${escapeHtml(section.heading)}</h2>`;
      html += `<p>${escapeHtml(section.description)}</p>`;
      html += `<p class="cta-button"><a href="${escapeHtml(section.button_url)}">${escapeHtml(section.button_text)}</a></p>`;
      html += `</div>`;
      break;

    case 'text':
      html += `<div class="text-section">`;
      if (section.heading) {
        html += `<h2>${escapeHtml(section.heading)}</h2>`;
      }
      html += `<div class="text-content">${section.content}</div>`;
      html += `</div>`;
      break;

    case 'image':
      html += `<div class="image-section">`;
      html += `<img src="${escapeHtml(section.src)}" alt="${escapeHtml(section.alt)}" />`;
      if (section.caption) {
        html += `<p class="caption">${escapeHtml(section.caption)}</p>`;
      }
      html += `</div>`;
      break;

    case 'video':
      html += `<div class="video-section">`;
      html += `<div class="video-container">`;
      html += `<iframe src="${escapeHtml(section.url)}" title="Video" allowfullscreen></iframe>`;
      html += `</div>`;
      if (section.caption) {
        html += `<p class="caption">${escapeHtml(section.caption)}</p>`;
      }
      html += `</div>`;
      break;
  }

  return html;
}

/**
 * Parse HTML from editor back to PageContent JSON
 *
 * Note: This is a simplified parser for MVP.
 * For production, consider using a proper HTML parser like 'node-html-parser'
 */
export function htmlToContent(html: string): Partial<PageContent> {
  // For now, return the HTML as a single text section
  // This allows users to edit content freely while we build full structured parsing
  return {
    sections: [
      {
        type: 'text',
        heading: 'Content',
        content: html,
      },
    ],
  };
}

/**
 * Escape HTML special characters to prevent XSS
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Convert PageContent to a plain text summary (for previews)
 */
export function contentToPlainText(content: PageContent): string {
  let text = '';

  // Hero
  if (content.hero) {
    text += `${content.hero.headline}\n\n`;
    text += `${content.hero.subheadline}\n\n`;
  }

  // Sections
  content.sections.forEach((section) => {
    if ('heading' in section && section.heading) {
      text += `${section.heading}\n\n`;
    }

    if (section.type === 'features' && 'items' in section) {
      section.items.forEach((item) => {
        text += `${item.title}: ${item.description}\n`;
      });
      text += '\n';
    }

    if (section.type === 'testimonials' && 'items' in section) {
      section.items.forEach((item) => {
        text += `"${item.quote}" - ${item.author}\n`;
      });
      text += '\n';
    }

    if (section.type === 'cta') {
      text += `${section.description}\n\n`;
    }

    if (section.type === 'text') {
      // Strip HTML tags for plain text
      const plainContent = section.content.replace(/<[^>]*>/g, '');
      text += `${plainContent}\n\n`;
    }
  });

  return text.trim();
}

/**
 * Calculate reading time in minutes
 */
export function calculateReadingTime(content: PageContent): number {
  const plainText = contentToPlainText(content);
  const wordCount = plainText.split(/\s+/).length;
  const wordsPerMinute = 200;
  return Math.ceil(wordCount / wordsPerMinute);
}

/**
 * Validate content structure
 */
export function validateContent(content: Partial<PageContent>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check hero section
  if (!content.hero) {
    errors.push('Hero section is required');
  } else {
    if (!content.hero.headline) {
      errors.push('Hero headline is required');
    }
    if (!content.hero.subheadline) {
      errors.push('Hero subheadline is required');
    }
  }

  // Check sections
  if (!content.sections || content.sections.length === 0) {
    errors.push('At least one content section is required');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
