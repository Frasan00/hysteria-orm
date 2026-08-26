# Hysteria ORM Documentation

This is the documentation website for Hysteria ORM, built using Docusaurus as the underlying documentation framework.

## Getting Started

### Installation

```bash
yarn install
```

### Local Development

```bash
yarn start
```

This command starts a local development server and opens up a browser window. Most changes are reflected live without having to restart the server.

### Build

```bash
yarn build
```

This command generates static content into the `build` directory that can be served using any static contents hosting service.

### Deployment

```bash
yarn deploy
```

This command builds the website and deploys it to GitHub Pages.

## Project Structure

```
website/
├── docs/              # Documentation files (Markdown)
├── src/
│   ├── css/          # Custom styling
│   └── components/   # React components (if needed)
├── static/
│   └── img/          # Static assets like logos
├── docusaurus.config.ts  # Site configuration
└── sidebars.ts       # Sidebar navigation structure
```

## Features

- **Direct Documentation Access**: The site redirects directly to the documentation, skipping any landing page
- **Custom Branding**: Clean interface with custom Hysteria ORM branding
- **Dark Mode**: Full dark mode support
- **Search**: Built-in documentation search
- **Mobile Responsive**: Optimized for all screen sizes

## Customization

### Colors

Theme colors can be modified in `src/css/custom.css`. The current theme uses an indigo/blue color scheme matching the Hysteria ORM logo.

### Logo

The logo is located at `static/img/logo.svg` and can be replaced with any SVG or image file.

### Navigation

The sidebar structure is defined in `sidebars.ts`. Update this file to add or reorganize documentation sections.

## Documentation Writing

Documentation files are written in Markdown and located in the `docs/` directory. Each file automatically becomes a page in the documentation.

For more information about writing documentation, visit the [Docusaurus documentation](https://docusaurus.io/docs/markdown-features).
