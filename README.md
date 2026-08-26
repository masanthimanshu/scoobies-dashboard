# Scoobies Sales Analytics Dashboard

[![React](https://img.shields.io/badge/React-19.2-blue?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-7.0-blue?logo=typescript)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-8.2-blue?logo=vite)](https://vitejs.dev)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

## Overview

**Scoobies Sales Analytics Dashboard** is an interactive, real-time dashboard for comprehensive sales performance analysis and trend tracking. Designed for business users and analysts, it provides deep insights into multi-year sales data with advanced filtering, margin analytics, and executive-level reporting capabilities.

### Key Features

- 📊 **Multi-Year Analytics**: Analyze sales trends across multiple years with interactive visualizations
- 🔍 **Advanced Filtering**: Filter by date range, sales channel, product category, geographic zone, and order status
- 💰 **Margin Tracking**: Monitor Scoobies margin, retailer margins, and GST-inclusive margins in real-time
- 🌐 **Geographic Analytics**: Analyze sales performance by state and zone
- 📦 **Channel Breakdowns**: Compare sales performance across different channels (Website, Marketplace, etc.)
- 🏷️ **Product Category Analytics**: Track performance by product category and sku-level insights
- 📉 **Return Analysis**: Monitor and analyze product returns and cancellations
- 👁️ **Executive Summary**: Auto-generated insights and KPI highlights
- 📊 **Sales Trends**: Visual charts showing sales patterns and trends over time
- 📋 **Order Details**: Comprehensive order-level data in searchable table format
- 🖨️ **Print & Export**: Generate printable reports or export as PDF

## Quick Start

### Prerequisites

- **Node.js** 16+ (npm or yarn)
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/scoobies-dashboard.git
   cd scoobies-dashboard
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Start development server**

   ```bash
   npm run dev
   ```

   The dashboard will open automatically at `http://localhost:5173`

4. **Build for production**
   ```bash
   npm run build
   ```
   Production-ready files are generated in the `dist/` directory.

## Usage

### Loading Sales Data

1. Click the **Upload CSV** button in the dashboard navbar
2. Select your CSV file containing sales records
3. The dashboard will automatically parse and load the data

#### Expected CSV Format

Your CSV should include these columns:

| Column          | Type   | Example     | Notes                                                    |
| --------------- | ------ | ----------- | -------------------------------------------------------- |
| Date            | String | 15/08/2025  | Supports multiple formats (DD/MM/YYYY, YYYY-MM-DD, etc.) |
| OrderNumber     | String | ORD-12345   | Unique order identifier                                  |
| CustomerName    | String | John Doe    | Customer name                                            |
| ProductName     | String | T-Shirt     | Product name                                             |
| Category        | String | Apparel     | Product category                                         |
| Channel         | String | Website     | Sales channel (Website, Amazon, etc.)                    |
| Qty             | Number | 2           | Quantity sold                                            |
| MRP             | Number | 500         | Maximum retail price                                     |
| ScoobiesMargin  | Number | 150         | Margin earned by Scoobies                                |
| RetailersMargin | Number | 100         | Margin for retailers                                     |
| State           | String | Maharashtra | Geographic state                                         |
| Zone            | String | Western     | Geographic zone                                          |
| Status          | String | Dispatched  | Order status (Dispatched, Return, Cancelled, Other)      |
| BarCode         | String | 123456789   | Product barcode                                          |
| DeliveryPlace   | String | Mumbai      | Delivery location                                        |

### Using Filters

The **Filter Bar** provides multiple filtering options:

- **Date Range**: Select from preset ranges (7D, 15D, 30D, MTD, YTD) or custom date range
- **Year/Month/Week**: Multi-select filtering by temporal dimensions
- **Channel**: Filter by sales channel
- **Category**: Filter by product category
- **Zone/State**: Filter by geographic location
- **Status**: Filter by order status (Dispatched, Return, Cancelled, Other)
- **Search**: Quick search by order number, product name, or customer name

### Viewing Analytics

The dashboard displays:

- **KPI Grid**: Key performance indicators including total orders, revenue, margins, and AOV
- **Executive Summary**: AI-generated insights highlighting trends and anomalies
- **Sales Trends**: Time-series chart showing revenue and order volume trends
- **Channel Breakdown**: Pie chart comparing channel performance
- **Product Analytics**: Category-wise performance metrics
- **Basket & AOV**: Average order value and basket size analysis
- **Return Analysis**: Returns and cancellations breakdown
- **Geographic Analytics**: State-wise and zone-wise sales heatmaps
- **Orders Table**: Detailed order-level data with sorting and filtering

### Setting Sales Goals

1. Click the **Set Goal** button in the navbar
2. Enter your target revenue goal
3. The dashboard will display goal progress and variance against actual performance

### Exporting Reports

1. Click the **Print** button in the navbar
2. Review the printable report preview
3. Use browser print dialog to save as PDF or print physically

## Project Structure

```
scoobies-dashboard/
├── src/
│   ├── components/          # React components
│   │   ├── Navbar.tsx
│   │   ├── FilterBar.tsx
│   │   ├── KpiGrid.tsx
│   │   ├── ExecutiveSummary.tsx
│   │   ├── SalesTrendChart.tsx
│   │   ├── ChannelBreakdown.tsx
│   │   ├── ProductCategoryAnalytics.tsx
│   │   ├── ReturnAnalysis.tsx
│   │   ├── GeoAnalytics.tsx
│   │   ├── OrdersTable.tsx
│   │   ├── BasketSizeAov.tsx
│   │   ├── UploadModal.tsx
│   │   ├── GoalModal.tsx
│   │   └── PrintReportView.tsx
│   ├── utils/               # Utility functions
│   │   ├── csvParser.ts     # CSV parsing and normalization
│   │   └── analytics.ts     # Analytics computation
│   ├── data/
│   │   └── sampleCsv.ts     # Sample data for demo
│   ├── types.ts             # TypeScript interfaces
│   ├── App.tsx              # Main app component
│   ├── main.tsx             # Entry point
│   └── index.css            # Global styles
├── index.html               # HTML template
├── package.json             # Project dependencies
├── tsconfig.json            # TypeScript configuration
├── vite.config.ts           # Vite configuration
└── README.md                # This file
```

## Technology Stack

| Category     | Technology     | Version |
| ------------ | -------------- | ------- |
| Framework    | React          | 19.2    |
| Language     | TypeScript     | 7.0     |
| Build Tool   | Vite           | 8.2     |
| Styling      | Tailwind CSS   | 4.3     |
| Charts       | Recharts       | 3.10    |
| Icons        | Lucide React   | 1.34    |
| CSV Parsing  | PapaParse      | 5.7     |
| PDF Export   | jsPDF          | 4.2     |
| Animation    | Motion         | 13.1    |
| UI Utilities | Tailwind Merge | 3.6     |

## Development

### Available Commands

```bash
# Start development server with hot reload
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview
```

### Code Style & Conventions

- **Language**: TypeScript for type safety
- **Styling**: Tailwind CSS utility classes
- **Components**: Functional React components with hooks
- **Data Flow**: React state management with custom hooks
- **File Structure**: Component-based organization with co-located utilities

### Key Utilities

#### CSV Parser (`utils/csvParser.ts`)

- Handles diverse CSV formats and normalizes data
- Supports multiple date formats
- Cleans and validates numeric fields
- Returns parsed records with metadata

#### Analytics (`utils/analytics.ts`)

- Computes KPIs (revenue, order count, margins)
- Generates time-series data for trends
- Calculates channel and category metrics
- Provides geographic breakdowns
- Generates executive-level insights

### Type Definitions

See [src/types.ts](src/types.ts) for complete TypeScript interfaces:

- `SaleRecord`: Sales transaction data structure
- `FilterState`: Dashboard filter configuration
- Analysis metrics and dashboard state types

## Data Processing

The dashboard processes CSV data through these steps:

1. **Parsing**: PapaParse reads CSV with automatic type detection
2. **Normalization**: Number, date, and text fields are cleaned and standardized
3. **Validation**: Invalid records are flagged with errors but don't block processing
4. **Indexing**: Data is indexed by year, month, week, channel, category, and location
5. **Analysis**: Metrics are computed on-demand based on active filters
6. **Caching**: Results are memoized to prevent unnecessary recomputation

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Requires JavaScript enabled

## Performance

- Dashboard can handle 100,000+ sales records efficiently
- Memoization prevents unnecessary re-renders
- Virtual scrolling for large order tables
- Debounced filtering for responsive UX

## Troubleshooting

### CSV Upload Issues

- Ensure CSV encoding is UTF-8
- Verify all required columns are present
- Check that numeric values don't include currency symbols (they're auto-stripped)
- Dates should be in standard format (DD/MM/YYYY or YYYY-MM-DD)

### Data Not Showing

- Check browser console for parsing errors
- Verify CSV file has data rows beyond the header
- Ensure filters are not too restrictive

### Performance Issues

- Reduce date range for filtering
- Break large datasets into multiple years
- Clear browser cache if experiencing slowness

## Support & Documentation

- **Issues**: Report bugs or request features via GitHub Issues
- **Documentation**: See inline code comments and TypeScript type definitions
- **Examples**: Check [sample data](src/data/sampleCsv.ts) for expected data format

## Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

For detailed contribution guidelines, see [CONTRIBUTING.md](CONTRIBUTING.md) (if available).

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Maintainers

This project is actively maintained by the Scoobies development team. For questions or suggestions, please open an issue on GitHub.

---

**Made with ❤️ by the Scoobies team**
