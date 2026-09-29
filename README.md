# Scoobies Sales & Commercial Intelligence Dashboard

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-19.3-blue.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-7.0-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.3-646CFF.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.3-38B2AC.svg)](https://tailwindcss.com/)
[![Groq AI](https://img.shields.io/badge/AI-Groq_Cloud-f55036.svg)](https://groq.com/)
[![Resend](https://img.shields.io/badge/Email-Resend-black.svg)](https://resend.com/)

An executive-grade, real-time sales analytics and commercial intelligence platform built for **Scoobies**—a high-growth lifestyle, stationery, and kids accessories brand.

Scoobies Dashboard provides commercial teams, e-commerce leads, and C-suite leadership with end-to-end visibility into gross vs. net revenue, marketplace channel economics, product margins, return rate leakage, and an integrated **Groq-powered AI Strategic Advisor** with voice query capabilities and automated executive email distribution.

---

## Table of Contents

- [What the Project Does](#what-the-project-does)
- [Why It Matters (Key Features)](#why-it-matters-key-features)
- [Architecture & Tech Stack](#architecture--tech-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Configuration](#environment-configuration)
  - [Running the Development Server](#running-the-development-server)
  - [Building for Production](#building-for-production)
- [Data Ingestion & CSV Schema](#data-ingestion--csv-schema)
  - [Auto-Detected Columns](#auto-detected-columns)
  - [Sample Data Format](#sample-data-format)
- [AI Strategic Advisor & Voice Intelligence](#ai-strategic-advisor--voice-intelligence)
- [Email Sharing & Cloudflare Edge Functions](#email-sharing--cloudflare-edge-functions)
- [Project Directory Structure](#project-directory-structure)
- [Where Users Can Get Help](#where-users-can-get-help)
- [Contributing](#contributing)
- [License](#license)
- [Maintainer](#maintainer)

---

## What the Project Does

Scoobies Dashboard turns fragmented sales spreadsheets into an interactive commercial command center without requiring a backend database. All data parsing, aggregation, and analytics computation are executed client-side with single-pass $O(N)$ efficiency and persisted locally in the browser via IndexedDB.

### Key Capabilities

1. **Instant Multi-Channel Analytics**: Compare revenue, unit volumes, and margins across D2C Website, Amazon, Quick Commerce (Blinkit, Zepto, Instamart), and Offline Retail.
2. **Margin & Profitability Tracking**: Real-time tracking of Gross Sales, Net Sales, Scoobies Margin, Retailer Margin, and Ex-GST Net Margins.
3. **Return Rate & Refund Leakage Detection**: Pinpoints high-return SKUs and channels leaking profit to returns and customer cancellations.
4. **AI Commercial Advisor**: Interactive assistant streaming answers via Groq Cloud (`openai/gpt-oss-120b`), supporting voice prompts via Whisper (`whisper-large-v3-turbo`) and executive personas.
5. **Deterministic Offline Fallback**: Generates instant quantitative diagnostic briefs even without an internet connection or API keys.
6. **Executive Reporting & Distribution**: Printable executive summary view (`window.print()`) and one-click HTML email delivery using the Resend API.

---

## Why It Matters (Key Features)

### 📈 Executive KPI Command Center

- **Gross vs. Net Revenue**: Tracks fulfilled net sales alongside gross orders and return adjustments.
- **Unit Economics & AOV**: Monitors total units dispatched, net units, and Average Order Value across all channels.
- **Margin Health**: Visualizes gross and Ex-GST Scoobies margin percentage against company benchmarks.
- **Quota Progress**: Set and track sales goals (e.g., ₹25 Lakh targets) with live progress bars and gap computations.
- **Campaign Insights**: Filter specifically for seasonal campaigns such as Back-to-School (B2S) vs. regular sales.

### 🔍 Deep-Dive Multi-Dimensional Filtering

- **Time Controls**: Filter by Year, Month, Week, or custom Date Ranges with multi-select support.
- **Marketplace & Channel**: Isolate performance for Amazon, Blinkit, Brand Website, and Retail.
- **Geographic Segmentation**: Explore performance by Zone (North, South, East, West), State, and Delivery City.
- **Product & Category Slicing**: Drill down into specific product categories (e.g., Bags, Stationery, Lunchboxes, Craft Kits) and individual SKU barcodes.

### 🔄 Dedicated Return & Refund Analysis

- Quantitative visibility into return rates by volume (%) and value (%).
- **Return Watchlist**: Ranked table of high-return items with refund loss metrics.
- Channel-level return comparison to detect packaging, delivery, or marketplace sizing mismatches.

### 🎙️ AI Strategic Advisor (`⌘J` / `Ctrl+J`)

- **High-Speed Groq Inference**: Real-time Server-Sent Events (SSE) streaming with sub-second response times.
- **Context Distiller**: Compresses active filters, top SKUs, channel trends, and margin leaks into focused prompt context.
- **Voice-to-Text Input**: Record audio directly in the browser; transcribed and domain-enriched using Groq Whisper.
- **Adaptive Personas**: Switch perspectives on demand (CFO, Performance Marketer, E-Commerce Lead, Merchandising Director, Supply Chain Lead).
- **Offline Mode**: Client-side heuristic calculation produces a structured performance brief when offline.

### 📤 Executive Sharing & Data Portability

- **Filtered CSV Export**: Download filtered subsets of transactions for further external analysis.
- **Print / PDF Briefing**: Formatted print preview for board meetings and executive reviews.
- **Direct Email Dispatch**: Send structured HTML executive briefings to stakeholders directly from the app.

---

## Architecture & Tech Stack

| Layer                       | Technologies                                                                                                               |
| :-------------------------- | :------------------------------------------------------------------------------------------------------------------------- |
| **Framework & UI**          | [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Vite 8](https://vitejs.dev/)               |
| **Styling & Design System** | [Tailwind CSS v4](https://tailwindcss.com/) (`@tailwindcss/vite`), Custom Earthy Palette (`#5F7161`, `#F9F7F2`, `#433E37`) |
| **Data Visualizations**     | [Recharts](https://recharts.org/) (Area, Bar, Composed, and Donut charts)                                                  |
| **Icons & Typography**      | [Lucide React](https://lucide.dev/), Google Fonts (_Outfit_ and _Plus Jakarta Sans_)                                       |
| **File & Data Parsing**     | [PapaParse](https://www.papaparse.com/) (streaming CSV parser)                                                             |
| **Client Storage**          | Browser IndexedDB (via [src/utils/indexedDb.ts](src/utils/indexedDb.ts))                                                   |
| **AI & Voice Services**     | [Groq Cloud API](https://console.groq.com/) (`openai/gpt-oss-120b`, `whisper-large-v3-turbo`)                              |
| **Email Service**           | [Resend REST API](https://resend.com/) with [Cloudflare Pages Functions](functions/api/resend/emails.ts) edge proxy        |

---

## Getting Started

### Prerequisites

Ensure you have the following installed on your machine:

- **Node.js**: `v18.0.0` or higher (Node 20+ recommended)
- **npm**: `v9.0.0` or higher (or `pnpm` / `yarn`)

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/masanthimanshu/scoobies-dashboard.git
   cd scoobies-dashboard
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Environment Configuration

Copy the example environment file to `.env`:

```bash
cp .env.example .env
```

Configure your API keys in `.env`:

```env
# Groq Cloud API Key for AI Strategic Advisor (https://console.groq.com)
GROQ_API_KEY=gsk_your_groq_api_key_here

# Resend API Key for Email Briefing Sharing (https://resend.com)
RESEND_API_KEY=re_your_resend_api_key_here
```

> [!NOTE]
> API keys can also be configured directly in the app UI via the AI Advisor settings panel and email share dialog. If no Groq API key is present, the dashboard seamlessly switches to its built-in **Deterministic Offline Engine**.

### Running the Development Server

Start the local Vite development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5173` (or the next available port). Vite automatically proxies `/api/resend` requests to avoid browser CORS restrictions.

### Building for Production

Compile the TypeScript code and generate optimized production assets:

```bash
npm run build
```

The compiled output will be written to the `dist/` directory, ready to be deployed on static hosting platforms such as Cloudflare Pages, Vercel, or Netlify.

---

## Data Ingestion & CSV Schema

Scoobies Dashboard includes an adaptive CSV parser ([src/utils/csvParser.ts](src/utils/csvParser.ts)) that automatically normalizes varying column names, currency symbols (`₹`, `$`), Excel serial dates, negative refund quantities, and status strings.

### Auto-Detected Columns

| Data Field              | Supported Column Aliases                               | Description                                                          |
| :---------------------- | :----------------------------------------------------- | :------------------------------------------------------------------- |
| **Date**                | `Date`, `Order Date`                                   | Order date (supports `DD/MM/YYYY`, `YYYY-MM-DD`, Excel serial dates) |
| **Year / Month / Week** | `Year`, `Month`, `Week`                                | Temporal grouping dimensions                                         |
| **Order Number**        | `Order Number`, `OrderNo`, `OrderId`                   | Unique transaction identifier                                        |
| **Customer Name**       | `Customer Name`, `Customer`, `Buyer`                   | Buyer identity                                                       |
| **Bar Code / SKU**      | `Bar Code`, `Barcode`, `SKU`, `Item Code`              | Product identifier                                                   |
| **Product Name**        | `Product Name`, `Item Name`, `Product`, `Title`        | SKU title                                                            |
| **Category**            | `PRODUCT CATEGORY`, `Category`                         | Category grouping (e.g., Stationery, Bags, Art)                      |
| **Quantity**            | `QTY`, `Quantity`, `Units`                             | Dispatched count (negative indicates return)                         |
| **MRP / Unit Price**    | `MRP`, `Price`, `Unit Price`                           | Maximum retail price per unit                                        |
| **Margins**             | `Scoobies Margin`, `Retailers Margin`, `EX-GST Margin` | Brand margin and channel margin values                               |
| **Channel / Website**   | `Website`, `Channel`, `Platform`, `Portal`             | Channel (e.g., `Amazon`, `Blinkit`, `Office Website`)                |
| **Status**              | `Status`                                               | `Dispatched`, `Return`, `Cancelled`                                  |
| **Campaign**            | `Back To School`, `B2S`, `Campaign`                    | Identifies promotional campaign cohorts                              |
| **Location / Region**   | `Delivery Place`, `State`, `Zone`                      | Delivery city, state, and geographic zone                            |

### Sample Data Format

A downloadable CSV template is provided within the import modal. A standard row format appears as follows:

```csv
Year,Month,Week,Day,Date,Order Number,Customer name,Bar Code,Product name,Color,PRODUCT CATEGORY,QTY,MRP,MRP Value,Scoobies Margin,Retailers Margin,EX-GST Scoobies Margin,Delivery Place,State,Website,Status,Received Payment,Back To School,Zone,Sale Value
2026,Aug,Week1,1,1/8/2026,16542,Ekta Gupta,SC0000190,Wrapping Sheets (Assorted),Multi,Wrapping Sheets,1,89,89,20,0,16.95,North Delhi,Delhi,Office Website,Dispatched,,With out B2S,North,20
```

---

## AI Strategic Advisor & Voice Intelligence

The AI Advisor ([src/components/AiAdvisorDrawer.tsx](src/components/AiAdvisorDrawer.tsx)) acts as a dedicated commercial analyst:

```
┌────────────────────────────────┐
│      User Prompt / Voice       │
└───────────────┬────────────────┘
                │
                ▼
┌────────────────────────────────┐      ┌─────────────────────────────┐
│  Groq Whisper Transcription    │ ───► │ Prompt Refinement Engine    │
│  (whisper-large-v3-turbo)      │      │ (Domain-specific polishing) │
└────────────────────────────────┘      └──────────────┬──────────────┘
                                                       │
                                                       ▼
┌────────────────────────────────┐      ┌─────────────────────────────┐
│  Client Analytics State        │ ───► │ AI Context Distiller        │
│  (Filtered Sales, KPIs, Trends)│      │ (Markdown context payload)  │
└────────────────────────────────┘      └──────────────┬──────────────┘
                                                       │
                                                       ▼
                                        ┌─────────────────────────────┐
                                        │ Groq Streaming LLM          │
                                        │ (openai/gpt-oss-120b)       │
                                        └──────────────┬──────────────┘
                                                       │
                                                       ▼
                                        ┌─────────────────────────────┐
                                        │ Real-Time SSE Response      │
                                        │ (Diagnosis, Cause, Action)  │
                                        └─────────────────────────────┘
```

### Hotkey Shortcut

Press <kbd>⌘</kbd> + <kbd>J</kbd> (macOS) or <kbd>Ctrl</kbd> + <kbd>J</kbd> (Windows/Linux) from anywhere in the app to toggle the AI Advisor drawer.

---

## Email Sharing & Cloudflare Edge Functions

The application includes an end-to-end briefing delivery flow powered by [Resend](https://resend.com):

1. **Development Mode**: Vite proxies requests from `/api/resend/emails` directly to `https://api.resend.com/emails` via `vite.config.ts`.
2. **Production Mode (Cloudflare Pages)**: The serverless function located at [functions/api/resend/emails.ts](functions/api/resend/emails.ts) handles incoming requests, injects credentials from environment variables, and forwards payloads to the Resend API with full CORS support.

---

## Project Directory Structure

```text
scoobies-dashboard/
├── .env.example                   # Template environment variables
├── functions/                     # Cloudflare Pages serverless edge functions
│   └── api/
│       └── resend/
│           └── emails.ts          # Edge proxy for Resend email dispatch
├── index.html                     # HTML root entry with Google Fonts
├── package.json                   # Project dependencies and npm scripts
├── src/
│   ├── App.tsx                    # Main dashboard layout and view controller
│   ├── components/
│   │   ├── AiAdvisorDrawer.tsx    # Slide-over AI advisor with chat & voice input
│   │   ├── AiFloatingButton.tsx   # Floating action button (⌘J trigger)
│   │   ├── BasketSizeAov.tsx      # AOV and basket size distribution analytics
│   │   ├── ChannelBreakdown.tsx   # Marketplace revenue & margin performance
│   │   ├── ExecutiveSummary.tsx   # Actionable insight cards and alerts
│   │   ├── FilterBar.tsx          # Multi-dimensional filter toolbar
│   │   ├── GeoAnalytics.tsx       # Regional leaderboard (Zones, States, Cities)
│   │   ├── GoalModal.tsx          # Target quota configuration modal
│   │   ├── KpiGrid.tsx            # Executive KPI metrics grid
│   │   ├── Navbar.tsx             # Main header with file status & actions
│   │   ├── OrdersTable.tsx        # Searchable and sortable transaction table
│   │   ├── PrintReportView.tsx    # Print-optimized executive briefing modal
│   │   ├── ProductCategoryAnalytics.tsx # Category & top SKU performance
│   │   ├── ReturnAnalysis.tsx     # Return rate & refund leak analysis
│   │   ├── ShareChatModal.tsx     # Email sharing dialog via Resend API
│   │   └── UploadModal.tsx        # Drag-and-drop CSV upload modal
│   ├── services/
│   │   ├── emailService.ts        # Client service for Resend email integration
│   │   └── groqService.ts         # Groq LLM streaming, Whisper audio & prompt refiner
│   ├── types.ts                   # Core TypeScript domain models & interfaces
│   └── utils/
│       ├── aiContextDistiller.ts  # Compiles dashboard metrics into LLM prompt context
│       ├── analytics.ts           # Single-pass analytics computation engine
│       ├── chatEmailTemplate.ts   # Responsive HTML email layout generator
│       ├── csvParser.ts           # Streaming CSV parser & column normalizer
│       ├── formatters.ts          # Currency, percentage, and date utilities
│       ├── indexedDb.ts           # Browser IndexedDB storage driver
│       └── offlineAiEngine.ts     # Deterministic offline strategic brief generator
├── tsconfig.json                  # TypeScript compiler configuration
└── vite.config.ts                 # Vite bundler, Tailwind v4 plugin & proxy setup
```

---

## Where Users Can Get Help

- **Documentation & Questions**: Open an issue on the [GitHub Issues](https://github.com/masanthimanshu/scoobies-dashboard/issues) page.
- **Feature Requests & Ideas**: Start a thread under [GitHub Discussions](https://github.com/masanthimanshu/scoobies-dashboard/discussions).
- **API Keys & Setup**:
  - Groq Cloud Console: [console.groq.com](https://console.groq.com)
  - Resend Email Console: [resend.com](https://resend.com)

---

## Contributing

Contributions from the community are warmly welcomed! To contribute:

1. **Fork the Repository**: Click the **Fork** button on GitHub.
2. **Create a Feature Branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Commit Your Changes**: Follow clear, conventional commit messages:
   ```bash
   git commit -m "feat: add channel return comparison chart"
   ```
4. **Push to Your Fork**:
   ```bash
   git push origin feature/your-feature-name
   ```
5. **Open a Pull Request**: Submit a PR to `main` with a clear explanation of changes and test steps.

Please ensure the project builds cleanly (`npm run build`) before opening a pull request.

---

## License

This project is licensed under the terms of the [MIT License](LICENSE).

---

## Maintainer

Maintained with ❤️ by **[Himanshu Masanth](https://github.com/masanthimanshu)**.
