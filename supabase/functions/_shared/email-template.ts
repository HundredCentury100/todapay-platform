// Shared premium email template builder — Stripe/Lovable receipt style
// Brand color: #5271ff | Font: Arial/system

export interface EmailDetailRow {
  label: string;
  value: string;
}

export interface EmailAmountRow {
  label: string;
  value: string;
  bold?: boolean;
  color?: string;
}

export interface PremiumEmailOptions {
  type: 'receipt' | 'invoice' | 'confirmation' | 'notification' | 'alert';
  title: string;
  subtitle?: string;
  reference?: string;
  greeting?: string;
  details?: EmailDetailRow[];
  amounts?: EmailAmountRow[];
  totalLabel?: string;
  totalValue?: string;
  totalBadge?: string; // e.g. "PAID", "PENDING"
  bodyText?: string;
  alertText?: string;
  alertColor?: 'warning' | 'success' | 'error';
  ctaLabel?: string;
  ctaUrl?: string;
  secondaryCtaLabel?: string;
  secondaryCtaUrl?: string;
  footerNote?: string;
  customHtml?: string; // Insert arbitrary HTML block
  heroImageUrl?: string; // Full-width promotional/banner image below header
}

const TYPE_EMOJI: Record<string, string> = {
  receipt: '🧾',
  invoice: '📄',
  confirmation: '✅',
  notification: '🔔',
  alert: '⚠️',
};

const ALERT_COLORS = {
  warning: { bg: '#fef3c7', border: '#fbbf24', text: '#92400e' },
  success: { bg: '#dcfce7', border: '#22c55e', text: '#166534' },
  error: { bg: '#fef2f2', border: '#ef4444', text: '#991b1b' },
};

export function buildPremiumEmail(opts: PremiumEmailOptions): string {
  const emoji = TYPE_EMOJI[opts.type] || '🎫';
  const typeLabel = opts.type.charAt(0).toUpperCase() + opts.type.slice(1);

  const heroImageBlock = opts.heroImageUrl ? `
    <tr>
      <td style="padding:0;">
        <img src="${opts.heroImageUrl}" alt="${opts.subtitle || opts.title}" style="width:100%;height:auto;display:block;max-height:280px;object-fit:cover;" />
      </td>
    </tr>
  ` : '';

  const referenceBlock = opts.reference ? `
    <div style="background:#f8f9fb;border-radius:10px;padding:16px 20px;margin:24px 0;text-align:center;">
      <div style="font-size:11px;text-transform:uppercase;letter-spacing:1.5px;color:#888;margin-bottom:4px;">Reference</div>
      <div style="font-family:'SF Mono','Fira Code',Consolas,monospace;font-size:20px;font-weight:700;color:#111;letter-spacing:1px;">${opts.reference}</div>
    </div>
  ` : '';

  const greetingBlock = opts.greeting ? `
    <p style="color:#555;font-size:15px;margin:0 0 20px;">${opts.greeting}</p>
  ` : '';

  const detailRows = (opts.details || []).map(d => `
    <tr>
      <td style="padding:8px 0;color:#888;font-size:14px;vertical-align:top;width:140px;">${d.label}</td>
      <td style="padding:8px 0;color:#111;font-size:14px;font-weight:500;">${d.value}</td>
    </tr>
  `).join('');

  const detailsBlock = detailRows ? `
    <div style="margin:24px 0;">
      <div style="font-size:11px;text-transform:uppercase;letter-spacing:1.5px;color:#888;margin-bottom:12px;font-weight:600;">Details</div>
      <table style="width:100%;border-collapse:collapse;">${detailRows}</table>
    </div>
  ` : '';

  const amountRows = (opts.amounts || []).map(a => `
    <div style="display:flex;justify-content:space-between;padding:8px 0;${a.bold ? 'font-weight:700;font-size:16px;' : 'font-size:14px;'}">
      <span style="color:${a.bold ? '#111' : '#666'};">${a.label}</span>
      <span style="color:${a.color || (a.bold ? '#111' : '#333')};">${a.value}</span>
    </div>
  `).join('');

  const totalBlock = opts.totalValue ? `
    <div style="border-top:2px solid #e5e7eb;margin-top:8px;padding-top:12px;display:flex;justify-content:space-between;align-items:center;">
      <span style="font-size:16px;font-weight:700;color:#111;">${opts.totalLabel || 'Total'}</span>
      <span style="display:flex;align-items:center;gap:10px;">
        <span style="font-size:22px;font-weight:800;color:#5271ff;">${opts.totalValue}</span>
        ${opts.totalBadge ? `<span style="background:#dcfce7;color:#166534;font-size:11px;font-weight:600;padding:3px 10px;border-radius:20px;text-transform:uppercase;letter-spacing:0.5px;">${opts.totalBadge}</span>` : ''}
      </span>
    </div>
  ` : '';

  const amountsBlock = (amountRows || totalBlock) ? `
    <div style="margin:24px 0;background:#fafbfc;border-radius:10px;padding:16px 20px;">
      <div style="font-size:11px;text-transform:uppercase;letter-spacing:1.5px;color:#888;margin-bottom:12px;font-weight:600;">Amount</div>
      ${amountRows}
      ${totalBlock}
    </div>
  ` : '';

  const alertColors = opts.alertColor ? ALERT_COLORS[opts.alertColor] : ALERT_COLORS.warning;
  const alertBlock = opts.alertText ? `
    <div style="background:${alertColors.bg};border:1px solid ${alertColors.border};border-radius:10px;padding:14px 18px;margin:20px 0;">
      <p style="margin:0;color:${alertColors.text};font-size:14px;line-height:1.5;">${opts.alertText}</p>
    </div>
  ` : '';

  const bodyBlock = opts.bodyText ? `
    <p style="color:#555;font-size:14px;line-height:1.6;margin:16px 0;">${opts.bodyText}</p>
  ` : '';

  const ctaBlock = opts.ctaLabel && opts.ctaUrl ? `
    <div style="text-align:center;margin:28px 0 16px;">
      <a href="${opts.ctaUrl}" style="display:inline-block;background:#5271ff;color:#ffffff;padding:13px 36px;text-decoration:none;border-radius:8px;font-weight:600;font-size:15px;letter-spacing:0.3px;">${opts.ctaLabel}</a>
      ${opts.secondaryCtaLabel && opts.secondaryCtaUrl ? `
        <div style="margin-top:12px;">
          <a href="${opts.secondaryCtaUrl}" style="color:#5271ff;font-size:13px;text-decoration:underline;">${opts.secondaryCtaLabel}</a>
        </div>
      ` : ''}
    </div>
  ` : '';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${opts.title}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f5f7;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
          
          <!-- Brand Header -->
          <tr>
            <td style="background:#5271ff;padding:28px 32px;text-align:center;">
              <div style="font-size:24px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">🎫 TodaPay</div>
              <div style="font-size:13px;color:rgba(255,255,255,0.85);margin-top:6px;letter-spacing:0.5px;">${emoji} ${typeLabel}</div>
            </td>
          </tr>

          <!-- Hero Image (optional) -->
          ${heroImageBlock}

          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111;">${opts.title}</h1>
              ${opts.subtitle ? `<p style="margin:0 0 20px;color:#888;font-size:14px;">${opts.subtitle}</p>` : ''}

              ${greetingBlock}
              ${referenceBlock}
              ${detailsBlock}
              ${opts.customHtml || ''}
              ${amountsBlock}
              ${bodyBlock}
              ${alertBlock}
              ${ctaBlock}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#fafbfc;padding:24px 32px;text-align:center;border-top:1px solid #eee;">
              ${opts.footerNote ? `<p style="color:#888;font-size:13px;margin:0 0 12px;">${opts.footerNote}</p>` : ''}
              <p style="margin:0;color:#888;font-size:13px;">
                Need help? <a href="mailto:support@TodaPay.com" style="color:#5271ff;text-decoration:none;">support@TodaPay.com</a>
                <br/>or call +263 789 583 003
              </p>
              <p style="margin:16px 0 0;color:#bbb;font-size:11px;">
                © 2026 Suvat Group · <a href="https://TodaPay.com" style="color:#bbb;text-decoration:none;">TodaPay.com</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
