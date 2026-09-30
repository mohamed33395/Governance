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
  kicker?: string;
  items: ServiceItem[];
  href: string;
  hrefLabel?: Txt;
}

const simple = (prefix: string, count: number): ServiceItem[] =>
  Array.from({ length: count }, (_, i) => ({ body: { k: `${prefix}i${i + 1}` } }));

export const SERVICE_GROUPS: ServiceGroup[] = [
  {
    id: "t7",
    title: "الخدمات الاستشارية لمنصة خبرة",
    featured: true,
    kicker: "خدمات منصة خبرة",
    href: "/details#license-1",
    hrefLabel: "عرض تفاصيل الاعتماد",
    items: [
      {
        title: "إعداد تقارير الخبرة القضائية",
        body: "تقديم دراسات فنية دقيقة حول القضايا والنزاعات الإدارية المحالة من الدوائر القضائية، وصياغة حلول مهنية محايدة.",
      },
      {
        title: "تقديم الآراء في النزاعات التعاقدية",
        body: "فحص وتحليل النزاعات المتعلقة بالعقود الإدارية والهياكل التنظيمية وإجراءات التشغيل داخل المنشآت، ومقارنتها باللوائح والأنظمة المعمول بها.",
      },
      {
        title: "تقديم العروض الفنية",
        body: "تقديم حلول واستشارات فنية من خبراء المنصة بناءً على معايير الطلب المرفوع من الدائرة القضائية.",
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
        body: "استقطاب خبرات متخصصة في البرمجيات والأمن السيبراني والذكاء الاصطناعي.",
      },
      {
        title: { k: "s4i2" },
        body: "توفير متخصصين في التسويق الإلكتروني وتحليل سلوك المستهلك وإدارة الحملات الرقمية.",
      },
      {
        title: { k: "s4i3" },
        body: "استقطاب كفاءات هندسية متخصصة تلائم احتياجات القطاعات التقنية والصناعية.",
      },
      {
        title: { k: "s4i4" },
        body: "توفير قيادات ومديري مشاريع وكفاءات إدارية عليا لدعم استراتيجيات المؤسسات.",
      },
      {
        title: { k: "s4i5" },
        body: "استقطاب محترفي المبيعات وتطوير الأعمال القادرين على بناء الفرص وتنمية الإيرادات.",
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
        body: "اختيار المنهجية المناسبة لبيئة المنشأة وآلية تنفيذ المهام وتخطيط الأنشطة المطلوبة.",
      },
      {
        title: { k: "s5i2" },
        body: "تحديد أصحاب المصلحة وأدوارهم ومسؤولياتهم، وبناء آليات تواصل فعّالة معهم.",
      },
      {
        title: { k: "s5i3" },
        body: "وضع القواعد المنظمة لاتخاذ القرارات وتغيير المتطلبات واعتمادها.",
      },
      {
        title: { k: "s5i4" },
        body: "تحديد كيفية تخزين وتنظيم وحفظ المعلومات والوثائق المرتبطة بالمتطلبات.",
      },
      {
        title: { k: "s5i5" },
        body: "وضع معايير واضحة لقياس جودة وفاعلية أعمال تحليل الأعمال وتقييم نتائجها.",
      },
    ],
  },
  { id: "t6", title: { k: "service6" }, label: { k: "service6short" }, href: "/details#service-6", items: simple("s6", 5) },
];
