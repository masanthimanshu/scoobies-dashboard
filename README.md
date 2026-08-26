# Scoobies Sales Dashboard

Scoobies Sales Dashboard is a client-side React application for turning sales CSV reports into an interactive commercial performance view. It analyzes revenue, margins, returns, orders, products, channels, trends, targets, and geography directly in the browser.

## Why It Is Useful

- Import `.csv` or `.txt` sales reports using drag and drop or a file picker.
- Normalize common sales-report column names, numeric formats, currency symbols, and dates automatically.
- Track gross and net sales, units, orders, average order value, margins, returns, and target progress.
- Filter by date, year, month, week, channel, category, zone, state, status, campaign, and search terms.
- Compare daily, weekly, monthly, and yearly sales trends.
- Review channel, product, category, return, and geographic performance.
- Export the filtered dataset as CSV or generate a printable/PDF executive report.
- Use the deterministic offline briefing engine without an API key, or optionally ask the Groq-powered AI advisor questions about the loaded data.

All dashboard calculations run in browser memory. Uploaded data and dashboard settings are not persisted after a page reload.

## Getting Started

### Prerequisites

- Node.js 18 or newer
- npm
- A modern browser with JavaScript enabled

### Install and Run

```bash
npm ci
npm run dev
```

The development command starts Vite and opens the application in your browser. To create a production build:

```bash
npm run build
```

The generated production files are written to `dist/`. The repository currently does not define test, lint, or preview scripts.

### Load a Sales Report

1. Open the dashboard and select **Import CSV**.
2. Drop a `.csv` or `.txt` file into the upload area, or browse for it.
3. Use the filter bar and dashboard controls to inspect the loaded data.
4. Use **Export & Tools** to export the filtered CSV or create a report.

The upload parser accepts common aliases and fills missing values with sensible defaults. A sample file can be downloaded from the upload dialog using **Download Sample CSV**.

### CSV Fields

The parser matches headers case-insensitively and ignores punctuation and whitespace differences. These canonical fields are supported:

| Field                                                           | Purpose                                        |
| --------------------------------------------------------------- | ---------------------------------------------- |
| `Year`, `Month`, `Week`, `Day`, `Date`                          | Time grouping and date filters                 |
| `Order Number`                                                  | Order identification                           |
| `Customer name`                                                 | Customer display name                          |
| `Bar Code`                                                      | SKU or item code                               |
| `Product name`, `Color`                                         | Product and variant analysis                   |
| `PRODUCT CATEGORY`                                              | Category analysis                              |
| `QTY`                                                           | Units sold or returned                         |
| `MRP`                                                           | Product price                                  |
| `Scoobies Margin`, `Retailers Margin`, `EX-GST Scoobies Margin` | Margin calculations                            |
| `Delivery Place`, `State`, `Zone`                               | Geographic analysis                            |
| `Website` or `Channel`                                          | Channel analysis                               |
| `Status`                                                        | Dispatched, return, cancelled, or other status |
| `Back To School` or `Campaign`                                  | Campaign filtering                             |
| `Sale Value`                                                    | Sales and return-value calculations            |

Common alternatives such as `SKU`, `Quantity`, `Price`, `Platform`, `Order Id`, `City`, and `Province` are also recognized. Dates may be supplied as `YYYY-MM-DD` or slash-separated day/month/year values. Numeric values may include commas, currency symbols, or placeholder values such as `-`.

## Optional AI Advisor

The dashboard includes an offline strategic briefing by default. To enable interactive Groq responses, create a local `.env` file and add:

```dotenv
GROQ_API_KEY=your_groq_api_key
```

Restart the development server after changing environment variables. The advisor uses the `openai/gpt-oss-120b` model and sends requests directly from the browser to the Groq API. Because this is a client-side application, an API key placed in the build can be exposed to browser users. Use a server-side proxy and server-managed secret for production deployments, and never commit `.env` files or keys.

When AI is enabled, the dashboard sends the distilled analytics context and relevant data slice to Groq. Do not upload sensitive or personally identifiable information unless your organization has approved that data flow.

## Project Structure

```text
src/
  App.tsx                    Application state and dashboard composition
  types.ts                   Shared TypeScript data contracts
  components/                Dashboard views, controls, modals, and reports
  services/groqService.ts    Optional streamed Groq integration
  utils/analytics.ts         Metrics, filtering, and insight calculations
  utils/csvParser.ts         CSV normalization and parsing
  utils/offlineAiEngine.ts   Local strategic briefing generation
```

## Help and Documentation

There is currently no project-specific issue tracker, wiki, demo URL, API documentation, or support contact declared in the repository. For dependency and platform reference, see:

- [Vite documentation](https://vite.dev/guide/)
- [React documentation](https://react.dev/learn)
- [Groq API documentation](https://console.groq.com/docs)
- [Papa Parse documentation](https://www.papaparse.com/docs)

For a project-specific support channel, open an issue in the repository where this project is hosted or contact its repository owner.

## Contributing

Contributions are welcome, but the repository does not yet include a formal `CONTRIBUTING.md`, code of conduct, license, or named maintainer. Until those documents are added:

1. Keep changes focused and consistent with the existing React, TypeScript, Vite, and Tailwind setup.
2. Run `npm run build` before submitting a change.
3. Describe user-visible behavior and any CSV or environment-variable changes in the pull request.
4. Do not commit `.env` files, API keys, uploaded datasets, or generated build artifacts.

Maintainer ownership and contribution review are managed by the owner of the repository in which this project is published.

## License

No license file is currently included. Add a `LICENSE` file before distributing or accepting external contributions under a defined open-source license.
