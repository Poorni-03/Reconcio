# Reconcio

Reconcio is a multi-tenant SaaS platform that automates matching incoming customer payments with open invoices, reducing manual reconciliation effort and improving cash position accuracy for Indian businesses.

## Features

- Automated payment-to-invoice matching:
  - **Tier 1:** Rule-based matching
  - **Tier 2:** AI-assisted matching
- Support for exact and partial matches, with deduction reason tracking
- Exception queue for unmatched or low-confidence transactions
- Match resolution workflow:
  - confirm
  - partial
  - adjust
  - unapply
  - unmatch
- TDS rate configuration and customer credit balance tracking
- Email notifications for:
  - payment receipts
  - balance due reminders
  - credit alerts

## Tech Stack

- **Frontend:** React, Vite, Tailwind CSS
- **Backend:** Node.js, Express (plain JavaScript)
- **Database:** MongoDB Atlas (via Mongoose ODM)
- **AI / Embeddings:** NVIDIA Build API
  - `nvidia/nv-embed-v1` (embeddings)
  - `nvidia/nemotron-mini-4b-instruct` (reasoning)
- **Search:** Atlas Vector Search (`invoice_vector_index`)
- **Matching Engine:** Tier 1 rule-based + Tier 2 AI-assisted + Fuse.js fuzzy-match fallback
- **File Handling:** Multer, fast-csv, pdf-parse, Tesseract.js (OCR)
- **Email:** Nodemailer + Mailtrap sandbox SMTP
- **Validation:** Zod

## Getting Started

### Prerequisites

- Node.js (LTS recommended)
- npm
- MongoDB Atlas instance (free M0 tier works)
- NVIDIA Build API key
- Mailtrap sandbox account

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Poorni-03/Reconcio.git
   cd Reconcio
   ```

2. Install backend and frontend dependencies separately:
   ```bash
   cd backend
   npm install
   cd ../frontend
   npm install
   ```

## Project Goal

Reconcio helps finance teams reduce manual reconciliation workload, improve matching accuracy, and maintain a clearer, real-time cash position.
