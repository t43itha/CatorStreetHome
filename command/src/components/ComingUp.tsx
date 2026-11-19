"use client";

import { useState } from "react";
import type { HomeView } from "@/lib/home.ts";
import { Icon } from "./Icons.tsx";

const HORIZONS = [7, 14, 30, 60] as const;

export function ComingUp({ sections }: { sections: HomeView["upcoming"] }) {
  const [horizon, setHorizon] = useState<number>(30);

  return (
    <div className="card">
      <div className="card-head">
        <div>
          <h2 className="card-title">Coming up</h2>
          <div className="sub">Renewals, tenancy dates and promises on the horizon</div>
        </div>
        <div className="segs">
          {HORIZONS.map((h) => (
            <button key={h} className={`seg${h === horizon ? " on" : ""}`} onClick={() => setHorizon(h)}>
              {h} days
            </button>
          ))}
        </div>
      </div>
      <div className="rows">
        {sections.map((section) => {
          const rows = section.rows.filter((r) => r.days <= horizon);
          if (!rows.length) return null;
          return (
            <div key={section.label} style={{ display: "contents" }}>
              <div className="section-label">{section.label}</div>
              {rows.map((r) => (
                <div className="row" key={`${r.title}|${r.sub}`}>
                  <div className={`ico ${r.tone}`}><Icon name={r.icon} /></div>
                  <div><div className="t">{r.title}</div><div className="s">{r.sub}</div></div>
                  {r.badge.kind === "pill"
                    ? <span className={`pill ${r.badge.cls}`}>{r.badge.label}</span>
                    : <span className="tag">{r.badge.label}</span>}
                  <div className={`when ${r.whenTone}`}>{r.when}</div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
