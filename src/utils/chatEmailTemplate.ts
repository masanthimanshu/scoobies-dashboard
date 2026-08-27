import { marked } from "marked";
import { ChatMessage } from "../services/groqService";
import { DistilledSalesContext } from "./aiContextDistiller";
import { formatCurrency, formatNumber, formatPercent } from "./formatters";

export interface GenerateEmailOptions {
  messages: ChatMessage[];
  distilledContext: DistilledSalesContext;
  recipientEmail?: string;
  customSubject?: string;
}

/**
 * Converts markdown text into inline-styled email-compatible HTML.
 */
function convertMarkdownToEmailHtml(markdownText: string): string {
  if (!markdownText) return "";

  try {
    let rawHtml = marked.parse(markdownText, {
      gfm: true,
      breaks: true,
    }) as string;

    // Style headings
    rawHtml = rawHtml
      .replace(
        /<h1>/gi,
        '<h1 style="color: #2D2A26; font-size: 18px; font-weight: 800; margin: 16px 0 8px 0; border-bottom: 1px solid #EBE5D9; padding-bottom: 6px;">',
      )
      .replace(
        /<h2>/gi,
        '<h2 style="color: #2D2A26; font-size: 16px; font-weight: 800; margin: 14px 0 6px 0;">',
      )
      .replace(
        /<h3>/gi,
        '<h3 style="color: #5F7161; font-size: 14px; font-weight: 700; margin: 12px 0 4px 0;">',
      );

    // Style paragraphs
    rawHtml = rawHtml.replace(
      /<p>/gi,
      '<p style="color: #3A3631; font-size: 13px; line-height: 1.6; margin: 0 0 10px 0;">',
    );

    // Style bold and strong text
    rawHtml = rawHtml.replace(
      /<strong>/gi,
      '<strong style="color: #1F1D1A; font-weight: 700;">',
    );

    // Style lists
    rawHtml = rawHtml
      .replace(
        /<ul>/gi,
        '<ul style="margin: 6px 0 12px 0; padding-left: 20px; color: #3A3631; font-size: 13px; line-height: 1.6;">',
      )
      .replace(
        /<ol>/gi,
        '<ol style="margin: 6px 0 12px 0; padding-left: 20px; color: #3A3631; font-size: 13px; line-height: 1.6;">',
      )
      .replace(/<li>/gi, '<li style="margin-bottom: 4px;">');

    // Style tables with email-safe inline styles
    rawHtml = rawHtml
      .replace(
        /<table>/gi,
        '<table style="width: 100%; border-collapse: collapse; margin: 12px 0 16px 0; font-size: 12px; background-color: #FFFFFF; border: 1px solid #E5DFD5; border-radius: 6px;">',
      )
      .replace(
        /<th>/gi,
        '<th style="background-color: #F5F1E8; color: #2D2A26; font-weight: 700; padding: 8px 10px; border: 1px solid #E0D9CB; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">',
      )
      .replace(
        /<td>/gi,
        '<td style="padding: 7px 10px; border: 1px solid #EBE5D9; color: #3A3631; font-size: 12px;">',
      );

    // Style blockquotes
    rawHtml = rawHtml.replace(
      /<blockquote>/gi,
      '<blockquote style="border-left: 3px solid #5F7161; margin: 8px 0; padding: 6px 12px; background-color: #F7F5F0; color: #4A453E; font-size: 12px; font-style: italic;">',
    );

    // Style code blocks
    rawHtml = rawHtml
      .replace(
        /<pre><code>/gi,
        '<pre style="background-color: #2D2A26; color: #F5F1E8; padding: 10px 14px; border-radius: 6px; font-family: monospace; font-size: 11px; overflow-x: auto; margin: 10px 0;"><code style="color: #F5F1E8;">',
      )
      .replace(
        /<code>/gi,
        '<code style="background-color: #F1ECE3; color: #8F3B25; padding: 1px 4px; border-radius: 3px; font-family: monospace; font-size: 11px;">',
      );

    // Style horizontal rules
    rawHtml = rawHtml.replace(
      /<hr\s*\/?>/gi,
      '<hr style="border: 0; border-top: 1px solid #E5DFD5; margin: 14px 0;" />',
    );

    return rawHtml;
  } catch {
    return `<p style="color: #3A3631; font-size: 13px; line-height: 1.6;">${markdownText}</p>`;
  }
}

/**
 * Builds a complete, styled HTML email briefing for the chat session.
 */
export function buildChatBriefingEmailHtml({
  messages,
  distilledContext,
}: GenerateEmailOptions): string {
  const dateFormatted = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const timeFormatted = new Date().toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const totalRecords = formatNumber(distilledContext.datasetInfo.totalRecords);
  const activeFilters =
    distilledContext.datasetInfo.activeFiltersDescription || "All Filters";
  const netSales = formatCurrency(distilledContext.kpis.netSales);
  const marginPct = formatPercent(distilledContext.kpis.scoobiesMarginPct);
  const returnRatePct = formatPercent(distilledContext.kpis.returnRateQtyPct);
  const targetPct = formatPercent(distilledContext.kpis.targetProgressPct, 0);

  // Generate conversation blocks
  const conversationHtml = messages
    .map((msg, idx) => {
      const isUser = msg.role === "user";

      if (isUser) {
        return `
          <div style="margin: 16px 0 12px 0;">
            <div style="display: inline-block; background-color: #5F7161; color: #FFFFFF; font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 12px; margin-bottom: 6px; letter-spacing: 0.3px;">
              👤 User Query #${Math.floor(idx / 2) + 1}
            </div>
            <div style="background-color: #F1ECE3; border-left: 4px solid #5F7161; border-radius: 6px; padding: 12px 16px; color: #2D2A26; font-size: 13px; font-weight: 600; line-height: 1.5;">
              ${msg.content}
            </div>
          </div>
        `;
      } else {
        const bodyContent = convertMarkdownToEmailHtml(msg.content);
        return `
          <div style="margin: 12px 0 24px 0; background-color: #FFFFFF; border: 1px solid #EBE5D9; border-radius: 8px; padding: 16px 18px; box-shadow: 0 1px 3px rgba(0,0,0,0.03);">
            <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #F1EDE5; padding-bottom: 8px; margin-bottom: 12px;">
              <span style="color: #5F7161; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">
                ✨ Scoobies AI Advisor (Groq 120B)
              </span>
            </div>
            <div style="font-size: 13px; color: #2D2A26;">
              ${bodyContent}
            </div>
          </div>
        `;
      }
    })
    .join("");

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Scoobies AI Strategic Briefing</title>
</head>
<body style="margin: 0; padding: 0; background-color: #FAF8F5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #2D2A26;">
  <center style="width: 100%; background-color: #FAF8F5; padding: 24px 0;">
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 680px; margin: 0 auto; background-color: #FFFFFF; border-radius: 12px; overflow: hidden; border: 1px solid #EBE5D9; box-shadow: 0 4px 12px rgba(45,42,38,0.05);">
      
      <!-- Brand Header Banner -->
      <tr>
        <td style="background-color: #5F7161; padding: 24px 28px; text-align: left;">
          <table border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td>
                <div style="display: inline-block; background-color: #4A594C; color: #F5DEB3; font-size: 10px; font-weight: 800; padding: 3px 8px; border-radius: 4px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;">
                  Executive Commercial Intelligence
                </div>
                <h1 style="color: #FFFFFF; font-size: 20px; font-weight: 800; margin: 0; letter-spacing: -0.5px;">
                  Scoobies AI Strategic Briefing
                </h1>
                <p style="color: #E2EBE4; font-size: 12px; margin: 4px 0 0 0; font-weight: 500;">
                  Generated on ${dateFormatted} at ${timeFormatted} • Powered by Groq GPT OSS 120B
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Context Info Bar -->
      <tr>
        <td style="background-color: #F7F4EE; padding: 12px 28px; border-bottom: 1px solid #EBE5D9; font-size: 11px; color: #8C8376;">
          <strong style="color: #2D2A26;">Dataset Scope:</strong> ${totalRecords} distilled transactions &nbsp;|&nbsp; 
          <strong style="color: #2D2A26;">Active Filters:</strong> ${activeFilters}
        </td>
      </tr>

      <!-- Executive KPI Snapshot Grid -->
      <tr>
        <td style="padding: 20px 28px 12px 28px;">
          <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; color: #8C8376; margin-bottom: 10px;">
            Commercial Performance Snapshot
          </div>
          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 8px;">
            <tr>
              <td width="24%" style="background-color: #FAF8F5; border: 1px solid #EBE5D9; border-radius: 8px; padding: 10px 8px; text-align: center;">
                <div style="font-size: 10px; font-weight: 700; color: #8C8376; text-transform: uppercase;">Net Sales</div>
                <div style="font-size: 14px; font-weight: 800; color: #2D2A26; margin-top: 2px;">${netSales}</div>
              </td>
              <td width="3%">&nbsp;</td>
              <td width="24%" style="background-color: #FAF8F5; border: 1px solid #EBE5D9; border-radius: 8px; padding: 10px 8px; text-align: center;">
                <div style="font-size: 10px; font-weight: 700; color: #8C8376; text-transform: uppercase;">Margin</div>
                <div style="font-size: 14px; font-weight: 800; color: #5F7161; margin-top: 2px;">${marginPct}</div>
              </td>
              <td width="3%">&nbsp;</td>
              <td width="24%" style="background-color: #FAF8F5; border: 1px solid #EBE5D9; border-radius: 8px; padding: 10px 8px; text-align: center;">
                <div style="font-size: 10px; font-weight: 700; color: #8C8376; text-transform: uppercase;">Return Rate</div>
                <div style="font-size: 14px; font-weight: 800; color: #AF8260; margin-top: 2px;">${returnRatePct}</div>
              </td>
              <td width="3%">&nbsp;</td>
              <td width="24%" style="background-color: #FAF8F5; border: 1px solid #EBE5D9; border-radius: 8px; padding: 10px 8px; text-align: center;">
                <div style="font-size: 10px; font-weight: 700; color: #8C8376; text-transform: uppercase;">Goal Achieved</div>
                <div style="font-size: 14px; font-weight: 800; color: #2D2A26; margin-top: 2px;">${targetPct}</div>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Conversation Transcript Body -->
      <tr>
        <td style="padding: 10px 28px 24px 28px;">
          <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; color: #8C8376; margin-bottom: 12px; border-bottom: 1px solid #EBE5D9; padding-bottom: 6px;">
            Conversation & Strategic Analysis Transcript
          </div>
          ${conversationHtml}
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="background-color: #F7F4EE; padding: 16px 28px; border-top: 1px solid #EBE5D9; text-align: center; font-size: 11px; color: #8C8376;">
          <p style="margin: 0 0 4px 0; font-weight: 600; color: #5F7161;">
            Scoobies Commercial Intelligence & Strategy Hub
          </p>
          <p style="margin: 0; font-size: 10px;">
            Confidential Executive Report • Generated automatically via Scoobies AI Advisor
          </p>
        </td>
      </tr>

    </table>
  </center>
</body>
</html>
  `.trim();
}
