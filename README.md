# GlobalPride-Admin

Admin dashboard for GlobalPride, built with React, TypeScript, Vite and Tailwind CSS.

## Getting started

```bash
yarn install
cp .env.example .env   # then fill in the API URL
yarn dev
```

## Scripts

| Command        | Description                          |
| -------------- | ------------------------------------ |
| `yarn dev`     | Start the dev server                 |
| `yarn build`   | Typecheck and build for production   |
| `yarn lint`    | Run ESLint                           |
| `yarn preview` | Preview the production build locally |

## Environment variables

| Variable           | Description               |
| ------------------ | ------------------------- |
| `VITE_API_URL`     | Base URL of the API       |
| `VITE_APP_NAME`    | Display name of the app   |
| `VITE_API_VERSION` | API version, e.g. `v1`    |
