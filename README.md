# בשבילנו — אתר העמותה · *זכרון בונה חיים*

אתר מרובה-עמודים (סטטי, ללא שלב build בזמן הרצה) עבור מיזם **בשבילנו**, המחבר את
הנצחת נופלי מלחמת חרבות ברזל עם קהילות יהודיות ברחבי העולם — שידוך, ליווי וצמיחה משותפת.
עברית RTL, פלטת קרם/ירוק-צמיחה/זהב-זריחה, ומוטיב "שמש עולה מעל נבט".

> אתר סטטי (HTML/CSS/JS) — נפתח ומתארח בכל מקום (Vercel/Netlify/GitHub Pages/כל שרת סטטי).

## מבנה

```
index.html      בית — דף נחיתה (Hero, מניפסט, נתונים, השפעה, בורר מסלולים)
about.html      אודות — רקע, משמעות כפולה, תכלית, שלושה צדדים, צוות, חזון
how.html        איך זה עובד — שירותים (Bento), שלבים, תוצרים, סיפור→מעשה, דרגות
join.html       הצטרפות — 3 מסלולי קהל, דרגות, שאלות נפוצות
contact.html    צור קשר — צ׳יפים, טופס (mailto/WhatsApp), פרטי קשר
donate.html     תרומה — בחירת סכום לפי השפעה, שקיפות (ניתוב למייל/וואטסאפ)
stories.html    סיפורים — קיר הזיכרון החי (טיזר; מאגר מלא בקרוב)

partials/        מקור-אמת משותף ל-nav ו-footer
build.py         מזריק את ה-partials לעמודים (ראו "בנייה")
assets/
  styles.css     כל ה-design tokens והרכיבים
  main.js         ניווט, מגירה, reveal, מונים, kinetic, tilt, FAQ, טופס,
                  בחירת תרומה, Lenis smooth-scroll, back-to-top
  images/         צילומים (+ team/ לתמונות הצוות) — JPG/PNG עם וריאנטי .webp
  icon-*.png · apple-touch-icon.png · favicon.svg · logo.svg
manifest.json · robots.txt · sitemap.xml
```

## בנייה (nav/footer משותפים)

ה-nav וה-footer מוגדרים פעם אחת ב-`partials/` ומוזרקים לעמודים בין סימוני
`<!-- @nav -->` / `<!-- @footer -->`. לאחר עריכת partial — הריצו:

```bash
python3 build.py
```

מצב העמוד הפעיל (active) בתפריט נקבע אוטומטית ב-`main.js` לפי כתובת העמוד.
הוספת/עדכון תמונות WebP: `Pillow` (ראו ההיסטוריה של הריפו לסקריפט הייצור).

## יכולות עיצוב (2026)

View Transitions למעברי עמוד · אנימציות מונעות-גלילה (`animation-timeline`) ·
Lenis smooth-scroll · טקסט קינטי מילה-אחר-מילה · מוני-ספירה · הטיית כרטיסים 3D ·
פריסות Bento · טקסט גרדיאנט · תפריט נייד · FAQ נגיש (`aria-expanded`) ·
תמיכה מלאה ב-`prefers-reduced-motion` · `<picture>` + WebP responsive.

## SEO ונגישות

מטא + Open Graph + Twitter Card + `canonical` בכל עמוד · JSON-LD (NGO + FAQPage) ·
`sitemap.xml` · `robots.txt` · `manifest.json` + theme-color + apple-touch-icon ·
HTML סמנטי · skip-link · `:focus-visible` · ניגודיות תואמת WCAG · יעדי מגע.

## עיצוב (tokens)

ב-`:root` שבראש `assets/styles.css`. צבעי ליבה: ירוק-צמיחה `#1F8A4D`,
זהב-זריחה `#C7912F`, כחול-כהה `#16324B`, קרם `#F6F2E9`.
גופנים: Rubik (כותרות), Heebo (גוף), Frank Ruhl Libre (סריף).

## הרצה מקומית

```bash
python3 -m http.server 8000
# פתחו: http://localhost:8000
```

## מה עוד צריך להשלים

- **דומיין** — להחליף את ה-placeholder `bishvileinu.org.il` (canonical/og/sitemap/JSON-LD) בדומיין האמיתי.
- **מספר ע"ר** — להוסיף בשורת ה-footer (`עמותה רשומה (ע״ר —)`).
- **תוכן "סיפורים"** — סיפורי הנופלים ומיזמי ההנצחה (מחכה למידע).
- **צילומים אמיתיים** — להחליף את תמונות ה-placeholder.
- **סליקת תרומות** — כיום ניתוב למייל/וואטסאפ; לחבר Jgive/IsraelGives לתרומה אונליין.
- **טופס** — כיום `mailto`; אפשר לחבר backend (Supabase/Formspree).
- **אנליטיקה** — להפעיל את קטע ה-Plausible ב-`<head>` (פתיחת חשבון + דומיין).
- **שפות** — גרסת אנגלית/צרפתית (מתוכנן; ראו `docs/redesign-plan-2026.md`).
