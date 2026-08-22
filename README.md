# Self-hosted File System

A small private cloud file manager. PostgreSQL stores metadata, private S3 stores file bytes, and the Node.js API handles authentication, permissions, metadata, and short-lived presigned URLs.

## Setup

1. Copy `backend/.env.example` to `backend/.env` and fill in the database, JWT, and S3 values.
2. Copy `frontend/.env.example` to `frontend/.env` if the API is not on `http://localhost:4000/api`.
3. Create a PostgreSQL database and run the files in `backend/migrations` in order.
4. Install and start each package with `npm install` and `npm run dev`.

The API provides `/health`, auth, folder, file upload/download, and share-link endpoints. File bytes move directly between the browser and S3 through presigned URLs. AWS credentials never reach the frontend.

Multipart uploads, virus scanning, versioning, and production deployment automation are intentionally left for later.