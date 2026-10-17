import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageShell } from "@/components/PageShell";
import { currentUser } from "@/server/auth";
import { updatePassword } from "../actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Mot de passe", robots: { index: false, follow: false } };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function PasswordPage({ searchParams }: Props) {
  const params = await searchParams;
  if (!(await currentUser())) redirect("/compte?m=lien");

  return (
    <PageShell>
      <h1 className="font-serif text-4xl">Nouveau mot de passe</h1>
      <form action={updatePassword} className="mt-8 flex max-w-sm flex-col gap-3">
        <label className="text-[10px] uppercase tracking-[0.22em] text-muted" htmlFor="new-pw">
          Mot de passe (10 caractères minimum)
        </label>
        <input
          id="new-pw"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={10}
          maxLength={72}
          required
          className="border border-border bg-white px-2.5 py-2 text-sm outline-none focus:border-brown"
        />
        {params.m === "invalide" && (
          <p role="alert" className="text-sm text-brown-soft">
            Mot de passe invalide (10 caractères minimum).
          </p>
        )}
        <button
          type="submit"
          className="border border-brown px-4 py-2.5 text-[10px] uppercase tracking-[0.2em] hover:bg-brown hover:text-white"
        >
          Enregistrer
        </button>
      </form>
    </PageShell>
  );
}
