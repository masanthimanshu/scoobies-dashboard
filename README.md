# Scoobies Sales — Commercial Intelligence & Analytics Dashboard

[![React](https://img.shields.io/badge/React-19.2-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-7.0-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.2-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.3-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](#license)

A high-performance, client-side executive sales analytics platform and AI-powered commercial advisory engine built for **Scoobies** (lifestyle, stationery, and kids accessories brand). 

It ingests raw multi-channel sales transaction CSVs, cleans and normalizes messy data client-side, computes complex margin and return metrics in real time, and provides leadership with actionable commercial intelligence through interactive visualizations and an integrated AI advisor.

---

## Table of Contents

- [What the Project Does](#what-the-project-does)
- [Key Features & Benefits](#key-features--benefits)
- [Architecture & Tech Stack](#architecture--tech-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Configuration](#environment-configuration)
  - [Development Server](#development-server)
  - [Production Build](#production-build)
- [CSV Data Ingestion & Schema](#csv-data-ingestion--schema)
  - [Expected Columns](#expected-columns)
  - [Data Cleaning & Resilient Parsing](#data-cleaning--resilient-parsing)
- [Project Structure](#project-structure)
- [AI Strategic Advisor & Resend Integration](#ai-strategic-advisor--resend-integration)
- [Contributing](#contributing)
- [Support](#support)
- [License](#license)

---

## What the Project Does

Modern omnichannel retail generates fragmented sales data across D2C websites, marketplaces (e.g., Amazon), quick commerce platforms (e.g., Blinkit), and distributor networks. **Scoobies Sales Dashboard** turns disjointed transaction exports into unified, real-time executive intelligence without requiring expensive cloud data warehouses.

The application:
1. **Parses & Enriches Data Client-Side**: Accepts raw transaction CSVs, normalizes date variations, handles missing columns, and reconciles return records.
2. **Aggregates Complex Commercial Metrics**: Calculates Gross Sales, Net Sales, Scoobies Margin, Retailers Margin, Ex-GST Margin, Return Rates (value and unit-based), and quota run-rate progress on the fly.
3. **Surfaces Deep Drilldowns**: Visualizes multi-metric sales trends across daily, weekly, monthly, and yearly intervals, channel breakdowns, category/SKU margins, return offender detection, and geographic heatmaps.
4. **Delivers AI Commercial Advisory**: Distills filtered dataset metrics into structured prompts sent to high-speed LLMs via Groq (with offline fallback), enabling executives to ask strategic questions and email briefings directly to stakeholders.

---

## Key Features & Benefits

### 📊 Real-Time Omnichannel KPI Engine
- **Gross vs. Net Realization**: Separate tracking of gross dispatch values against returned and canceled transactions.
- **Multi-Tier Margin Tracking**: Granular tracking for Scoobies Gross Margin, Retailer/Channel Margin, and Ex-GST Margin.
- **Quota & Run-Rate Bridge**: Dynamic target progress tracking with deficit/surplus run-rate calculations.
- **Basket Size & AOV Dynamics**: Order value distribution, unit basket clustering, and cross-channel average order value comparisons.

### 🔍 Multi-Dimensional Filtering & Presets
- **Temporal Slicing**: Single or multi-select filtering across years, calendar months, and fiscal weeks (Week 1–5), plus date-range pickers.
- **Channel & Category Filters**: Multi-select filtering for sales channels (Website, Amazon, Blinkit, Offline, etc.), product categories, zones, and states.
- **Status & Campaign Toggles**: Isolate dispatched vs. returned orders or Back-to-School (B2S) campaigns.
- **Global Search**: Search across order IDs, customer names, SKUs/barcodes, product titles, and delivery cities.

### 🧠 AI Commercial Advisor (Groq + Offline Fallback)
- **High-Speed Inference**: Powered by Groq Cloud (`openai/gpt-oss-120b` or custom models) with streaming responses.
- **Adaptive Executive Personas**: Tailor advice to specific executive roles (COO, CFO, Performance Marketer, Merchandising Director, E-Commerce Manager, Supply Chain Lead).
- **Automated Context Distillation**: Filtered data is automatically summarized into compact statistical digests before being sent to the LLM.
- **Built-in Heuristic Offline Engine**: Fallback rule-based diagnostic engine generates executive findings even when offline or without an API key.
- **Email Briefings**: Send formatted HTML briefing summaries to stakeholders via Resend API directly from the dashboard.

### 📑 Executive Reporting & Export Capabilities
- **One-Click Print/PDF View**: Printable executive summary layout with charts and tables rendered via `html2canvas` and `jspdf`.
- **Filtered CSV Export**: Export any filtered subset of cleaned records for external auditing.
- **Persistent Local Storage**: Uploaded datasets are automatically cached in browser IndexedDB so users don't need to re-upload files on page refresh.
- **Zero-Backend Privacy**: Transaction data remains inside the user's browser, eliminating data privacy risks.

---

## Architecture & Tech Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Framework** | [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) | Type-safe UI components and reactive state |
| **Bundler** | [Vite 8](https://vitejs.dev/) | Fast development server and optimized rollup bundling |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) | Modern utility-first responsive layout and design tokens |
| **Charts** | [Recharts](https://recharts.org/) | Composable SVG time series, bar charts, and pie breakdowns |
| **CSV Parsing** | [PapaParse](https://www.papaparse.com/) | Streaming CSV parsing with auto-delimiting |
| **Storage** | [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) | Client-side database for dataset caching |
| **AI Advisory** | [Groq API](https://groq.com/) | Low-latency LLM streaming over Server-Sent Events |
| **Email Dispatch** | [Resend](https://resend.com/) | Transactional email delivery for executive briefings |
| **Edge Functions** | [Cloudflare Pages Functions](https://developers.cloudflare.com/pages/functions/) | Edge proxy (`functions/api/resend/emails.ts`) avoiding CORS |
| **PDF Generation** | [jsPDF](https://github.com/parallax/jsPDF) + [html2canvas](https://html2canvas.hertzen.com/) | Vector & raster PDF generation for executive printouts |

---

## Getting Started

### Prerequisites

Ensure you have the following installed on your machine:
- **Node.js**: `v18.0.0` or higher (Node 20+ recommended)
- **npm**: `v9.0.0` or higher (or `pnpm` / `yarn`)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/masanthimanshu/scoobies-dashboard.git
   cd scoobies-dashboard
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

### Environment Configuration

The dashboard works out-of-the-box for analytics using its built-in offline engine. To enable live Groq AI streaming and email dispatching, set up your API keys:

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Open `.env` and fill in your keys:
   ```env
   # Groq Cloud API Key (https://console.groq.com)
   GROQ_API_KEY=gsk_your_groq_api_key

   # Resend API Key for Email Dispatch (https://resend.com)
   RESEND_API_KEY=re_your_resend_api_key
   ```

> **Note**: API keys can also be entered or updated directly within the dashboard settings modal without editing `.env`.

### Development Server

Start the local Vite development server:

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser. The Vite development server automatically proxies `/api/resend` requests to avoid CORS issues.

### Production Build

To compile a production bundle with optimized code-splitting and minification:

```bash
npm run build
```

Built assets will be emitted to the `dist/` directory, ready for deployment to Cloudflare Pages, Vercel, Netlify, or any static host.

---

## CSV Data Ingestion & Schema

### Expected Columns

The parser includes a fuzzy header resolver that automatically recognizes common naming variants (case-insensitive, ignoring special characters):

| Field | Description | Accepted Header Aliases |
| :--- | :--- | :--- |
| `Year` | Transaction fiscal/calendar year | `Year`, `Yr`, `Order Year`, `Sale Year` |
| `Month` | Month name or number | `Month`, `Mo`, `Order Month`, `Sale Month` |
| `Week` | Fiscal or calendar week label | `Week`, `Wk`, `Week No`, `Week Number`, `Wk#` |
| `Day` | Day of month (1–31) | `Day`, `Day No`, `Day Number`, `Date of Month` |
| `Date` | Full transaction timestamp | `Date`, `Order Date`, `Sale Date`, `Invoice Date` |
| `Order Number` | Unique order or invoice ID | `Order Number`, `Order No`, `Order Id`, `order_id` |
| `Customer Name`| Buyer or store name | `Customer name`, `Customer`, `Buyer Name` |
| `Bar Code` | Product SKU or barcode | `Bar Code`, `Barcode`, `SKU`, `Item Code` |
| `Product Name` | Full product title | `Product name`, `Item Name`, `Title`, `Product` |
| `Category` | High-level product category | `PRODUCT CATEGORY`, `Category`, `Item Category` |
| `QTY` | Units ordered / returned | `QTY`, `Qty`, `Quantity`, `Units` |
| `MRP` | Maximum retail price per unit | `MRP`, `Mrp`, `Price`, `Unit Price` |
| `MRP Value` | Total gross MRP | `MRP Value`, `Mrp Value`, `Total MRP`, `MRP Total` |
| `Scoobies Margin`| Brand gross margin amount | `Scoobies Margin`, `Margin`, `Gross Margin` |
| `Retailers Margin`| Retailer or marketplace margin | `Retailers Margin`, `Retailer Margin`, `Channel Margin` |
| `EX-GST Margin`| Margin amount net of GST | `EX-GST Scoobies Margin`, `Ex-GST Margin`, `EX GST` |
| `Delivery Place`| Delivery city or town | `Delivery Place`, `City`, `Location`, `Delivery City` |
| `State` | Delivery state or region | `State`, `Province`, `Region` |
| `Channel` | Sales channel / platform | `Website`, `Channel`, `Platform`, `Portal`, `Source` |
| `Status` | Order fulfillment status | `Status`, `Order Status`, `Delivery Status` |
| `Back To School`| B2S campaign flag | `Back To School`, `Campaign`, `B2S` |
| `Zone` | Geographic sales territory | `Zone`, `Sales Zone`, `Area` |
| `Sale Value` | Net realized sales value | `Sale Value`, `Net Sales`, `Sales`, `Total Value` |

### Data Cleaning & Resilient Parsing

- **Robust Date Disambiguation**: Supports `DD/MM/YYYY`, `MM/DD/YYYY`, `YYYY-MM-DD`, Excel serial numeric timestamps (e.g. `45505`), and text dates (e.g. `01-Aug-2026`).
- **Currency & String Sanitization**: Cleans currency symbols (`₹`, `$`), comma separators, and placeholder strings (`"-"`, `"N/A"`, `"--"`).
- **Automatic Return Inversion**: Automatically treats negative quantity items or records flagged with `Return` status as returns, adjusting net sales and unit metrics accordingly.
- **Zero-Data Fallback**: Calculates missing calendar weeks automatically from the transaction day when not explicitly provided.

---

## Project Structure

```
scoobies-dashboard/
├── functions/                     # Cloudflare Pages Functions
│   └── api/
│       └── resend/
│           └── emails.ts          # Edge proxy for CORS-safe Resend email dispatch
├── src/
│   ├── components/                # Modular React UI components
│   │   ├── AiAdvisorDrawer.tsx    # Slide-over Groq AI Strategic Advisor chat
│   │   ├── AiFloatingButton.tsx   # Floating action button for AI drawer
│   │   ├── BasketSizeAov.tsx      # AOV and basket size distribution analytics
│   │   ├── ChannelBreakdown.tsx   # Channel economics and share comparison
│   │   ├── ExecutiveSummary.tsx   # Algorithmic business insights cards
│   │   ├── FilterBar.tsx          # Multi-dimensional filter toolbar and chips
│   │   ├── GeoAnalytics.tsx       # State and zone geographic performance
│   │   ├── GoalModal.tsx          # Margin quota and sales target editor
│   │   ├── KpiGrid.tsx            # Executive KPI metrics cards
│   │   ├── Navbar.tsx             # Main header, dataset info, and action menu
│   │   ├── OrdersTable.tsx        # Paginated, sortable transaction data grid
│   │   ├── PrintReportView.tsx    # Clean executive printable/PDF layout
│   │   ├── ProductCategoryAnalytics.tsx # Category & SKU performance drilldowns
│   │   ├── ReturnAnalysis.tsx     # Return rate & offender SKU tracking
│   │   ├── SalesTrendChart.tsx    # Multi-granularity time series chart
│   │   ├── ShareChatModal.tsx     # Email briefing sharing modal
│   │   └── UploadModal.tsx        # Drag-and-drop CSV upload and validator
│   ├── services/                  # External service integrations
│   │   ├── emailService.ts        # Resend email API integration
│   │   └── groqService.ts         # Groq LLM SSE streaming client
│   ├── utils/                     # Analytics computation and data helpers
│   │   ├── aiContextDistiller.ts  # Summarizes active dataset for LLM prompt context
│   │   ├── analytics.ts           # Core KPI aggregation and calculations
│   │   ├── chatEmailTemplate.ts   # HTML email template for executive briefings
│   │   ├── csvParser.ts           # PapaParse CSV parser and schema normalizer
│   │   ├── formatters.ts          # Currency, date, and percentage formatters
│   │   ├── indexedDb.ts           # Client-side IndexedDB persistence layer
│   │   └── offlineAiEngine.ts     # Offline heuristic business insight generator
│   ├── types.ts                   # TypeScript interfaces and data models
│   ├── index.css                  # Global styles and Tailwind CSS v4 imports
│   ├── App.tsx                    # Main application container and layout
│   └── main.tsx                   # React root entrypoint
├── index.html                     # HTML template with custom Google typography
├── package.json                   # Project dependencies and build scripts
├── tsconfig.json                  # TypeScript compiler settings
├── vite.config.ts                 # Vite bundler, proxy, and manual code chunks
└── README.md                      # Project documentation
```

---

## AI Strategic Advisor & Resend Integration

### Context Distillation
Sending full transactional datasets to an LLM is slow, expensive, and exceeds token context limits. The dashboard uses `aiContextDistiller.ts` to compress millions of data points into a high-density, structured summary containing:
- High-level KPIs (Net Sales, Returns %, Margins, Quota run-rate deficit)
- Channel contribution and margin efficiency
- Category and top-volume SKU performance
- Top return-offender SKUs and return-rate anomalies
- Active filter conditions and dataset scope

### Persona Adaptation
The AI advisor can switch strategic perspectives depending on user intent:
- **Default / COO**: Holistic operational and commercial performance.
- **CFO**: Net realization, gross margin health, and channel economics.
- **Performance Marketer**: B2S campaign performance and revenue drivers.
- **E-Commerce Manager**: Conversion health, AOV dynamics, and channel share.
- **Merchandising / Supply Chain**: Return rates, SKU volume velocity, and category trends.

---

## Contributing

Contributions are welcome! To contribute:

1. **Fork the Repository**:
   Click the "Fork" button at the top right of this page.
2. **Create a Feature Branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make Your Changes**:
   Ensure code is properly formatted and adheres to project TypeScript conventions.
4. **Validate Your Build**:
   ```bash
   npm run build
   ```
5. **Commit Your Changes**:
   ```bash
   git commit -m "feat: describe your change concisely"
   ```
6. **Push to Your Fork & Open a Pull Request**:
   ```bash
   git push origin feature/your-feature-name
   ```

Please provide a clear description of your changes and any relevant screenshots in your Pull Request.

---

## Support

- **Issue Tracker**: If you encounter bugs or want to request a feature, please file an issue in the [GitHub Issues](https://github.com/masanthimanshu/scoobies-dashboard/issues) section.
- **Discussions**: For general questions, ideas, or feedback, join the [GitHub Discussions](https://github.com/masanthimanshu/scoobies-dashboard/discussions).

---

## License

This project is licensed under the [MIT License](LICENSE).
