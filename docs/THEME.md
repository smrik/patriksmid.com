# Shared website theme

[Open the component reference](https://patriksmid.com/theme/). The portfolio hosts the stylesheet and theme switch. Use the same classes with HTML, React, Astro or a server template.

| Element | Classes |
| --- | --- |
| Page container | `.patrik-shell` |
| Site navigation | `.patrik-sitebar`, `.patrik-sitebar-inner`, `.patrik-sitebar-brand`, `.patrik-sitebar-links` |
| Directory or results | `.patrik-list` on a list, with one link per row |
| Responsive columns | `.patrik-grid` on a list or card container |
| Group of controls | `.patrik-toolbar` around labeled inputs or buttons |
| Form controls | `.patrik-field` on inputs/selects, `.patrik-button` on buttons or links |
| Bordered panel | `.patrik-card` |

Use the `--patrik-bg`, `--patrik-surface`, `--patrik-ink`, `--patrik-muted`, `--patrik-line` and `--patrik-accent` tokens for custom components. Spacing steps `--patrik-space-1` through `-4` are 4, 8, 12 and 16 CSS pixels at the default font size. Use `--patrik-radius` for square controls. Touch controls have a 44px minimum height.

```html
<ul class="patrik-list">
  <li><a href="/reports/">Reports</a></li>
  <li><a href="/sources/">Data sources</a></li>
</ul>
```

For privileged pages, vendor the reviewed CSS and its relative import on the same host. Keep existing CSP and authentication boundaries. Test both palettes, keyboard focus, and wrapping at 320px, 412px and desktop width. Use a new versioned URL for incompatible changes.

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

## Sidebar and phone drawer

Load `/theme/shell.css` after v2.css and defer `/theme/shell.js`. Both are served by patriksmid.com. Add `data-patrik-shell` to the existing site bar. Include a home link with class `patrik-sitebar-brand`, a `nav` of ordinary links, and optionally the existing appearance selector. Use a single shell per page. Keep forms, app commands and privileged controls outside the source header. Label current routes with `aria-current` when the URL alone is ambiguous.

The desktop sidebar becomes a menu button and modal drawer at 56rem. It uses the links supplied by each site, so personal services can stay in the authenticated Hub. Without the script, the original header still works. Private apps can serve a reviewed same-origin copy.
