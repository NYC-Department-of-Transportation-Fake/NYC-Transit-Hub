
# Module D — Authentication, Favorites, Dashboard and Multilingual Support

## 1. Module Responsibilities

- User authentication and registration
- Backend identity verification
- User data storage using Firestore
- Station and route favorites
- Personal dashboard
- In-app notifications
- English and Chinese multilingual support
- Reusable shared components

## 2. Current Development Progress

### Multilingual Support

Implemented:
- Installed i18next and react-i18next.
- Created English and Simplified Chinese translation files.
- Configured the i18next translation system.
- Created a reusable LanguageSwitcher component.
- Integrated language switching into the navigation bar.
- Saved language preferences using localStorage.
- Verified language switching in both directions.
- Verified language preference persistence after refreshing.
- Successfully passed the frontend production build.

## 3. File Structure

- frontend/src/locales/en.json
- frontend/src/locales/zh.json
- frontend/src/i18n.ts
- frontend/src/components/LanguageSwitcher.tsx
- frontend/src/main.tsx
- frontend/src/App.tsx

## 4. Translation Integration Guide

Each module should provide its own English and Chinese translations.

Add matching translation keys to en.json and zh.json.

For example:

English:
"map": "Map"

Chinese:
"map": "地图"

Import the translation hook into a React component:

```tsx
import { useTranslation } from "react-i18next";
```

Inside the component:

```tsx
const { t } = useTranslation();
```

Replace hard-coded text with the corresponding translation key:

```tsx
{t("nav.map")}
```

The displayed text will update automatically when the user switches languages.

## 5. Language Preference Storage

The current implementation saves the selected language in the browser using localStorage.

English is the default and fallback language.

Account-level language preferences will be integrated with Firestore after Firebase authentication is configured.

## 6. Testing Results

- [x] Frontend production build
- [x] English to Chinese switching
- [x] Chinese to English switching
- [x] Language preference persistence after refresh
- [ ] Full multilingual coverage across all modules
- [ ] Account-level language preference synchronization

## 7. Pending Development

- Firebase email registration and authentication
- Google sign-in
- Backend Firebase token verification
- Firestore user data structure
- Favorites functionality
- Personal dashboard
- In-app notifications
- Account-level language preference storage
- Integration of translations from Modules A, B and C

A preliminary local sign-in implementation was developed separately on the feature/sign-in branch.

## 8. Known Issues

During local testing on port 5174, station data and line filters failed to load. The cause has not yet been verified.

This did not prevent language-switching tests from passing.
