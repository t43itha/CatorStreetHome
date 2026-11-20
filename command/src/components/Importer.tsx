"use client";

import Link from "next/link";
import Script from "next/script";
import { useMemo, useState } from "react";
import { useAct } from "./Act.tsx";
import { Icon } from "./Icons.tsx";
import { buildPreview, DATE_KEYS, detectMapping, FIELDS, inWords, TEMPLATE_HEADERS, type ImportKey } from "@/lib/importer.ts";

// SheetJS 0.20.3 from the vendor CDN (plan Screen 7): the npm `xlsx` package is frozen at 0.18.5 with an unfixed advisory.
const SHEETJS = "https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js";
type XLSXLib = {
  read: (data: ArrayBuffer, opts: object) => { SheetNames: string[]; Sheets: Record<string, unknown> };
  utils: { sheet_to_json: (ws: unknown, opts: object) => Array<Record<string, unknown>>; aoa_to_sheet: (rows: unknown[][]) => unknown; book_new: () => unknown; book_append_sheet: (wb: unknown, ws: unknown, name: string) => void };
  writeFile: (wb: unknown, name: string) => void;
};
const xlsx = () => (window as unknown as { XLSX?: XLSXLib }).XLSX;

export function Importer() {
  const [ready, setReady] = useState(false);
  const [file, setFile] = useState<string>();
  const [headers, setHeaders] = useState<string[]>([]);
  const [raw, setRaw] = useState<Array<Record<string, unknown>>>([]);
  const [mapping, setMapping] = useState<Partial<Record<ImportKey, string>>>({});
  const [swapped, setSwapped] = useState<Partial<Record<ImportKey, boolean>>>({});
  const [result, setResult] = useState<{ clients: number; properties: number; tenancies: number; skipped: string[] }>();
  const commit = useAct("imports:commit");
  const preview = useMemo(() => buildPreview(raw, mapping, swapped), [raw, mapping, swapped]);
  const importable = preview.filter((p) => !p.blocking);

  async function onFile(f: File) {
    const X = xlsx();
    if (!X) return;
    // raw: true keeps CSV text as text, so UK dates are never re-read as US dates; xlsx dates stay as serial numbers.
    const wb = X.read(await f.arrayBuffer(), { type: "array", raw: true, cellDates: false });
    const rows = X.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { raw: true, defval: "" });
    const hs = rows.length ? Object.keys(rows[0]) : [];
    setFile(f.name); setRaw(rows); setHeaders(hs); setMapping(detectMapping(hs)); setSwapped({}); setResult(undefined);
  }

  function downloadTemplate() {
    const X = xlsx();
    if (!X) return;
    const wb = X.utils.book_new();
    X.utils.book_append_sheet(wb, X.utils.aoa_to_sheet([TEMPLATE_HEADERS, ["Jane Example", "jane@example.com", "07700 900000", "Full Management", "No", "12 Example Road", "SE15 1AA", "Yes", "None", "Sam Tenant", "01/06/2026", "01/06/2026", "12/01/2027", "20/03/2030", "05/05/2033", "01/04/2027", "", "No", ""]]), "Portfolio");
    X.writeFile(wb, "csps-import-template.xlsx");
  }

  return (
    <>
      <Script src={SHEETJS} strategy="afterInteractive" onReady={() => setReady(true)} />
      <div className="page-head">
        <div><span className="eyebrow">Import</span><h1 className="page">Import from Excel</h1><p className="lede">The file is read in your browser and never uploaded. Every date is shown in words before anything is saved.</p></div>
        <button className="btn btn-ghost" disabled={!ready} onClick={downloadTemplate}><Icon name="file" />Download template</button>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-head"><div><h2 className="card-title">1 · Choose a file</h2><div className="sub">.xlsx, .xls or .csv · one row per property</div></div></div>
        <div className="card-body">
          <input type="file" accept=".xlsx,.xls,.csv" disabled={!ready} onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }} />
          {!ready && <p className="lede" style={{ fontSize: 13 }}>Loading the spreadsheet reader…</p>}
          {file && <p className="lede" style={{ fontSize: 13 }}>{file}: {raw.length} rows, {headers.length} columns.</p>}
        </div>
      </div>

      {headers.length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-head"><div><h2 className="card-title">2 · Match the columns</h2><div className="sub">Guessed from your headers. Tick &quot;day and month look swapped&quot; if dates read wrongly below.</div></div></div>
          <div className="scroll-x"><table className="matrix">
            <thead><tr><th>Field</th><th>Your column</th><th>Swapped?</th></tr></thead>
            <tbody>
              {FIELDS.map((f) => (
                <tr key={f.key}>
                  <td><div className="dn">{f.label}{f.required ? " *" : ""}</div></td>
                  <td><select value={mapping[f.key] ?? ""} onChange={(e) => setMapping({ ...mapping, [f.key]: e.target.value || undefined })}><option value="">Not in file</option>{headers.map((h) => <option key={h}>{h}</option>)}</select></td>
                  <td>{DATE_KEYS.includes(f.key) && mapping[f.key] && <label style={{ fontSize: 12.5 }}><input type="checkbox" checked={!!swapped[f.key]} onChange={(e) => setSwapped({ ...swapped, [f.key]: e.target.checked })} /> Day and month look swapped</label>}</td>
                </tr>
              ))}
            </tbody>
          </table></div>
        </div>
      )}

      {raw.length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-head"><div><h2 className="card-title">3 · Check the preview</h2><div className="sub">{importable.length} of {preview.length} rows can be imported · {preview.filter((p) => p.flags.length).length} have warnings</div></div>
            <button className="btn btn-primary" disabled={commit.busy || importable.length === 0} onClick={() => commit.act({ rows: importable.map((p) => Object.fromEntries(Object.entries(p.row).filter(([, v]) => v !== undefined && v !== ""))) }, "Import finished").then((r) => setResult(r as typeof result)).catch(() => {})}>Import {importable.length} rows</button></div>
          <div className="scroll-x"><table className="wtable">
            <thead><tr><th>Landlord</th><th>Property</th><th>Tenancy start</th><th>Gas</th><th>EICR</th><th>EPC</th><th>Insurance</th><th>Flags</th></tr></thead>
            <tbody>
              {preview.map((p, i) => (
                <tr key={i} style={p.blocking ? { opacity: 0.5 } : undefined}>
                  <td><b>{p.row.landlord || "—"}</b><br /><small>{p.row.email ?? ""}</small></td>
                  <td>{p.row.address}<br /><small>{p.row.postcode}</small></td>
                  <td>{inWords(p.row.tenancyStart)}</td><td>{inWords(p.row.gasExpiry)}</td><td>{inWords(p.row.eicrExpiry)}</td><td>{inWords(p.row.epcExpiry)}</td><td>{inWords(p.row.insuranceRenewal)}</td>
                  <td>{p.flags.length ? p.flags.map((f) => <div key={f} className="pill soon" style={{ marginBottom: 3 }}>{f}</div>) : <span className="pill current">OK</span>}</td>
                </tr>
              ))}
            </tbody>
          </table></div>
        </div>
      )}

      {result && (
        <div className="card">
          <div className="card-head"><div><h2 className="card-title">Imported</h2><div className="sub">{result.clients} new clients · {result.properties} properties · {result.tenancies} tenancies</div></div><Link className="btn btn-ghost" href="/clients?status=onboarding">Review onboarding</Link></div>
          <div className="note">Everything imported starts in onboarding, so no reminder drafts go out until you review and activate each one.{result.skipped.length ? ` Skipped as already on file: ${result.skipped.join("; ")}.` : ""}</div>
        </div>
      )}
    </>
  );
}
