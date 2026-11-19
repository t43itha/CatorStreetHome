"use client";

import { useState } from "react";
import { Icon } from "./Icons.tsx";

type Panel = "properties" | "review";

/** Steps rail + the two step panels from the approved mockup. Switching steps is local; saving arrives with Convex. */
export function OnboardingFlow({ properties, review }: { properties: React.ReactNode; review: React.ReactNode }) {
  const [panel, setPanel] = useState<Panel>("properties");
  const go = (p: Panel) => { setPanel(p); window.scrollTo(0, 0); };

  return (
    <>
      <div className="card steps">
        <button className="step done"><span className="n">✓</span><div><div className="t">Landlord</div><div className="s">Individual · overseas (Dubai)</div></div></button>
        <button className="step done"><span className="n">✓</span><div><div className="t">Landlord documents</div><div className="s">4 recorded · 2 requested</div></div></button>
        <button className={`step${panel === "properties" ? " on" : ""}`} onClick={() => go("properties")}>
          <span className="n">3</span>
          <div>
            <div className="t">Properties</div><div className="s">2 properties</div>
            <div className="sub"><span className="cur">● 41 Maidstone Road, ME7</span><span>✓ 7 Rochester Road, ME4</span><span>+ Add another property</span></div>
          </div>
        </button>
        <button className={`step${panel === "review" ? " on" : ""}`} onClick={() => go("review")}>
          <span className="n">4</span><div><div className="t">Review &amp; activate</div><div className="s">1 email · 1 action</div></div>
        </button>
      </div>

      <div>
        {panel === "properties" ? (
          <div className="obpanel on">
            {properties}
            <div className="obfoot">
              <button className="btn btn-ghost" disabled title="Saving arrives with the Convex data"><Icon name="plus" />Save &amp; add another property</button>
              <button className="btn btn-primary" onClick={() => go("review")}>Continue to review<Icon name="arrow" /></button>
            </div>
          </div>
        ) : (
          <div className="obpanel on">
            {review}
            <div className="obfoot">
              <button className="btn btn-ghost" onClick={() => go("properties")}>Back to properties</button>
              <button className="btn btn-primary" disabled title="Activation arrives with the Convex data">Activate client</button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
