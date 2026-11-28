
package com.nyctransithub.backend.user;

import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.QueryDocumentSnapshot;

import org.springframework.stereotype.Service;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;

import java.util.ArrayList;
import java.util.List;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ExecutionException;

@Service
@ConditionalOnProperty(
    name = "firebase.enabled",
    havingValue = "true"
)
public class UserService {

    private final Firestore firestore;

    public UserService(Firestore firestore) {
        this.firestore = firestore;
    }

    private DocumentReference userDocument(String uid) {
        return firestore.collection("users").document(uid);
    }

    // User profile storage

    public UserProfile getUserProfile(String uid)
            throws ExecutionException, InterruptedException {

        DocumentSnapshot snapshot = userDocument(uid).get().get();

        if (!snapshot.exists()) {
            return null;
        }

        return snapshot.toObject(UserProfile.class);
    }

    public UserProfile createUserIfAbsent(
            String uid,
            String email,
            String displayName
    ) throws ExecutionException, InterruptedException {

        DocumentReference reference = userDocument(uid);

        return firestore.runTransaction(transaction -> {

            DocumentSnapshot snapshot =
                    transaction.get(reference).get();

            if (snapshot.exists()) {
                return snapshot.toObject(UserProfile.class);
            }

            UserProfile profile =
                    new UserProfile(uid, email, displayName);

            transaction.set(reference, profile);

            return profile;

        }).get();
    }

    // User preference storage

    public void updatePreferences(
            String uid,
            String language,
            Boolean notificationsEnabled
    ) throws ExecutionException, InterruptedException {

        Map<String, Object> updates = new HashMap<>();

        if (language != null) {
            if (!language.equals("en") && !language.equals("zh")) {
                throw new IllegalArgumentException(
                        "Language must be en or zh"
                );
            }

            updates.put("preferences.language", language);
        }

        if (notificationsEnabled != null) {
            updates.put(
                    "preferences.notificationsEnabled",
                    notificationsEnabled
            );
        }

        if (!updates.isEmpty()) {
            userDocument(uid).update(updates).get();
        }
    }

    // Favorites storage

    public List<Favorite> getFavorites(String uid)
            throws ExecutionException, InterruptedException {

        List<Favorite> favorites = new ArrayList<>();

        for (QueryDocumentSnapshot document :
                userDocument(uid)
                        .collection("favorites")
                        .get()
                        .get()
                        .getDocuments()) {

            favorites.add(document.toObject(Favorite.class));
        }

        return favorites;
    }

    public Favorite addFavorite(
            String uid,
            String type,
            String targetId
    ) throws ExecutionException, InterruptedException {

        if (!"station".equals(type) && !"route".equals(type)) {
            throw new IllegalArgumentException(
                    "Favorite type must be station or route"
            );
        }

        if (targetId == null || targetId.isBlank()
                || targetId.contains("/")
                || targetId.length() > 256) {
            throw new IllegalArgumentException(
                    "Invalid target ID"
            );
        }

        String favoriteId = type + "_" + targetId;

        Favorite favorite =
                new Favorite(favoriteId, type, targetId);

        userDocument(uid)
                .collection("favorites")
                .document(favoriteId)
                .set(favorite)
                .get();

        return favorite;
    }

    public void removeFavorite(
            String uid,
            String favoriteId
    ) throws ExecutionException, InterruptedException {

        if (favoriteId == null || favoriteId.isBlank()
                || favoriteId.contains("/")
                || favoriteId.length() > 264
                || !(favoriteId.startsWith("station_")
                     || favoriteId.startsWith("route_"))) {
            throw new IllegalArgumentException(
                    "Invalid favorite ID"
            );
        }

        userDocument(uid)
                .collection("favorites")
                .document(favoriteId)
                .delete()
                .get();
    }

    // Notification read status storage

    public List<NotificationStatus> getNotificationStatuses(
            String uid
    ) throws ExecutionException, InterruptedException {

        List<NotificationStatus> statuses = new ArrayList<>();

        for (QueryDocumentSnapshot document :
                userDocument(uid)
                        .collection("notificationStatus")
                        .get()
                        .get()
                        .getDocuments()) {

            statuses.add(
                    document.toObject(NotificationStatus.class)
            );
        }

        return statuses;
    }

    public NotificationStatus updateNotificationStatus(
            String uid,
            String notificationId,
            boolean read
    ) throws ExecutionException, InterruptedException {

        if (notificationId == null
                || notificationId.isBlank()
                || notificationId.contains("/")
                || notificationId.equals(".")
                || notificationId.equals("..")
                || notificationId.length() > 256) {

            throw new IllegalArgumentException(
                    "Invalid notification ID"
            );
        }

        NotificationStatus status =
                new NotificationStatus(notificationId, read);

        userDocument(uid)
                .collection("notificationStatus")
                .document(notificationId)
                .set(status)
                .get();

        return status;
    }
}
