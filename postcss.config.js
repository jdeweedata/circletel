module.exports = {
  plugins: {
    // Inline CSS @import (e.g. typeset.css) before Tailwind runs, so @layer
    // components inside imported files resolves against @tailwind components.
    'postcss-import': {},
    tailwindcss: {},
    autoprefixer: {},
  },
};