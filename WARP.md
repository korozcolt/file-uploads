# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Overview

This project is a Node.js + TypeScript service for uploading, organizing, and serving images. It uses Express as its framework.

## Architecture

- **Storage**: The service uses the local filesystem for storing images, organized by project in the `storage/{projectId}` directory. Metadata is stored in SQLite if available, with a fallback to a `data.json` file.
- **Authentication**: JWT is used for admin authentication and for generating signed URLs for temporary public access to images.
- **API**: The core functionalities are exposed through a RESTful API:
    - `POST /auth/login`: Authenticates an admin user.
    - `GET /projects`, `POST /projects`, `GET /projects/:slug`, `DELETE /projects/:id`: Manage projects.
    - `POST /upload`: Uploads an image.
    - `GET /images`, `GET /images/:id`: List and retrieve images.
    - `POST /images/:id/sign`: Generates a signed URL for an image.
- **Configuration**: The service is configured through environment variables. A `.env` file is used in development.
- **CI/CD**: GitHub Actions are set up for continuous integration and deployment. The workflow includes linting, building, testing, and deploying the application via SSH.

## Common Commands

- **Build**: `npm run build` (compiles TypeScript to JavaScript)
- **Development**: `npm run dev` (starts the server in development mode with hot-reloading)
- **Start**: `npm start` (starts the server from the compiled code)
- **Lint**: `npm run lint` (lints the codebase)
- **Format**: `npm run format` (formats the code with Prettier)
- **Test**: `npm test` (runs the test suite)
- **Generate Docs**: `npm run docs` (generates OpenAPI documentation)
- **Seed Admin**: `npm run seed-admin` (seeds the database with an admin user)
