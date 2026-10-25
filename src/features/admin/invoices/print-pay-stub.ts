import { formatMoney } from "@/lib/money/format"
import type { PayrollRow } from "@/lib/data/admin/ops-schemas"

const CSS = [
  "body{font-family:system-ui,sans-serif;padding:40px;color:ButtonText}",
  "h1{font-size:22px;margin:0 0 4px}",
  ".sub{color:GrayText;font-size:14px;margin:0 0 28px}",
  "table{width:100%;border-collapse:collapse;font-size:14px}",
  "th{text-align:left;font-weight:600;border-bottom:1px solid ButtonFace;padding:6px 0}",
  "td{padding:8px 0;border-bottom:1px solid ButtonFace}",
  ".num{text-align:right;font-variant-numeric:tabular-nums}",
  ".total td{font-weight:700;border-top:2px solid ButtonBorder;border-bottom:none}",
  ".footer{margin-top:32px;font-size:13px;color:GrayText}",
].join("")

/** Opens a print dialog for a single staff member's pay stub, then closes the window. */
export function printPayStub(row: PayrollRow, period: string): void {
  const win = window.open("", "_blank", "width=700,height=900")
  if (!win) return

  const rows = row.lines
    .map(
      (l) =>
        `<tr><td>${l.event}</td><td>${l.date}</td>` +
        `<td class="num">${l.hours}h</td><td class="num">${formatMoney(l.amountCents)}</td></tr>`,
    )
    .join("")

  win.document.write(
    `<!doctype html><html><head><title>Pay stub – ${row.name}</title>` +
      `<style>${CSS}</style></head><body>` +
      `<h1>${row.name} — Pay stub</h1>` +
      `<p class="sub">${period} · ${row.email}</p>` +
      `<table><thead><tr><th>Event</th><th>Date</th>` +
      `<th class="num">Hours</th><th class="num">Amount</th></tr></thead>` +
      `<tbody>${rows}` +
      `<tr class="total"><td colspan="2">Total</td>` +
      `<td class="num">${row.hours}h</td><td class="num">${formatMoney(row.amountCents)}</td></tr>` +
      `</tbody></table>` +
      `<p class="footer">Estimated at the venue bill rate — adjust for your actual pay rate.</p>` +
      `<script>window.onload=()=>{window.print();window.close()}<\/script>` +
      `</body></html>`,
  )
  win.document.close()
}
