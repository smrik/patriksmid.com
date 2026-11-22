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

## System, Light, and Dark

Use `v2.css` with `v2.js` for sites that support both palettes. The script
follows the OS setting by default and remembers a manual choice on the
current hostname. Set `data-patrik-color` on the HTML element. Load the script
in the head before the theme stylesheet to apply saved choices on first render.

```html
<html lang="en" data-patrik-color>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="theme-color" content="#f4f0e8" data-patrik-theme-color>
    <script src="https://patriksmid.com/theme/v2.js"></script>
    <link rel="stylesheet" href="https://patriksmid.com/theme/v2.css">
  </head>
  <body>
    <label class="patrik-theme-control">
      Theme
      <select class="patrik-field" data-patrik-theme>
        <option value="auto">System</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
    </label>
  </body>
</html>
```

Read `data-theme` on the HTML element for a resolved theme in scripts or
canvas charts. Prefer CSS tokens for text and surfaces. Check keyboard focus
and contrast in both modes and confirm the controls fit at 320px.
