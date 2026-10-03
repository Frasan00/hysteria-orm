# Documentation Website Changes

This document summarizes the changes made to remove Docusaurus branding and create a clean, vendor-neutral documentation site for Hysteria ORM.

## Lean documentation restructure

The docs were reduced from 67 pages to 46 and from roughly 13,000 lines to 9,000, without dropping public API coverage.

- Merged overlapping pages: `models/basics` and `models/hooks` into `models/define-model`; `models/zod-integration` into `models/validation`; `models/computed-columns` into `models/views`; `relations/load-strategy` into `relations/overview`; `advanced/atomic-decorator` into `advanced/transactions`; `advanced/sqlite-json-limitations` into `advanced/json`; `advanced/cte` into `query-builder/queries`; the CLI flag stubs into `cli/overview`; `bun-drivers` and `web-and-react-native-drivers` into `drivers`; `utils/overview` into `utils/api`.
- Rebuilt the query builder section as three concept pages: `overview`, `queries`, and `sql-functions`.
- Removed the stale hook system from the model docs (only `beforeFetch` exists as of 12.0.0) and corrected references to non-existent exports.
- Added a schema introspection reference covering `getTableSchema`, the `has*` predicates, and programmatic `syncSchema`.
- Added `@docusaurus/plugin-client-redirects` with a redirect for every removed route.
- Ran the humanizer skill over all pages to remove AI writing tells.
- Updated `AGENTS.md` to require a humanizer pass whenever `website/docs/` changes.

## Changes Made

### 1. **Direct Documentation Access**

- Configured `routeBasePath: "/"` in `docusaurus.config.ts` to make documentation the default route
- Removed the landing page (`src/pages/index.tsx` and related files)
- Site now redirects directly to documentation on load

### 2. **Removed Docusaurus Branding**

- Updated footer copyright to remove "Built with Docusaurus" text
- Removed Docusaurus-specific comments from configuration
- Updated social media card from Docusaurus branding to custom Hysteria ORM branding
- Cleaned up package.json scripts to remove unnecessary Docusaurus-specific commands

### 3. **Custom Branding & Logo**

- Created custom SVG logo featuring:
  - Three database layers (representing ORM abstraction)
  - Lightning bolt (representing speed and the "Hysteria" name)
  - Indigo/blue color scheme (#6366f1)
- Created matching social media card (`social-card.svg`)
- Removed all Docusaurus default images:
  - `docusaurus-social-card.jpg`
  - `docusaurus.png`
  - `undraw_docusaurus_*.svg` files

### 4. **Updated Color Scheme**

- Changed from Docusaurus default green to custom indigo/blue theme
- Updated both light and dark mode color palettes in `custom.css`
- Colors match the new logo design

### 5. **Simplified Navigation**

- Added proper documentation links to footer
- Organized footer into "Documentation" and "Community" sections
- Removed blog functionality (set to `false` in config)

### 6. **Enhanced Footer**

- Added quick links to main documentation sections:
  - Getting Started
  - SQL
  - MongoDB
  - Redis
- Added community links (GitHub, Issues)
- Clean, minimal design

## Files Modified

- `docusaurus.config.ts` - Main configuration updates
- `package.json` - Simplified scripts
- `src/css/custom.css` - New color scheme
- `README.md` - Updated documentation

## Files Deleted

- `src/pages/index.tsx` - Landing page
- `src/pages/index.module.css` - Landing page styles
- `src/pages/markdown-page.md` - Example page
- `src/components/HomepageFeatures/` - Landing page components
- All Docusaurus default images

## Files Created

- `static/img/logo.svg` - New Hysteria ORM logo
- `static/img/social-card.svg` - Social media card
- `CHANGES.md` - This file

## Testing

To verify the changes work correctly:

```bash
cd website
yarn install
yarn start
```

The site should:

1. Load directly to the documentation (not a landing page)
2. Display the new Hysteria ORM logo
3. Show the custom indigo/blue color scheme
4. Have a clean footer without Docusaurus branding

## Future Improvements

Consider these optional enhancements:

1. Add custom fonts for better branding
2. Create additional theme variations
3. Add custom documentation components
4. Implement custom search styling
5. Add animation effects to the logo

## Rollback

If you need to revert these changes, you can restore from git:

```bash
git checkout HEAD -- website/
```

Note: You'll lose the new logo and clean design, but regain the original Docusaurus template.
