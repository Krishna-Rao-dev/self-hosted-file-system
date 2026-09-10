# Self-Hosted File Management System

A scalable, self-hosted cloud file management platform designed for secure storage, organization, sharing, and retrieval of large files. The system separates file metadata from object storage and uses direct S3 transfers to minimize backend bandwidth and improve scalability.

---

Traditional file management applications often route uploaded files through the application server before storing them in object storage. This introduces unnecessary network and memory overhead, makes large-file transfers expensive, and can turn the backend into a bottleneck as concurrent users increase.

This project addresses these limitations by separating:

* **Metadata management** — users, folders, permissions, file information
* **Object storage** — actual file contents
* **File transfer** — direct browser-to-object-storage communication

The result is a lightweight backend that focuses on authentication, authorization, metadata, and access control while large file transfers are handled directly by object storage.

---

## Key Features

* JWT-based authentication
* Role-based access control (RBAC)
* Hierarchical folder management
* Secure presigned file uploads
* Presigned downloads with temporary access
* Multipart uploads for large files
* File deletion and management
* File metadata and search
* Private object storage
* File integrity verification using checksums
* Storage quota tracking
* Database indexing for efficient metadata queries


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


## Design Principle

The application does **not** send large files through the Node.js server.

Instead:

```text
Upload:

Browser
   │
   │ Request upload URL
   ▼
Node.js
   │
   │ Presigned URL
   ▼
Browser
   │
   │ Direct upload
   ▼
AWS S3
```

Similarly, downloads use temporary presigned URLs:

```text
Browser
   │
   │ Request file
   ▼
Node.js
   │
   │ Verify ownership / permissions
   │ Generate presigned URL
   ▼
Browser
   │
   │ Direct download
   ▼
AWS S3
```

This keeps the backend focused on **control-plane operations** rather than acting as a file-transfer proxy.

---

## Data Model

The system maintains file metadata separately from the actual file contents.

### Users

```text
users
├── id
├── email
├── password_hash
├── storage_used
├── storage_limit
└── created_at
```

### Folders

```text
folders
├── id
├── user_id
├── parent_folder_id
├── name
└── created_at
```

`parent_folder_id` enables recursive folder hierarchies.

### Files

```text
files
├── id
├── user_id
├── folder_id
├── original_name
├── s3_key
├── mime_type
├── size
├── checksum
├── created_at
└── updated_at
```

PostgreSQL stores the metadata while AWS S3 stores the actual file objects.

---

## Large File Handling

Large files are handled using multipart uploads.

A large file is divided into independently uploaded parts:

```text
1 GB File
      │
      ├── Part 1
      ├── Part 2
      ├── Part 3
      ├── ...
      └── Part N
             │
             ▼
          AWS S3
```

Parts can be uploaded concurrently and failed parts can be retried independently instead of restarting the entire upload.

This improves reliability and transfer performance for large files.

---

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

Checksums are maintained for uploaded files and can be compared against downloaded files to verify data integrity.

---


## API Overview

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
POST   /api/folders
GET    /api/folders/:id
PATCH  /api/folders/:id
DELETE /api/folders/:id
```

### Sharing

```http
POST   /api/files/:id/share
GET    /api/share/:token
DELETE /api/share/:token
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

### Team File Management

Organizations can use the system for:

* Shared project folders
* Role-based access
* Internal document storage
* Temporary file sharing

### Educational Platforms

Useful for:

* Student assignment submissions
* Course material storage
* Project repositories
* Faculty resource sharing

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

The system is designed so that file-transfer traffic and API traffic can scale independently.

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

## Performance Testing

Load testing should evaluate:

```text
Concurrent users
       ↓
API throughput
       ↓
p95 / p99 latency
       ↓
Error rate
       ↓
CPU / memory
       ↓
Database utilization
       ↓
S3 transfer throughput
```

The primary objective is to identify the system's saturation point while maintaining acceptable latency and reliability.

---

## Tech Stack

```text
Backend       → Node.js, Express.js
Database      → PostgreSQL
Object Store  → AWS S3
Authentication→ JWT
Frontend      → React
Deployment    → AWS EC2, RDS, S3, CloudFront
Testing       → Load testing / benchmarking
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
