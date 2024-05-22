# Visited Stations Map

Google Sheets-powered map of visited railway stations, inspired by [t5r7's station mapper](https://github.com/t5r7/station-mapper).

- Powered by Cloudflare Pages and Cloudflage Pages Functions
- Data stored in easily-maintainable Google Sheets
- Automatically updates map when data changes
- Uses performant, self-hosted vector OSM tiles with MapLibre GL JS

## Local development

1. Clone the repository
2. Install dependencies with `yarn install`
3. Run with `yarn dev`

## Deployment

Changes are automatically deployed using GitHub Actions to Cloudflare Pages when pushing to the `deploy` branch.
