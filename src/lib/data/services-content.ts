/** Text is either a literal string or a translation key ({ k }). */
export type Txt = string | { k: string };

export interface ServiceItem {
  title?: Txt;
  body: Txt;
}

export interface ServiceGroup {
  id: string;
  title: Txt;
  /** short label used in the tab list (falls back to title) */
  label?: Txt;
  featured?: boolean;
  kicker?: Txt;
  items: ServiceItem[];
  href: string;
  hrefLabel?: Txt;
}

const simple = (prefix: string, count: number): ServiceItem[] =>
  Array.from({ length: count }, (_, i) => ({ body: { k: `${prefix}i${i + 1}` } }));

export const SERVICE_GROUPS: ServiceGroup[] = [
  {
    id: "t7",
    title: { k: "svc.t7.title" },
    featured: true,
    kicker: { k: "svc.t7.kicker" },
    href: "/details#license-1",
    hrefLabel: { k: "svc.t7.hrefLabel" },
    items: [
      {
        title: { k: "svc.t7.i1t" },
        body: { k: "svc.t7.i1b" },
      },
      {
        title: { k: "svc.t7.i2t" },
        body: { k: "svc.t7.i2b" },
      },
      {
        title: { k: "svc.t7.i3t" },
        body: { k: "svc.t7.i3b" },
      },
    ],
  },
  { id: "t1", title: { k: "service1" }, href: "/details#service-1", items: simple("s1", 5) },
  { id: "t2", title: { k: "service2" }, href: "/details#service-2", items: simple("s2", 3) },
  { id: "t3", title: { k: "service3" }, href: "/details#service-3", items: simple("s3", 5) },
  {
    id: "t4",
    title: { k: "service4" },
    href: "/details#service-4",
    items: [
      {
        title: { k: "s4i1" },
        body: { k: "s4i1b" },
      },
      {
        title: { k: "s4i2" },
        body: { k: "s4i2b" },
      },
      {
        title: { k: "s4i3" },
        body: { k: "s4i3b" },
      },
      {
        title: { k: "s4i4" },
        body: { k: "s4i4b" },
      },
      {
        title: { k: "s4i5" },
        body: { k: "s4i5b" },
      },
    ],
  },
  {
    id: "t5",
    title: { k: "service5" },
    href: "/details#service-5",
    items: [
      {
        title: { k: "s5i1" },
        body: { k: "s5i1b" },
      },
      {
        title: { k: "s5i2" },
        body: { k: "s5i2b" },
      },
      {
        title: { k: "s5i3" },
        body: { k: "s5i3b" },
      },
      {
        title: { k: "s5i4" },
        body: { k: "s5i4b" },
      },
      {
        title: { k: "s5i5" },
        body: { k: "s5i5b" },
      },
    ],
  },
  { id: "t6", title: { k: "service6" }, label: { k: "service6short" }, href: "/details#service-6", items: simple("s6", 5) },
];
