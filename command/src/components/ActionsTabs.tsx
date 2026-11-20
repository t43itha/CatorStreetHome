"use client";

import { useState } from "react";

type Tab = "board" | "waiting" | "owner";

/** By due date / Waiting on others / By owner (plan Screen 4). */
export function ActionsTabs({ board, waiting, owner, counts }: { board: React.ReactNode; waiting: React.ReactNode; owner: React.ReactNode; counts: { open: number; waiting: number } }) {
  const [tab, setTab] = useState<Tab>("board");
  const T = ({ k, children }: { k: Tab; children: React.ReactNode }) => <button className={`tab${tab === k ? " on" : ""}`} onClick={() => setTab(k)}>{children}</button>;
  return (
    <>
      <div className="tabs">
        <T k="board">By due date <span className="c">{counts.open}</span></T>
        <T k="waiting">Waiting on others <span className="c">{counts.waiting}</span></T>
        <T k="owner">By owner</T>
      </div>
      {tab === "board" ? <div className="board">{board}</div> : tab === "waiting" ? <div className="card">{waiting}</div> : <div className="board">{owner}</div>}
    </>
  );
}
