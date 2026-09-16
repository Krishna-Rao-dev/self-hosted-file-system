# Self-Hosted File Management System

A self-hosted cloud file management platform designed for secure storage, organization, sharing, and retrieval of large files. The system separates file metadata from object storage and uses direct S3 transfers to minimize backend bandwidth and improve scalability.

Traditional file management applications often route uploaded files through the application server before storing them in object storage. This introduces unnecessary network and memory overhead, makes large-file transfers expensive, and can turn the backend into a bottleneck as concurrent users increase.

This project addresses these limitations by separating:

* **Metadata management** -> users, folders, file information
* **Object storage** -> actual file contents
* **File transfer** -> direct browser-to-object-storage communication

It is built with React, Express, PostgreSQL, and Amazon S3. PostgreSQL stores users and file metadata; S3 stores the file contents. The browser uploads and downloads file bytes directly through short-lived S3 presigned URLs, so the Node.js API does not proxy the file contents.

## Key Features

* **Authentication & Authorization:** Secure email/password login using JWT tokens (`localStorage` persistence), parameterized PostgreSQL queries, and strict resource ownership checks.
* **File & Folder Management:** Full file system capabilities including nested folder creation, directory browsing, filename/foldername search, renaming, and deletion.
* **S3 File Transfers & Storage Tracking:** Direct file uploads via S3 `PutObject`, secure downloads using temporary S3 `GetObject` presigned URLs, SHA-256 integrity verification.
* **Expiring Share Links:** API endpoints to generate, manage, and revoke temporary file-sharing links with optional expiration limits.
* **React Frontend:** Modern web dashboard supporting core user workflows including authentication, folder navigation, file uploads/downloads, search, and storage management.
---

## Architecture
<img width="556" height="1128" alt="image (2)" src="https://github.com/user-attachments/assets/7c635888-08d1-4a23-b3a6-7a99a1d44ee0" />


## Prototype Images 

<img width="1917" height="911" alt="image" src="https://github.com/user-attachments/assets/68cad9c7-87ff-48d7-9c6e-c52f94fcc0ec" />

<br/>
<br/>
<img width="1897" height="907" alt="image" src="https://github.com/user-attachments/assets/fc1498b2-8701-430b-bb2d-4abbe6ccec46" />

<br/>
<br/>
<img width="1917" height="907" alt="image" src="https://github.com/user-attachments/assets/7282401b-43a6-4498-88cb-a118557ef522" />
<br/>
<br/>
<img width="1902" height="907" alt="image" src="https://github.com/user-attachments/assets/d2391884-62b8-4cc6-a44c-5001e99228f3" />
<br/>
<br/>
<img width="1912" height="907" alt="image" src="https://github.com/user-attachments/assets/cdf0499d-38e7-4aad-9fda-2c8082be53e2" />
<br/>
<br/>
<img width="1497" height="897" alt="image" src="https://github.com/user-attachments/assets/79baf2d1-1b86-4273-95a2-6283261e6e7e" />
<br/>
<br/>
<img width="1566" height="912" alt="image" src="https://github.com/user-attachments/assets/7363b095-3250-43e8-9be7-9ed9588ce8e0" />
<br/>


## Security

Security is enforced at both the application and storage layers.

### Authentication

Users authenticate using JWT-based sessions.

### Authorization

Every file operation verifies ownership or the appropriate access permission before generating an S3 URL.

For example:

```text
User A
   │
   ├── File 101 ✓
   └── File 202 ✗
```

A user cannot obtain a presigned URL for another user's private object simply by knowing its file ID.

### Private S3 Storage

The S3 bucket remains private. Files are accessed through short-lived presigned URLs rather than publicly exposed object URLs.

### Integrity Verification

The browser calculates a SHA-256 checksum for each selected file and sends it when the upload is completed. The API stores the checksum with the file metadata. Downloads, including downloads through a public share link, are fetched through the temporary S3 URL and checked against that stored checksum before the browser saves the file. A mismatch stops the download and reports an integrity failure.

---


## API Overview

All endpoints require `Authorization: Bearer <token>` unless marked public. Request and response bodies are JSON.

### Authentication

```http
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
```

### Files

```http
POST   /api/files/upload-url
POST   /api/files/complete
GET    /api/files
GET    /api/files/:id
GET    /api/files/:id/download
PATCH  /api/files/:id
DELETE /api/files/:id
```

### Folders

```http
GET    /api/folders
POST   /api/folders
GET    /api/folders/:id
PATCH  /api/folders/:id
DELETE /api/folders/:id
```

### Sharing

```http
POST   /api/files/:id/share
GET    /api/share/:token       # public read-only access
DELETE /api/share/:token       # authenticated file owner
```

---

## Project 

```text
file-management-system/
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── app.js
│   │   └── server.js
│   │
│   ├── migrations/
│   ├── package.json
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── App.jsx
│   └── package.json
│
├── docker-compose.yml
└── README.md
```

---

## Deployment Architecture

The application can be deployed on AWS using:

```text
                    Internet
                       │
                       ▼
                 CloudFront
                  /       \
                 /         \
                ▼           ▼
          Frontend       Node.js API
             S3             EC2
                             │
                       ┌─────┴─────┐
                       ▼           ▼
                    RDS           S3
                 PostgreSQL    File Storage
```

### Infrastructure

* **Amazon S3** — private file/object storage
* **Amazon EC2** — Node.js backend
* **Amazon RDS** — PostgreSQL metadata database
* **CloudFront** — content delivery
* **Route 53** — DNS
* **AWS Certificate Manager** — HTTPS certificates
* **CloudWatch** — monitoring and logs

---

## Applications

The architecture can be adapted for several real-world use cases:

### Personal Cloud Storage

A private alternative to cloud drive applications for storing:

* Documents
* Photos
* Videos
* Backups
* Personal projects


### Enterprise Document Management

The architecture can be extended with:

* Fine-grained permissions
* Audit logs
* File versioning
* Retention policies
* Encryption
* Compliance controls

### Developer / SaaS Infrastructure

The same architecture can serve as the storage layer for applications requiring:

* User-generated content
* Media uploads
* PDF/document storage
* Dataset storage
* Backup systems

---

## Scalability Strategy

The system can be designed so that file-transfer traffic and API traffic can scale independently.

```text
API workload
    │
    ▼
Load Balancer
    │
 ┌──┴──┐
 ▼     ▼
API   API
 │     │
 └──┬──┘
    │
    ▼
PostgreSQL

File workload
    │
    ▼
Browser ───────────────► S3
```

As file traffic grows, the backend does not need to process every byte of every uploaded file.

Future scaling improvements include:

* Horizontal Node.js instances
* Redis caching
* Database read replicas
* CDN-based downloads
* S3 lifecycle policies
* Asynchronous background processing
* Distributed job queues
* Advanced search using OpenSearch

---


## Tech Stack

```text
Backend       → Node.js, Express.js
Database      → PostgreSQL
Object Store  → AWS S3
Authentication→ JWT
Frontend      → React
Deployment    → AWS EC2, RDS, S3, CloudFront
```

---

## Future Improvements

* Resumable uploads
* Redis-based caching
* File versioning
* Trash and automatic retention
* Duplicate-file detection
* Advanced full-text search
* End-to-end encryption
* Audit logging
* Background virus scanning
* Storage lifecycle management
* Horizontal API scaling

---
