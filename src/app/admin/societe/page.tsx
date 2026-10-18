import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { company as defaults, missingCompanyFields, type Company } from "@/lib/brand";
import { isAdmin } from "@/server/admin-auth";
import { getBilling } from "@/server/company";
import { isDocumentStorageConfigured } from "@/server/document-storage";
import { AdminTitle, Banner } from "../AdminHeader";
import { saveBillingAction } from "../billing-actions";
import { btnPrimary, btn, card, input, label, sectionTitle } from "../ui";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Administration — Société et facturation",
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const one = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

type FieldDef = { name: keyof Company; label: string; max: number; hint?: string; wide?: boolean; area?: boolean };

const GROUPS: { title: string; fields: FieldDef[] }[] = [
  {
    title: "Identité légale",
    fields: [
      { name: "legalName", label: "Raison sociale", max: 120 },
      { name: "legalForm", label: "Forme juridique", max: 80, hint: "SAS, SARL, entreprise individuelle…" },
      { name: "shareCapital", label: "Capital social", max: 40, hint: "Ex. 1 000 €" },
      { name: "siret", label: "SIRET", max: 20, hint: "14 chiffres" },
      { name: "rcs", label: "Ville du RCS", max: 60, hint: "Ex. Paris" },
      { name: "vatNumber", label: "N° de TVA intracommunautaire", max: 20, hint: "FR + 2 caractères + 9 chiffres" },
    ],
  },
  {
    title: "Siège social",
    fields: [
      { name: "address", label: "Adresse", max: 160, wide: true },
      { name: "postalCode", label: "Code postal", max: 10 },
      { name: "city", label: "Ville", max: 60 },
      { name: "country", label: "Pays", max: 60 },
    ],
  },
  {
    title: "Contact, retours et mentions",
    fields: [
      { name: "phone", label: "Téléphone", max: 30 },
      { name: "publisher", label: "Directeur de la publication", max: 80 },
      { name: "returnAddress", label: "Adresse de retour des colis", max: 240, wide: true, area: true },
      {
        name: "mediator",
        label: "Médiateur de la consommation",
        max: 300,
        hint: "Nom, adresse et site (obligatoire pour vendre à des consommateurs).",
        wide: true,
        area: true,
      },
      { name: "host", label: "Hébergeur", max: 200, wide: true, area: true },
    ],
  },
];

const FIELD_LABEL: Record<string, string> = Object.fromEntries(
  GROUPS.flatMap((group) => group.fields.map((f) => [f.name, f.label])),
);

export default async function BillingAdminPage({ searchParams }: Props) {
  if (!(await isAdmin())) redirect("/admin");
  const params = await searchParams;
  const { company, invoice } = await getBilling();
  const missing = missingCompanyFields(company);
  const storage = isDocumentStorageConfigured();
  const currentMonth = new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Paris" }).slice(0, 7);

  return (
    <>
      <AdminTitle
        title="Société et facturation"
        lead="Ces informations figurent sur les factures, les avoirs, les bordereaux et les mentions légales du site. Chaque facture en conserve une copie à son émission : modifier ici ne change jamais une facture déjà émise."
      />
      <Banner notice={one(params.notice)} error={one(params.error)} field={one(params.field)} />

      <section className={`mt-8 grid gap-4 p-5 sm:grid-cols-2 ${card}`}>
        <div>
          <p className={label}>Informations légales</p>
          {missing.length === 0 ? (
            <p className="mt-2 text-sm">Complètes.</p>
          ) : (
            <p className="mt-2 text-sm leading-relaxed">
              <span className="text-gold">À compléter avant la mise en ligne : </span>
              {missing.map((name) => FIELD_LABEL[name] ?? name).join(", ")}.
            </p>
          )}
        </div>
        <div>
          <p className={label}>Archivage des factures (S3)</p>
          <p className="mt-2 text-sm leading-relaxed">
            {storage
              ? "Actif : chaque facture et chaque avoir est archivé en PDF dans le dossier privé « documents/ » du bucket."
              : "Non configuré : les PDF sont générés à la demande depuis la base. Renseignez les variables S3_* pour les archiver."}
          </p>
        </div>
      </section>

      <form action={saveBillingAction} className="mt-10 space-y-12">
        {GROUPS.map((group) => (
          <section key={group.title}>
            <h2 className={sectionTitle}>{group.title}</h2>
            <div className="mt-4 grid gap-5 sm:grid-cols-2">
              {group.fields.map((f) => {
                const value = company[f.name] === defaults[f.name] && defaults[f.name].startsWith("[") ? "" : company[f.name];
                return (
                  <div key={f.name} className={f.wide ? "sm:col-span-2" : undefined}>
                    <label htmlFor={f.name} className={label}>
                      {f.label}
                    </label>
                    {f.area ? (
                      <textarea
                        id={f.name}
                        name={f.name}
                        rows={2}
                        maxLength={f.max}
                        defaultValue={value}
                        placeholder={defaults[f.name]}
                        className={`${input} mt-1`}
                      />
                    ) : (
                      <input
                        id={f.name}
                        name={f.name}
                        maxLength={f.max}
                        defaultValue={value}
                        placeholder={defaults[f.name]}
                        className={`${input} mt-1`}
                      />
                    )}
                    {f.hint && <p className="mt-1 text-xs text-muted">{f.hint}</p>}
                  </div>
                );
              })}
            </div>
          </section>
        ))}

        <section>
          <h2 className={sectionTitle}>Facturation et TVA</h2>
          <div className="mt-4 space-y-5">
            <div>
              <label htmlFor="vatMode" className={label}>
                Régime de TVA des ventes dans l&apos;Union européenne
              </label>
              <select id="vatMode" name="vatMode" defaultValue={invoice.vatMode} className={`${input} mt-1`}>
                <option value="destination">TVA du pays de livraison (guichet unique OSS)</option>
                <option value="origin">TVA française (seuil de 10 000 € de ventes UE non dépassé)</option>
              </select>
              <p className="mt-1 text-xs text-muted">
                Les prix affichés sont TTC et identiques partout : la facture en extrait la TVA au taux choisi.
                À valider avec votre expert-comptable.
              </p>
            </div>
            <div>
              <label htmlFor="footer" className={label}>
                Mentions complémentaires en pied de facture (facultatif)
              </label>
              <textarea
                id="footer"
                name="footer"
                rows={2}
                maxLength={240}
                defaultValue={invoice.footer}
                className={`${input} mt-1`}
              />
            </div>
          </div>
        </section>

        <p className="text-xs text-muted">
          Un champ vide rétablit la valeur par défaut. Numérotation automatique et continue : FA-AAAA-000001 pour
          les factures, AV-AAAA-000001 pour les avoirs.
        </p>
        <button type="submit" className={btnPrimary}>
          Enregistrer
        </button>
      </form>

      <section className="mt-16 border-t border-border pt-8">
        <h2 className={sectionTitle}>Export comptable</h2>
        <p className="mt-2 text-xs text-muted">
          Factures et avoirs d&apos;un mois, au format CSV (séparateur point-virgule, lisible dans Excel).
        </p>
        <form action="/admin/export" method="get" className="mt-4 flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="periode" className={label}>
              Mois
            </label>
            <input id="periode" type="month" name="periode" defaultValue={currentMonth} className={`${input} mt-1`} />
          </div>
          <button type="submit" className={btn}>
            Télécharger le CSV
          </button>
        </form>
      </section>
    </>
  );
}
