import React from 'react';
import { Components } from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

export interface CodeBlockProps {
  children: string;
  className?: string;
  inline?: boolean;
}

export const markdownComponents: Components = {
  code({ children, className, inline, ...props }: CodeBlockProps) {
    const match = /language-(\w+)/.exec(className || '');
    const language = match ? match[1] : '';

    if (!inline && language) {
      return React.createElement('div', { className: 'relative' }, [
        React.createElement('div', { key: 'copy-btn', className: 'absolute top-2 right-2 z-10' },
          React.createElement('button', {
            onClick: () => navigator.clipboard.writeText(String(children)),
            className: 'px-2 py-1 text-xs bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors'
          }, 'Copy')
        ),
        React.createElement(SyntaxHighlighter, {
          key: 'highlighter',
          style: oneDark,
          language: language,
          PreTag: 'div',
          customStyle: {
            margin: 0,
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            padding: '1rem',
          },
          ...props
        }, String(children).replace(/\n$/, ''))
      ]);
    }

    return React.createElement('code', {
      className: 'bg-muted px-1.5 py-0.5 rounded text-sm font-mono',
      ...props
    }, children);
  },

  h1({ children }) {
    return React.createElement('h1', {
      className: 'text-3xl font-bold font-inter mb-6 text-foreground border-b pb-4'
    }, children);
  },

  h2({ children }) {
    return React.createElement('h2', {
      className: 'text-2xl font-semibold font-inter mb-4 mt-8 text-foreground'
    }, children);
  },

  h3({ children }) {
    return React.createElement('h3', {
      className: 'text-xl font-semibold font-inter mb-3 mt-6 text-foreground'
    }, children);
  },

  h4({ children }) {
    return React.createElement('h4', {
      className: 'text-lg font-semibold font-inter mb-2 mt-4 text-foreground'
    }, children);
  },

  p({ children }) {
    return React.createElement('p', {
      className: 'mb-4 text-muted-foreground leading-relaxed'
    }, children);
  },

  ul({ children }) {
    return React.createElement('ul', {
      className: 'mb-4 space-y-2 list-disc list-inside text-muted-foreground'
    }, children);
  },

  ol({ children }) {
    return React.createElement('ol', {
      className: 'mb-4 space-y-2 list-decimal list-inside text-muted-foreground'
    }, children);
  },

  li({ children }) {
    return React.createElement('li', {
      className: 'leading-relaxed'
    }, children);
  },

  blockquote({ children }) {
    return React.createElement('blockquote', {
      className: 'border-l-4 border-circleTel-orange pl-4 py-2 mb-4 bg-muted/50 rounded-r'
    }, children);
  },

  table({ children }) {
    return React.createElement('div', {
      className: 'overflow-x-auto mb-4'
    }, React.createElement('table', {
      className: 'w-full border-collapse border border-border rounded-lg'
    }, children));
  },

  thead({ children }) {
    return React.createElement('thead', {
      className: 'bg-muted'
    }, children);
  },

  tbody({ children }) {
    return React.createElement('tbody', {}, children);
  },

  tr({ children }) {
    return React.createElement('tr', {
      className: 'border-b border-border'
    }, children);
  },

  th({ children }) {
    return React.createElement('th', {
      className: 'px-4 py-2 text-left font-semibold text-foreground'
    }, children);
  },

  td({ children }) {
    return React.createElement('td', {
      className: 'px-4 py-2 text-muted-foreground'
    }, children);
  },

  a({ children, href }) {
    const isExternal = href?.startsWith('http');
    return React.createElement('a', {
      href: href,
      className: 'text-circleTel-orange hover:underline',
      target: isExternal ? '_blank' : undefined,
      rel: isExternal ? 'noopener noreferrer' : undefined
    }, children);
  },

  img({ src, alt }) {
    return React.createElement('div', {
      className: 'mb-4'
    }, [
      React.createElement('img', {
        key: 'image',
        src: src,
        alt: alt,
        className: 'max-w-full h-auto rounded-lg border shadow-sm'
      }),
      alt ? React.createElement('p', {
        key: 'caption',
        className: 'text-sm text-muted-foreground mt-2 text-center italic'
      }, alt) : null
    ]);
  },

  hr() {
    return React.createElement('hr', {
      className: 'my-8 border-border'
    });
  }
};

export const markdownOptions = {
  remarkPlugins: [],
  rehypePlugins: []
};