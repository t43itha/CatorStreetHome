"use client";

import { useState } from "react";

/** "By due date" board vs "Waiting on others" table, as in the approved mockup. */
export function ActionsTabs({ board, waiting }: { board: React.ReactNode; waiting: React.ReactNode }) {
  const [tab, setTab] = useState<"board" | "waiting">("board");
  return (
    <>
      <div className="tabs">
        <button className={`tab${tab === "board" ? " on" : ""}`} onClick={() => setTab("board")}>By due date <span className="c">16</span></button>
        <button className={`tab${tab === "waiting" ? " on" : ""}`} onClick={() => setTab("waiting")}>Waiting on others <span className="c">7</span></button>
        <button className="tab" disabled title="By owner arrives with the Convex data">By owner</button>
      </div>
      {tab === "board" ? <div className="board">{board}</div> : <div className="card">{waiting}</div>}
    </>
  );
}
