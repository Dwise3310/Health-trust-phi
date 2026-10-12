import { HOSPITAL } from "@/lib/constants";

export type SlipRow = { label: string; value: string };

const PHONE = HOSPITAL.phone;

function stamp() {
  return new Date().toLocaleString("en-NG", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function refNo() {
  const n = Date.now().toString(36).toUpperCase();
  return `ER-${n.slice(-8)}`;
}

function letterhead(title: string, ref: string) {
  return `
    <header style="display:flex;justify-content:space-between;gap:24px;border-bottom:2px solid #2a2318;padding-bottom:14px;margin-bottom:18px">
      <div>
        <p style="margin:0;letter-spacing:.22em;font-size:11px;text-transform:uppercase">Sure Health</p>
        <h1 style="margin:6px 0 0;font-size:22px;font-weight:560">${HOSPITAL.name}</h1>
        <p style="margin:8px 0 0;font-size:12px;line-height:1.55;max-width:420px">
          ${HOSPITAL.address}<br/>
          Phone ${PHONE}<br/>
          ${HOSPITAL.email}
        </p>
      </div>
      <div style="text-align:right;font-size:12px;line-height:1.55">
        <p style="margin:0;letter-spacing:.14em;text-transform:uppercase;font-size:10px">Desk record</p>
        <p style="margin:8px 0 0">Ref ${ref}</p>
        <p style="margin:2px 0 0">Printed ${stamp()}</p>
      </div>
    </header>
    <h2 style="margin:0 0 14px;font-size:18px;font-weight:560">${title}</h2>
  `;
}

function signoff() {
  return `
    <div style="margin-top:36px;display:flex;justify-content:space-between;gap:24px;font-size:12px">
      <div>
        <p style="margin:0 0 28px">Reception</p>
        <p style="margin:0;border-top:1px solid #2a2318;padding-top:6px;min-width:180px">Name and signature</p>
      </div>
      <div>
        <p style="margin:0 0 28px">Member</p>
        <p style="margin:0;border-top:1px solid #2a2318;padding-top:6px;min-width:180px">Name and signature</p>
      </div>
    </div>
    <p style="margin-top:22px;font-size:11px;line-height:1.5">
      Official Eastern Ryse desk paper. Care Quota is not a blank cheque for surgery, drugs, or boarding.
      Phone ${PHONE} if this slip and the code do not match.
    </p>
  `;
}

export function printSlip(title: string, rows: SlipRow[], table?: { head: string[]; body: string[][] }) {
  const ref = refNo();
  const lines = rows
    .map(
      (r) =>
        `<tr><td style="padding:7px 16px 7px 0;color:#5c5346;white-space:nowrap;vertical-align:top">${r.label}</td><td style="padding:7px 0;vertical-align:top">${r.value}</td></tr>`,
    )
    .join("");
  const grid = table
    ? `<table style="width:100%;border-collapse:collapse;margin-top:18px;font-size:13px">
        <thead><tr>${table.head.map((h) => `<th style="text-align:left;border-bottom:1px solid #2a2318;padding:6px 8px 6px 0">${h}</th>`).join("")}</tr></thead>
        <tbody>${table.body
          .map(
            (cells) =>
              `<tr>${cells.map((c) => `<td style="border-bottom:1px solid #e4d5c0;padding:7px 8px 7px 0">${c}</td>`).join("")}</tr>`,
          )
          .join("")}</tbody>
      </table>`
    : "";
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title>
    <style>
      body{font-family:Georgia,serif;color:#2a2318;margin:28px;max-width:760px}
      @media print { body { margin: 14mm } }
    </style>
    </head><body>${letterhead(title, ref)}<table style="font-size:14px;width:100%">${lines}</table>${grid}${signoff()}
    <script>window.addEventListener("load", () => window.print())</script></body></html>`;
  const w = window.open("", "_blank", "noopener,noreferrer");
  if (!w) return;
  w.document.open();
  w.document.write(html);
  w.document.close();
}

export async function downloadSlip(
  filename: string,
  title: string,
  rows: SlipRow[],
  table?: { head: string[]; body: string[][] },
) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const left = 18;
  const ref = refNo();
  let y = 16;
  doc.setFont("times", "normal");
  doc.setFontSize(9);
  doc.text("SURE HEALTH", left, y);
  doc.text("DESK RECORD", 192, y, { align: "right" });
  y += 7;
  doc.setFontSize(16);
  doc.text(HOSPITAL.name, left, y);
  y += 6;
  doc.setFontSize(10);
  const address = doc.splitTextToSize(HOSPITAL.address, 120);
  doc.text(address, left, y);
  y += address.length * 4.5 + 2;
  doc.text(`Phone ${PHONE}`, left, y);
  y += 5;
  doc.text(HOSPITAL.email, left, y);
  doc.text(`Ref ${ref}`, 192, y, { align: "right" });
  y += 5;
  doc.text(`Printed ${stamp()}`, 192, y, { align: "right" });
  y += 4;
  doc.setLineWidth(0.5);
  doc.line(left, y, 192, y);
  y += 8;
  doc.setFontSize(13);
  doc.text(title, left, y);
  y += 8;
  doc.setFontSize(11);
  for (const row of rows) {
    doc.text(row.label, left, y);
    const value = doc.splitTextToSize(String(row.value || "-"), 110);
    doc.text(value, 78, y);
    y += Math.max(7, value.length * 5);
    if (y > 250) {
      doc.addPage();
      y = 20;
    }
  }
  if (table && table.body.length) {
    y += 4;
    doc.setFont("times", "bold");
    doc.text(table.head.join("    "), left, y);
    doc.setFont("times", "normal");
    y += 6;
    for (const cells of table.body) {
      const line = doc.splitTextToSize(cells.join("    "), 170);
      doc.text(line, left, y);
      y += line.length * 5 + 1;
      if (y > 250) {
        doc.addPage();
        y = 20;
      }
    }
  }
  y += 16;
  doc.setFontSize(10);
  doc.text("Reception signature", left, y);
  doc.text("Member signature", 120, y);
  y += 12;
  doc.line(left, y, 90, y);
  doc.line(120, y, 192, y);
  y += 10;
  doc.setFontSize(9);
  doc.text(
    "Official Eastern Ryse desk paper. Care Quota is not a blank cheque for surgery, drugs, or boarding.",
    left,
    y,
    { maxWidth: 174 },
  );
  doc.save(filename);
}
