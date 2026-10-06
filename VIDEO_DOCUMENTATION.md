# GCMC — تحليل المنتج وقصة فيديو الشرح

الحالة: **تحليل وstoryboard فقط**. لا يوجد تسجيل نهائي في هذه المرحلة.

مصدر الحقيقة، بالترتيب:

1. التطبيق كما هو مكتوب في هذا المستودع (المسارات والصفحات والـ API client).
2. `AGENTS.md` (عقد الـ API الذي تم التحقق منه).
3. `FRONTEND_IMPLEMENTATION_PLAN.md` (قواعد العمل).
4. الأنواع في `src/types/api.ts`.

التطبيق لم يُشغَّل للتسجيل في هذه المرحلة. أي selector في سكربتات Playwright أدناه مستنتج من الكود، ويُراجع على الشاشة الحية قبل التسجيل.

---

## تعارضات موثّقة (لا تُخترع لها تفسير)

| الموضوع | الخطة (`FRONTEND_IMPLEMENTATION_PLAN.md`) | الكود الفعلي | ما يُقال في الفيديو |
|---|---|---|---|
| الصفحة الرئيسية | `/` يعيد التوجيه إلى `/packages` | `/` صفحة هبوط تسويقية كاملة | نعرض صفحة الهبوط كما هي |
| صفحات تسويق إضافية | غير مذكورة في جدول المسارات | `/services` `/about` `/join` `/team` `/contact` `/app` `/details` `/detail` | تُذكر كصفحات محتوى، مع توضيح ما لا يتصل بالـ API |
| فريق العمل `/team` | غير مذكور | أسماء وصور ثابتة (Unsplash)، ليست `GET /public/consultants` | لا تُقدَّم كقائمة المستشارين الحقيقية |
| انضم إلينا `/join` | غير مذكور | النموذج يضبط حالة محلية فقط، بلا request | لا يُدّعى أنه ينشئ مستشاراً |
| تواصل معنا `/contact` | غير مذكور | يحفظ الرسالة في `localStorage` بمفتاح `adminNotifications` | لا يُدّعى أنها تصل للـ backend |
| صفحة التطبيق `/app` | غير مذكورة | شاشات هاتف وهمية في `AppScreens` | لا تُستخدم كدليل على بوابة العميل |
| `/detail` | غير مذكور | صفحة legacy تقرأ نشاطاً اختيارياً من سكربت قديم، ليست بوابة الحجوزات | خارج مسار الفيديو التشغيلي |
| i18n | `next-intl` | i18n مخصص في `src/lib/i18n`، كوكي `NEXT_LOCALE`، بلا `next-intl` في `package.json` | نشرح التنفيذ الفعلي |
| إصدار Next | الخطة تقول 15 | `package.json`: Next **16.3.5**، React 19.2.8 | نذكر الإصدار الفعلي |
| عنوان الـ API | الخطة: `http://localhost:8000/api/v1` | `AGENTS.md`: `http://127.0.0.1:8000/api/v1` عبر `NEXT_PUBLIC_API_URL` | كلاهما local؛ القيمة الحية هي متغير البيئة |

باقي عقد الحجز، الصلاحيات، وعرض المبالغ من `*_formatted` متوافق بين الخطة والكود.

---

## 1. Application overview

**GCMC** منصة استشارات عربية (RTL افتراضياً) لمكتب حوكمة وامتثال. الشركة تبيع **باقات استشارية**. العميل يحجز جلسة أونلاين (30 دقيقة حسب `public/meta` → `booking.duration_minutes`) مع مستشار، وبعد الجلسة يرفع المستشار تقريراً ينزّله العميل.

هذا المستودع **frontend فقط** (Next.js App Router). الـ backend Laravel منفصل تحت `/api/v1`.

ثلاث مناطق:

| المنطقة | من يدخل | الحماية |
|---|---|---|
| الموقع العام + معالج الحجز | أي زائر، ثم عميل بعد خطوة الحساب | لا guard على الصفحات العامة؛ طلبات `/client/*` تحتاج توكن العميل |
| بوابة العميل | شركة (`clients`) | `RequireClient` + `GET /client/auth/me` |
| لوحة الإدارة | موظف `type=admin` أو مستشار `type=consultant` (كلاهما في `users`) | `RequireAdmin` + صلاحيات `view-*` |

الغلاف الموحّد للـ API: `{ success, message, data, error_code, errors }`.

الحالة على السيرفر عبر TanStack Query. حالة الجلسة عبر zustand persist: `client-auth` و`admin-auth`. حالة المعالج عبر `stores/wizard.ts` (غير persist).

المال في الـ payload بالهللة. العرض دائماً من `price_formatted` / `amount_formatted`. تحويل الإدخال من ريال إلى هللة: `Math.round(sar * 100)`.

اللغة: عربي افتراضي وRTL، وإنجليزي عبر مبدّل اللغة. `Accept-Language` يتبع الكوكي، فتسميات الحالة وأسماء الأيام تأتي مترجمة من الـ backend.

---

## 2. User roles

### زائر

يتصفح الهبوط، الخدمات، الباقات، المستشارين، عن المكتب، الفريق (محتوى ثابت)، انضم إلينا، وتواصل معنا. يقدر يبدأ حجز باقة ويصل لخطوة إنشاء حساب أو دخول.

### عميل (client)

حساب شركة. بعد `POST /client/auth/login` أو `register` يحصل على `{ token, user }`. الـ token يُرسل فقط لطلبات تبدأ بـ `/client`.

يستطيع: إكمال الحجز، إدارة المواقع، بطاقات الدفع (token فقط)، رؤية الحجوزات والتقارير والاشتراكات، إلغاء حجز ضمن نافذة الإلغاء، تنزيل التقارير، تعديل الملف وكلمة المرور.

لا توجد صلاحيات granular للعميل. الإلغاء يظهر حسب `booking.can.cancel`.

### أدمن (`user.type = admin`)

قائمة جانبية حسب الصلاحيات، لا حسب النوع وحده. الأدمن النموذجي بعد الـ seed يرى: لوحة التحكم، الحجوزات، التقارير، المدفوعات، العملاء، المستشارين، الباقات، المستخدمين، الأدوار. **لا** يرى «توافري» لأن عنصرها `consultantOnly`.

الصلاحيات flat array من `GET /admin/auth/me`. الواجهة تخفي الزر؛ الـ backend يرد 403.

### مستشار (`user.type = consultant`)

نفس تطبيق الأدمن ونفس guard `admin`. البيانات مفلترة على السيرفر (حجوزاته وعملاؤه وتقاريره). رد إحصائيات اللوحة **بدون** مفتاحي `consultants` و`revenue`.

صلاحياته الافتراضية في الخطة: `view-dashboard`, `view-bookings`, `complete-bookings`, `cancel-bookings`, `view-reports`, `upload-reports`, `download-reports`, `view-clients`, `view-availability`, `manage-availability`.

القائمة المتوقعة: لوحة التحكم، الحجوزات، التقارير، العملاء، توافري. إخفاء المستشارين/الباقات/المستخدمين/الأدوار/المدفوعات ما لم تُمنح الصلاحية.

حسابات التجربة (بعد seed، كلمة المرور `Password@123`):

- `admin@gcmc.sa`
- `ahmad.alotaibi@gcmc.sa` (مستشار؛ المعرّفات المزروعة تبدأ من 6)
- `client@gcmc.sa`

---

## 3. Navigation map

### الهيدر العام (`Header.tsx`)

`/` الرئيسية · `/services` · `/packages` · `/consultants` · `/about` · `/join` · `/team` · `/contact`

مع مبدّل لغة. إن وُجد توكن عميل يظهر رابط لوحة العميل `/dashboard`، وإلا دخول `/login` وإنشاء حساب `/register`.

مسارات عامة غير ظاهرة في الهيدر: `/book/[packageSlug]`، `/consultants/[id]`، `/forgot-password`، `/reset-password`، `/app`، `/details`، `/detail`.

### بوابة العميل (`ClientShell`)

`/dashboard` · `/bookings` · `/reports` (شارة غير المقروء من `reports.unread`) · `/my-packages` · `/locations` · `/payment-methods` · `/profile`

`/client` و`/client/[...slug]` إعادة توجيه legacy إلى المسارات الجديدة.

`/bookings/payment-callback` صفحة عودة 3DS، داخل منطقة العميل المحمية.

### لوحة الإدارة (`registry.ts` + `AdminShell`)

مجموعات:

- نظرة عامة: `/admin`
- التشغيل: `/admin/bookings`، `/admin/my-availability` (مستشار فقط)، `/admin/reports`، `/admin/payments`
- الأشخاص: `/admin/clients`، `/admin/consultants`
- الكتالوج: `/admin/packages`
- الوصول: `/admin/users`، `/admin/roles`

تفاصيل: `/admin/bookings/[id]`، `/admin/bookings/calendar`، `/admin/clients/[id]`، `/admin/consultants/[id]`، `/admin/profile`.

دخول الموظفين: `/admin/login`، `/admin/forgot-password`، `/admin/reset-password`.

---

## 4. Feature inventory

### يعمل عبر الـ API (يُعرض في الفيديو كمنتج)

- كتالوج الباقات العامة واختيار باقة.
- دليل المستشارين العام (بحث + تخصص + صفحة شخص).
- تسجيل/دخول/نسيت كلمة المرور للعميل وللأدمن (مساران مستقلان).
- معالج حجز: حساب → مستشار → تاريخ ووقت → موقع → دفع (يُتخطى إن كان الاشتراك يغطي) → تأكيد.
- Quote يعيد `requires_payment` و`slot_available`.
- دفع: بطاقة محفوظة أو token. محلياً driver `fake` بثلاث tokens. إنتاجاً Moyasar في المتصفح، وأرقام البطاقة لا تذهب لـ API المشروع.
- بوابة العميل: ملخص، حجوزات، إلغاء، تقارير وتنزيل، اشتراكات، مواقع، وسائل دفع، ملف شخصي.
- لوحة أدمن: KPIs ورسوم، حجوزات وفلاتر وتقويم، إكمال/إلغاء/رابط Meet/تعليم مسترد، رفع تقرير.
- عملاء ومستشارون (تبويبات: ملف، توافر، إجازات، عملاء، حجوزات، تقارير معلقة، تقارير، معاينة المواعيد).
- باقات (سعر بالريال في النموذج، إرسال بالهللة).
- مدفوعات (قائمة + درج تفاصيل).
- مستخدمون وأدوار وصلاحيات مجمّعة.
- توافر المستشار لنفسه: `/admin/my-availability`.

### محتوى ثابت أو محلي (يُذكر بصدق، ولا يُبنى عليه workflow)

- خدمات، عن المكتب، تفاصيل الخدمات: نصوص ترجمة / `details-content`.
- فريق العمل: مصفوفة ثابتة.
- انضم إلينا: نجاح محلي بلا API.
- تواصل معنا: `localStorage` فقط.
- `/app`: مجسمات شاشات.
- `/detail`: legacy.

---

## 5. Screen inventory

| المسار | ماذا يرى المستخدم | بيانات |
|---|---|---|
| `/` | هيرو، منافع، خطوات، خدمات، باقات، خبير، آراء، رؤية، أسئلة | باقات من API داخل `PackageGrid`؛ الباقي ترجمة |
| `/services` | تبويبات خدمات | ترجمة |
| `/packages` | بطاقات سعر، مميز، حدود الاستشارات/المستندات، زر اختيار | `GET /public/packages` |
| `/consultants` | بحث، فلتر تخصص، بطاقات، ترقيم | `GET /public/consultants` |
| `/consultants/[id]` | صورة، نبذة، أيام العمل | `GET /public/consultants/{id}` + meta لأيام الأسبوع |
| `/book/[slug]` | خطوات + ملخص جانبي + نتيجة الحجز | انظر قسم الـ API |
| `/login` `/register` `/forgot-password` `/reset-password` | نماذج عميل | `/client/auth/*` |
| `/dashboard` | الحجز القادم، أرقام، اشتراكات نشطة، انضمام للاجتماع | `GET /client/dashboard` |
| `/bookings` | تبويبات حالة | `GET /client/bookings` |
| `/bookings/[id]` | مستشار، موقع، اجتماع، دفع، تقرير، إلغاء | `GET` + `POST .../cancel` |
| `/bookings/payment-callback` | تحقق دفع | `POST /client/payments/{id}/verify` |
| `/reports` `/reports/[id]` | قائمة وتفاصيل وتنزيل | `GET /client/reports` |
| `/my-packages` | اشتراكات واستخدام | `GET /client/subscriptions` |
| `/locations` | بطاقات + نموذج | CRUD `/client/locations` |
| `/payment-methods` | بطاقات محفوظة | token ثم `POST /client/payment-methods` |
| `/profile` | بيانات، صورة، كلمة مرور | `/client/profile` |
| `/admin/login` (+ forgot/reset) | دخول موظفين | `/admin/auth/*` |
| `/admin` | KPI، دونات الحالات، أعمدة، جدول قادم | `GET /admin/dashboard/stats` |
| `/admin/bookings` | فلاتر وجدول شارات | `GET /admin/bookings` + stats |
| `/admin/bookings/calendar` | شهر | `GET /admin/bookings/calendar?from&to` |
| `/admin/bookings/[id]` | طرفان، اجتماع، مدفوعات، تقرير، أزرار | `GET` + complete/cancel/meeting/mark-refunded/report |
| `/admin/reports` | قائمة، تنزيل، إعادة إرسال، حذف | `/admin/reports` |
| `/admin/payments` | قائمة + تفاصيل | `/admin/payments` |
| `/admin/clients` `[id]` | قائمة وتبويبات | `/admin/clients` |
| `/admin/consultants` `[id]` | قائمة وتبويبات تشغيل المستشار | `/admin/consultants` |
| `/admin/my-availability` | توافر، إجازات، معاينة مواعيد | `/admin/my/*` |
| `/admin/packages` | بطاقات + نموذج | `/admin/packages` |
| `/admin/users` | جدول + أدوار | `/admin/users` |
| `/admin/roles` | أدوار + منتقي صلاحيات | `/admin/roles` + `/admin/permissions` |
| `/admin/profile` | ملف الموظف/المستشار | `/admin/profile` |
| حالات مشتركة | spinner / `TableSkeleton`، `ErrorState` مع إعادة محاولة، `EmptyState`، 403 «غير مسموح» | — |

---

## 6. API mapping

الأساس: `NEXT_PUBLIC_API_URL`. التوكن حسب بادئة المسار في `src/lib/api.ts`: `/admin` → توكن الأدمن، `/client` → توكن العميل، `/public` بلا توكن. 401 يمسح المخزن المناسب ويعيد التوجيه لصفحة الدخول الصحيحة.

### عام

| العملية | Endpoint |
|---|---|
| ميتا (مدد الحجز، أيام، بوابة الدفع) | `GET /public/meta` |
| باقات نشطة | `GET /public/packages` |
| باقة بالـ slug | `GET /public/packages/{slug}` |
| مستشارون | `GET /public/consultants?search&specialization&page` |
| مستشار | `GET /public/consultants/{id}` |
| أيام متاحة | `GET /public/consultants/{id}/available-dates?month=YYYY-MM` |
| مواعيد يوم | `GET /public/consultants/{id}/slots?date=` |

### عميل

| العملية | Endpoint |
|---|---|
| تسجيل / دخول / أنا / خروج | `POST /client/auth/register` · `login` · `GET /me` · `POST /logout` |
| نسيت / إعادة تعيين | `POST /client/auth/forgot-password` · `reset-password` |
| لوحة | `GET /client/dashboard` |
| تسعير | `POST /client/bookings/quote` |
| إنشاء حجز | `POST /client/bookings` |
| قائمة / تفاصيل / إلغاء | `GET /client/bookings` · `GET /{id}` · `POST /{id}/cancel` |
| تحقق دفع | `POST /client/payments/{id}/verify` |
| تقارير / تنزيل | `GET /client/reports` · `GET /{id}` · `GET /{id}/download` |
| اشتراكات | `GET /client/subscriptions` · `GET /subscriptions/active` |
| مواقع | `GET/POST /client/locations` · `PUT /{id}` · `PATCH /{id}/default` · `DELETE /{id}` |
| بطاقات | `GET/POST /client/payment-methods` · `PATCH /{id}/default` · `DELETE /{id}` |
| ملف | `PUT /client/profile` · `POST/DELETE /profile/avatar` · `PUT /profile/password` |

جسم الحجز الفعلي: `package_id` (ليس slug)، `time` بصيغة `HH:MM` (ليس `start_time`)، `client_location_id`، `client_notes`، وإما `payment_method_id` أو `card_token` + `save_card`.

### أدمن (مختصر تشغيلي)

- Auth: `/admin/auth/login|logout|me|forgot-password|reset-password`
- لوحة: `GET /admin/dashboard/stats`
- حجوزات: `GET /admin/bookings` · `GET /calendar` · `GET /{id}` · `POST /{id}/complete|cancel|meeting|mark-refunded` · `POST /{id}/report`
- تقارير: `GET /admin/reports` · `GET /stats` · `POST /{id}/notify-client` · `DELETE /{id}` · تنزيل
- مدفوعات: `GET /admin/payments` · `GET /stats` · `GET /{id}`
- عملاء: `GET /admin/clients` · `GET /stats` · `GET/PUT /{id}` · `PATCH /{id}/status` · `DELETE` · تبويبات bookings/reports/subscriptions
- مستشارون: `GET/POST /admin/consultants` · `GET/PUT /{id}` · `PATCH /status` · `POST /photo` · `DELETE` · `availability` · `time-offs` · `slots` · `stats` · `clients` · `bookings` · `pending-reports` · `reports`
- نفسي: `/admin/my/availability|time-offs|slots`
- باقات: `GET/POST /admin/packages` · `PUT /{id}` · `PATCH /status` · `DELETE`
- مستخدمون: `GET/POST /admin/users` · `PUT /{id}` · `PUT /{id}/roles` · `PATCH /status` · `DELETE` · avatar
- أدوار: `GET/POST /admin/roles` · `PUT/DELETE /{id}` · `GET /{id}/users` · `GET /admin/permissions`
- ملف: `/admin/profile` · avatar · password

ترقيم القوائم: `{ data, meta: { current_page, per_page, total, last_page }, links }`. بعض القوائم مصفوفة مباشرة (مواقع العميل، طرق الدفع، تقارير العميل، أيام التوافر). راجع `src/types/api.ts` قبل أي افتراض.

---

## 7. Business rules

1. المنتج يبيع باقة ثم جلسة ثم تقرير. الاشتراك قد يغطي الجلسة (`requires_payment: false`) فيُتخطى الدفع.
2. الحدود: `consultations_limit` / `documents_limit`؛ `null` أو `is_unlimited` يعني غير محدود.
3. الحجز `pending_payment | pending | completed | cancelled`. التقرير `none | pending | uploaded`. الدفع على الحجز `unpaid | paid | not_required | failed | refunded`. الاسترداد `none | requested | refunded`. الاجتماع `none | pending | created | failed`.
4. أزرار الأدمن على الحجز = `booking.can` **و** صلاحية المستخدم. `can.complete` لا يصدق قبل بداية الجلسة (`BOOKING_NOT_STARTED`).
5. إكمال الحجز يضع `report_status = pending`. حذف التقرير يعيد الحجز إلى انتظار التقرير.
6. إلغاء العميل: حالات معلقة، وضمن `client_cancel_hours` من الميتا (الخطة: 24 ساعة). بعد الدفع قد يصبح `refund_status = requested`.
7. إلغاء الأدمن يطلب سبباً. تعليم «تم الاسترداد» بعد التنفيذ في Moyasar، والخطة تحذّر أنه يلغي اشتراك الباقة الذي دفعه هذا الحجز.
8. رابط Meet يُنشأ بشكل غير متزامن أحياناً؛ الواجهة تعرض «جارٍ الإنشاء» أو تعيد المحاولة. فشل Google: `MEETING_CREATION_FAILED`.
9. المواعيد المتاحة فقط هي ما يعيدها الـ API. اليوم الفارغ يعني لا مواعيد. تغيير المستشار أو التاريخ يمسح الوقت. `slot_available: false` يمسح الوقت ويطلب إعادة الاختيار. `409 SLOT_NOT_AVAILABLE` عند الإرسال.
10. التوافر: أيام العمل فقط في الـ PUT؛ اليوم المحذوف يُمسح. التعارض مع حجوزات قائمة يرجِع تحذيراً ولا يلغيها.
11. الإجازة: يوم كامل أو مدى ساعات، من اليوم فصاعداً.
12. السعر في نموذج الباقة بالريال؛ الـ API بالهللة. تغيير السعر لا يعدّل اشتراكات قائمة.
13. لا حذف باقة لها اشتراكات (`PACKAGE_HAS_SUBSCRIPTIONS`)، ولا مستشار/عميل له حجوزات قادمة، ولا آخر أدمن، ولا النفس.
14. دور `admin` محمي بالكامل. دور `consultant` اسمه مقفول وصلاحياته قابلة للتعديل. حذف دور مرتبط بمستخدمين: `ROLE_HAS_USERS`.
15. نسيت كلمة المرور ترجع نجاحاً دائماً (لا تكشف وجود البريد).
16. بطاقة منتهية لا تُختار. التوكن المكرر يعيد البطاقة الموجودة. `gateway_response` لا يُعاد.
17. ملفات: صورة ≤ 2MB (jpg/png/webp). تقرير pdf/doc/docx ≤ 20MB، والتحقق من المحتوى الحقيقي لا الامتداد فقط. إعادة الرفع تستبدل الملف.
18. أول تنزيل لتقرير العميل يعلّمه مقروءاً ويزيل الشارة.
19. اللغة تغيّر `Accept-Language` ثم تُبطَل الاستعلامات.

رموز أخطاء تستحق لقطة: `VALIDATION_ERROR`, `INVALID_CREDENTIALS`, `ACCOUNT_DISABLED`, `UNAUTHENTICATED`, `FORBIDDEN`, `SLOT_NOT_AVAILABLE`, `PAYMENT_FAILED` (402), `PAYMENT_METHOD_REQUIRED`, `SUBSCRIPTION_EXHAUSTED`, `PAYMENT_PENDING_CONFIRMATION` (503), `BOOKING_NOT_STARTED`, `BOOKING_CANCEL_WINDOW_PASSED`, `REPORT_NOT_ALLOWED`, `AVAILABILITY_OVERLAP`.

---

## 8. End-to-end workflows

### أ. من الباقة إلى جلسة مؤكدة

1. الزائر يفتح `/packages` (أو شبكة الباقات في الرئيسية).
2. «اختر الباقة» → `/book/{slug}`.
3. تحميل الباقة `GET /public/packages/{slug}`.
4. إن لم يكن هناك توكن: تسجيل أو دخول (`device_name: web`). بعدها تُتخطى خطوة الحساب.
5. اختيار مستشار من `/public/consultants`.
6. شهر → `available-dates`، يوم → `slots`، اختيار `HH:MM`.
7. موقع محفوظ أو إنشاء موقع (`client_location_id`).
8. بعد وجود توكن وباقة، quote كل ما تغيّر مستشار/تاريخ/وقت (تأخير 400ms).
9. إن `requires_payment !== false`: بطاقة محفوظة أو token (`tok_fake_success` في البيئة المحلية).
10. تأكيد → `POST /client/bookings`.
11. نتيجة: مدفوع، أو مغطى بالاشتراك (`payment = null`)، أو `initiated` + `transaction_url` (3DS ثم `/bookings/payment-callback` و`verify`)، أو فشل دفع/موعد.

### ب. بعد الجلسة

1. المستشار أو الأدمن يفتح الحجز بعد `starts_at`.
2. إكمال → التقرير يصبح مطلوباً.
3. رفع ملف من صفحة الحجز أو التقارير المعلقة أو قائمة التقارير. `notify_client` يرسل بريداً فيه رابط `/reports/{id}`.
4. العميل يرى شارة غير مقروء، يفتح التقرير، التنزيل عبر blob ويعلّم `first_downloaded_at`.

### ج. تشغيل التوافر

الأدمن من تبويب المستشار، أو المستشار من «توافري»: حفظ أسبوع العمل، إضافة إجازة، معاينة المواعيد التي سيراها العميل.

### د. الوصول

أدمن ينشئ دوراً بصلاحيات مجمّعة، ينشئ مستخدماً (كلمة مرور اختيارية ترسل رابط تعيين)، يسنِد الأدوار في نموذج مستقل عن التعديل.

---

## 9. Important edge cases

- خطوة الدفع تختفي عندما `quote.requires_payment === false`. استنفاد الحصة أثناء الإرسال (`SUBSCRIPTION_EXHAUSTED`) يعيد التسعير وقد يُظهر الدفع.
- `slot_available: false` قبل الإرسال، و`SLOT_NOT_AVAILABLE` أثناء الإرسال: لا إعادة لنفس الموعد.
- 3DS: لا تُصدَّق query params الخاصة بـ Moyasar؛ التحقق دائماً `POST .../verify`. إن ضاع `pending_payment` من localStorage تظهر رسالة عامة مع رابط الحجوزات.
- `503 PAYMENT_PENDING_CONFIRMATION`: الشاشة تقول إن الدفع قيد التأكيد؛ الشحن idempotent.
- مستشار على `/admin`: لا بطاقات مستشارين/إيرادات إن غاب المفتاح. `/admin/my-availability` للأدمن العادي 403؛ العنصر مخفي.
- `can.complete = false` قبل بداية الموعد حتى مع صلاحية `complete-bookings`.
- إلغاء خارج النافذة: `BOOKING_CANCEL_WINDOW_PASSED`.
- حفظ التوافر مع حجوزات خارج الدوام: تنبيه عدّاد، الحجوزات تبقى.
- تداخل مدى ساعات: `AVAILABILITY_OVERLAP` ومفاتيح مثل `days.0.ranges.1`.
- تعطيل مستخدم أو عميل يسحب الجلسات. لا تعطيل النفس كآخر أدمن.
- رفع تقرير على حجز غير مكتمل: `REPORT_NOT_ALLOWED`. ملف نصي بامتداد pdf يُرفض.
- بطاقة `is_expired` معطّلة. `tok_fake_declined` يبقى على خطوة الدفع مع رسالة 402.
- نموذج التواصل وصفحة الانضمام وصفحة الفريق لا تمثّل عمليات backend.
- واجهتان للدخول. توكن العميل لا يفتح `/admin` والعكس.

---

## 10. Recommended video chapters

المدة المستهدفة: **حوالي 52 دقيقة** كلام وشاشة، ضمن 30–60.

| # | الفصل | المدة | الجمهور الذي يخدمه |
|---|---|---|---|
| 1 | المنتج من صفحة الهبوط | 4 د | ما الذي يُباع |
| 2 | الباقات والمستشارون الحقيقيون | 5 د | الكتالوج العام والـ API |
| 3 | حساب العميل | 4 د | authentication العميل |
| 4 | معالج الحجز حتى التأكيد | 9 د | الـ workflow الأساسي |
| 5 | بوابة العميل بعد الحجز | 7 د | متابعة، إلغاء، تقرير، ملف |
| 6 | دخول الأدمن واللوحة | 4 د | authorization وملخص التشغيل |
| 7 | دورة الحجز عند التشغيل | 7 د | إكمال، اجتماع، تقرير |
| 8 | الناس والتوافر | 6 د | عميل، مستشار، جدول أسبوعي |
| 9 | الكتالوج والصلاحيات | 4 د | باقات، مستخدمون، أدوار |
| 10 | يوم المستشار وحالات الحافة | 2 د | فرق القائمة + أخطاء مقصودة |

المجموع ≈ 52 دقيقة. الفصول 1 و2 يفرّقان المحتوى الثابت عن البيانات الحية حتى لا يُفهم الفريق أو نموذج التواصل كميزات backend.

التسجيل الفعلي مؤجّل حتى اعتماد هذه الخريطة. التفاصيل، التعليق، وخطوات المتصفح في الأقسام التالية.
