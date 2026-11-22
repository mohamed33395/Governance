/** Text is either a literal string or a translation key ({ k }). */
export type Txt = string | { k: string };

export interface DetailItem {
  category: Txt;
  title: Txt;
  lead: Txt;
  bullets: Txt[];
  aside: {
    title: Txt;
    price?: Txt;
    period?: Txt;
    points: Txt[];
  };
  cta: { text: Txt; href: string };
  features?: { title: Txt; desc: Txt }[];
}

const bullets = (id: string, count: number): Txt[] =>
  Array.from({ length: count }, (_, i) => ({ k: `d.${id}.b${i + 1}` }));

const points = (id: string, count: number): Txt[] =>
  Array.from({ length: count }, (_, i) => ({ k: `d.${id}.p${i + 1}` }));

const aside = (id: string, title: string, count: number): DetailItem["aside"] => ({
  title: { k: title },
  points: points(id, count),
});

const service = (id: string, bulletCount: number): DetailItem => ({
  category: { k: "d.cat.services" },
  title: { k: `d.${id}.title` },
  lead: { k: `d.${id}.lead` },
  bullets: bullets(id, bulletCount),
  aside: aside(id, "d.aside.what", 4),
  cta: { text: { k: `d.${id}.cta` }, href: "/packages" },
});

const license = (id: string, cta: { k: string; href: string } | { k: string; href: "/contact" } = { k: "d.cta.request", href: "/packages" }): DetailItem => ({
  category: { k: "d.cat.licenses" },
  title: { k: `d.${id}.title` },
  lead: { k: `d.${id}.lead` },
  bullets: bullets(id, 4),
  aside: aside(id, id === "license-1" ? `d.${id}.aTitle` : "d.aside.scope", 4),
  cta: { text: { k: cta.k }, href: cta.href },
});

const pkg = (id: string, bulletCount: number, pointCount: number): DetailItem => ({
  category: { k: "d.cat.packages" },
  title: { k: `d.${id}.title` },
  lead: { k: `d.${id}.lead` },
  bullets: bullets(id, bulletCount),
  aside: {
    ...aside(id, "d.aside.pkg", pointCount),
    price: { k: `d.${id}.price` },
    period: { k: "d.period.month" },
  },
  cta: { text: { k: "d.cta.choose" }, href: "/packages" },
});

export const DETAIL_ITEMS: Record<string, DetailItem> = {
  "service-1": service("service-1", 6),
  "service-2": service("service-2", 6),
  "service-3": service("service-3", 7),
  "service-4": service("service-4", 6),
  "service-5": service("service-5", 6),
  "service-6": service("service-6", 6),

  "license-1": license("license-1", { k: "d.license-1.cta", href: "/contact" }),
  "license-2": license("license-2"),
  "license-3": license("license-3"),
  "license-4": license("license-4"),
  "license-5": license("license-5"),
  "license-6": license("license-6"),

  "package-1": pkg("package-1", 5, 4),
  "package-2": pkg("package-2", 5, 5),
  "package-3": pkg("package-3", 6, 6),

  join: {
    category: { k: "d.cat.join" },
    title: { k: "d.join.title" },
    lead: { k: "d.join.lead" },
    bullets: bullets("join", 6),
    aside: aside("join", "d.aside.req", 4),
    cta: { text: { k: "d.join.cta" }, href: "/join" },
  },

  "how-to-start": {
    category: { k: "d.cat.how" },
    title: { k: "d.how-to-start.title" },
    lead: { k: "d.how-to-start.lead" },
    bullets: bullets("how-to-start", 3),
    aside: aside("how-to-start", "d.aside.areas", 5),
    cta: { text: { k: "d.how-to-start.cta" }, href: "/packages" },
  },
};

export const DIR_STRUCTURE: { id: string; title: Txt; ids: string[] }[] = [
  { id: "services", title: { k: "services" }, ids: ["service-1", "service-2", "service-3", "service-4", "service-5", "service-6"] },
  { id: "licenses", title: { k: "d.dir.licenses" }, ids: ["license-1", "license-2", "license-3", "license-4", "license-5", "license-6"] },
  { id: "packages", title: { k: "packages" }, ids: ["package-1", "package-2", "package-3"] },
  { id: "join", title: { k: "join" }, ids: ["join"] },
  { id: "how-to-start", title: { k: "d.dir.how" }, ids: ["how-to-start"] },
];
