
package com.nyctransithub.backend.user;

import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.CollectionReference;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.WriteResult;
import com.google.api.core.ApiFuture;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class UserServiceTest {

    private Firestore firestore;
    private UserService userService;

    @BeforeEach
    void setUp() {
        firestore = mock(Firestore.class);
        userService = new UserService(firestore);
    }

    @Test
    void rejectsInvalidLanguage() {
        assertThrows(
                IllegalArgumentException.class,
                () -> userService.updatePreferences(
                        "user123", "fr", true
                )
        );

        verifyNoInteractions(firestore);
    }

    @Test
    void rejectsInvalidFavoriteType() {
        assertThrows(
                IllegalArgumentException.class,
                () -> userService.addFavorite(
                        "user123", "bus", "123"
                )
        );

        verifyNoInteractions(firestore);
    }

    @Test
    void rejectsEmptyTargetId() {
        assertThrows(
                IllegalArgumentException.class,
                () -> userService.addFavorite(
                        "user123", "station", ""
                )
        );

        verifyNoInteractions(firestore);
    }

    @Test
    void rejectsInvalidTargetId() {
        assertThrows(
                IllegalArgumentException.class,
                () -> userService.addFavorite(
                        "user123", "station", "invalid/id"
                )
        );

        verifyNoInteractions(firestore);
    }

    @Test
    void rejectsInvalidFavoriteId() {
        assertThrows(
                IllegalArgumentException.class,
                () -> userService.removeFavorite(
                        "user123", "invalidFavorite"
                )
        );

        verifyNoInteractions(firestore);
    }

    @Test
    void rejectsInvalidNotificationId() {
        assertThrows(
                IllegalArgumentException.class,
                () -> userService.updateNotificationStatus(
                        "user123", "invalid/id", true
                )
        );

        verifyNoInteractions(firestore);
    }

    @Test
    void defaultPreferencesAreCorrect() {
        UserPreferences preferences = new UserPreferences();

        assertEquals("en", preferences.getLanguage());
        assertTrue(preferences.isNotificationsEnabled());
    }

    @Test
    void newProfileHasDefaultPreferences() {
        UserProfile profile = new UserProfile(
                "user123",
                "example@example.com",
                "Test User"
        );

        assertEquals("user123", profile.getUid());
        assertNotNull(profile.getPreferences());
        assertEquals("en", profile.getPreferences().getLanguage());
    }

    @Test
    void defaultNotificationStatusIsUnread() {
        NotificationStatus status = new NotificationStatus();

        assertFalse(status.isRead());
    }

    @Test
    void duplicateFavoritesUseSameDocumentId()
            throws Exception {

        CollectionReference users =
                mock(CollectionReference.class);

        DocumentReference user =
                mock(DocumentReference.class);

        CollectionReference favorites =
                mock(CollectionReference.class);

        DocumentReference favoriteDocument =
                mock(DocumentReference.class);

        ApiFuture<WriteResult> writeResult =
                mock(ApiFuture.class);

        when(firestore.collection("users"))
                .thenReturn(users);

        when(users.document("user123"))
                .thenReturn(user);

        when(user.collection("favorites"))
                .thenReturn(favorites);

        when(favorites.document("route_R"))
                .thenReturn(favoriteDocument);

        when(favoriteDocument.set(any(Favorite.class)))
                .thenReturn(writeResult);

        Favorite first = userService.addFavorite(
                "user123", "route", "R"
        );

        Favorite second = userService.addFavorite(
                "user123", "route", "R"
        );

        assertEquals(
                first.getFavoriteId(),
                second.getFavoriteId()
        );

        assertEquals("route_R", first.getFavoriteId());

        verify(favorites, times(2)).document("route_R");

        verify(favoriteDocument, times(2))
                .set(any(Favorite.class));
    }

    @Test
    void rejectsUnsupportedLanguageBeforeDatabaseAccess() {

        assertThrows(
                IllegalArgumentException.class,
                () -> userService.updatePreferences(
                        "user123", "es", null
                )
        );

        verifyNoInteractions(firestore);
    }
}
