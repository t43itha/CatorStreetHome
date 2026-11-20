import Link from "next/link";
import { Shell } from "@/components/Shell.tsx";
import { NewClientForm } from "@/components/NewClientForm.tsx";

export default function NewClientPage() {
  return (
    <Shell active="clients">
      <div className="crumbs"><Link href="/clients">Clients</Link><span>/</span><span>Add client</span></div>
      <div className="page-head"><div><span className="eyebrow">Onboarding · saved as you go</span><h1 className="page">Add a client</h1><p className="lede">Start with the landlord. Documents, properties and compliance come next, and you can stop at any point and resume later.</p></div></div>
      <NewClientForm />
    </Shell>
  );
}
