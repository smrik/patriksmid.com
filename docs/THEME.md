# Shared website theme

The portfolio publishes the theme at [v1.css](https://patriksmid.com/theme/v1.css).
Include it in a site's layout or HTML head.

```html
<link rel="stylesheet" href="https://patriksmid.com/theme/v1.css">
```

| Use | Styles |
| --- | --- |
| Common colors and type | `--patrik-bg`, `--patrik-surface`, `--patrik-ink`, `--patrik-muted`, `--patrik-line`, `--patrik-accent`, `--patrik-font`, `--patrik-heading` |
| Page width and side margins | `.patrik-shell` |
| Header | `.patrik-sitebar` on the header, `.patrik-sitebar-inner` on its child, `.patrik-sitebar-brand` on the home link, and `.patrik-sitebar-links` on the navigation |
| Cards that wrap at narrow widths | `.patrik-grid` around elements with `.patrik-card` |
| Common controls | `.patrik-button` on buttons or links and `.patrik-field` on inputs and selects with accessible labels |

Use semantic HTML and a responsive viewport. Check the page at 320px, 390px
and a desktop width. Keyboard-test links and controls. Keep wide tables and
charts inside their own scroll area when they need more space.

Publish additive fixes via the portfolio's existing GitHub workflow. Keep
class names and tokens compatible on v1. For breaking changes, publish a new
version and update each consuming site through its own release workflow.
