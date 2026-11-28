
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

### 2.1 Preliminary Authentication

Implemented:
- Preliminary email and password sign-in.
- Backend password verification.
- HTTP session-based authentication.
- Session status checking.
- Logout functionality.
- Preliminary authentication merged into the main branch.

The preliminary authentication system is retained for local development.
Firebase authentication will be integrated separately.

### 2.2 Multilingual Support

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

### 2.3 Firestore User Data Storage

Implemented:
- Added the Firebase Admin SDK dependency.
- Created optional Firebase and Firestore configuration.
- Created Java models for user profiles, preferences, favorites,
  and notification read statuses.
- Implemented user profile creation and retrieval.
- Implemented language and notification preference updates.
- Implemented favorite station and route storage.
- Implemented favorite retrieval and deletion.
- Implemented notification read status storage.
- Implemented Firebase ID token verification.
- Implemented protected user REST API endpoints.
- Successfully compiled the backend after implementation.

Firebase connectivity and runtime data persistence testing are pending.

## 3. File Structure

### Frontend

- frontend/src/locales/en.json
- frontend/src/locales/zh.json
- frontend/src/i18n.ts
- frontend/src/components/LanguageSwitcher.tsx
- frontend/src/main.tsx
- frontend/src/App.tsx

### Backend

Base Java package: com.nyctransithub.backend

- auth/AuthController.java
- auth/FirebaseAuthService.java
- config/FirebaseConfig.java
- user/UserProfile.java
- user/UserPreferences.java
- user/Favorite.java
- user/NotificationStatus.java
- user/UserService.java
- user/UserController.java

The Firebase Admin SDK dependency is declared in backend/pom.xml.

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

The current frontend implementation saves the selected language
in the browser using localStorage.

English is the default and fallback language.

The backend now supports account-level language preference
storage using Firestore.

Frontend synchronization with Firestore is pending Firebase
authentication integration.

Supported languages:
- en: English
- zh: Simplified Chinese

## 6. Firestore Database Design

### 6.1 User Documents

Collection: users

Document path:

users/{uid}

Fields:

| Field | Type | Description |
| --- | --- | --- |
| uid | String | Firebase user identifier |
| email | String | User email address |
| displayName | String | User display name |
| preferences | Map | User preferences |

Each user document is identified by the UID obtained from
a verified Firebase ID token.

Existing user preferences are preserved when returning users
access their account.

### 6.2 User Preferences

Preferences are stored as a nested map in the user document.

| Field | Type | Default |
| --- | --- | --- |
| language | String | en |
| notificationsEnabled | Boolean | true |

Only en and zh are currently accepted as language values.

### 6.3 Favorites

Subcollection path:

users/{uid}/favorites/{favoriteId}

| Field | Type | Description |
| --- | --- | --- |
| favoriteId | String | Unique favorite document identifier |
| type | String | station or route |
| targetId | String | Station or route identifier |

Favorite document identifiers follow this format:

- station_{stationId}
- route_{routeId}

Using deterministic document identifiers prevents duplicate
favorites for the same station or route.

Station and route identifiers must follow the identifiers
provided by Module A.

Validation against Module A's actual transit data is pending.

### 6.4 Notification Read Status

Subcollection path:

users/{uid}/notificationStatus/{notificationId}

| Field | Type | Description |
| --- | --- | --- |
| notificationId | String | Notification identifier |
| read | Boolean | Whether the notification has been read |

Notification read statuses are stored separately for each user.

The actual transportation announcements are not duplicated
inside individual user documents.

Missing read-status records should be treated as unread
when the frontend integrates transportation announcements.

Read timestamps and announcement integration are pending.

### 6.5 Database Structure

```text
users/
  {uid}/
    uid
    email
    displayName
    preferences:
      language
      notificationsEnabled

    favorites/
      {favoriteId}/
        favoriteId
        type
        targetId

    notificationStatus/
      {notificationId}/
        notificationId
        read
```

## 7. User REST API

Base path: /api/me

All endpoints require a valid Firebase ID token.

Authorization header:

Authorization: Bearer <Firebase ID token>

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | /api/me | Retrieve user profile |
| PATCH | /api/me/preferences | Update user preferences |
| GET | /api/me/favorites | Retrieve favorites |
| POST | /api/me/favorites | Add a favorite |
| DELETE | /api/me/favorites/{favoriteId} | Remove a favorite |
| GET | /api/me/notifications | Retrieve notification read statuses |
| PATCH | /api/me/notifications/{notificationId} | Update read status |

### 7.1 Update Preferences Example

PATCH /api/me/preferences

```json
{
  "language": "zh",
  "notificationsEnabled": true
}
```

### 7.2 Add Favorite Example

POST /api/me/favorites

```json
{
  "type": "route",
  "targetId": "R"
}
```

The route ID above is illustrative and must match Module A's
actual route identifiers.

### 7.3 Update Notification Status Example

PATCH /api/me/notifications/{notificationId}

```json
{
  "read": true
}
```

### 7.4 Security Design

- The frontend communicates with the Spring Boot backend.
- The backend verifies Firebase ID tokens.
- The UID is obtained from the verified token.
- The frontend cannot select another user's UID.
- User data is stored under the authenticated user's UID.
- Invalid or missing tokens are rejected when Firebase is enabled.
- Invalid request values are rejected.
- Firebase credentials must not be committed to GitHub.

Runtime authorization and account isolation testing are pending.

## 8. Firebase Configuration

Firebase integration is disabled by default.

The backend uses the following configuration properties:

- firebase.enabled
- firebase.project-id

Spring Boot environment variable equivalents:

- FIREBASE_ENABLED
- FIREBASE_PROJECT_ID

The Firebase Admin SDK uses Google Application Default Credentials.

For local development, credentials may be supplied through:

GOOGLE_APPLICATION_CREDENTIALS

This must reference a securely stored credentials file outside
the repository.

The preliminary local sign-in implementation remains available
when Firebase integration is disabled.

The protected /api/me endpoints are registered only when
Firebase integration is enabled.

The preliminary session-based login does not provide Firebase
ID tokens and cannot authorize Firestore user API requests.


## 9. Testing Results

### Completed

- [x] Frontend production build before Firestore implementation
- [x] Java data models compilation
- [x] Firebase Admin SDK dependency resolution
- [x] Firebase configuration compilation
- [x] User storage service compilation
- [x] Firebase token verification service compilation
- [x] User REST API controller compilation
- [x] Existing automated backend test suite
- [x] Backend startup without Firebase configuration
- [x] Frontend startup
- [x] Post-merge preliminary sign-in
- [x] Login session persistence after refresh
- [x] Logout functionality
- [x] Signing in again after logout
- [x] English to Chinese switching
- [x] Chinese to English switching
- [x] Language preference persistence after refresh
- [x] Dedicated UserService unit test command
- [x] Dedicated UserController unit test command
- [x] Full backend test command after adding Module D tests

### Dedicated Module D Unit Tests

15 unit tests were written across two test classes:

- UserServiceTest.java: 11 tests
- UserControllerTest.java: 4 tests

Test coverage includes:
- Input validation
- Default user preferences
- Default notification read status
- Missing and invalid token handling using mocks
- Authenticated UID usage
- Separate user data requests
- Deterministic favorite document identifiers

The tests use mocked Firebase and Firestore dependencies.
The Maven test command completed successfully.

### Pending

- [ ] Firebase connection testing
- [ ] Real Firebase ID token verification
- [ ] Real database persistence testing
- [ ] Favorites persistence after login and logout
- [ ] Database-level duplicate favorites testing
- [ ] Notification read status persistence
- [ ] Real account isolation testing
- [ ] Account-level language preference synchronization
- [ ] Full multilingual coverage across all modules


## 10. Pending Development

- Firebase email registration and authentication
- Google sign-in
- Firebase runtime configuration
- Frontend authentication integration
- Favorites frontend functionality
- Personal dashboard
- In-app notification frontend functionality
- Account-level language preference synchronization
- Station and route identifier validation
- Notification identifier validation
- Database timestamps
- Integration of translations from Modules A, B and C
- Firestore security configuration and verification

## 11. Known Issues and Limitations

During previous local testing on port 5174, station data and
line filters failed to load. The cause was not verified.

This did not prevent language-switching tests from passing.

The Firestore backend has successfully compiled but has not
yet been tested against an actual Firebase project.

The current notification API returns read statuses rather
than actual transportation announcements.

Firebase authentication and preliminary session-based
authentication are currently separate.

Post-merge Module D regression testing passed.
Map station loading and line filter issues remain unresolved
and are deferred to the responsible module.

Actual Firebase connectivity, persistence, and account
isolation testing remain pending.
