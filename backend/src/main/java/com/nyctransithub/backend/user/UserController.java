
package com.nyctransithub.backend.user;

import com.google.firebase.auth.FirebaseToken;
import com.nyctransithub.backend.auth.FirebaseAuthService;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.concurrent.ExecutionException;

@RestController
@RequestMapping("/api/me")
@ConditionalOnProperty(
    name = "firebase.enabled",
    havingValue = "true"
)
public class UserController {

    private final UserService userService;
    private final FirebaseAuthService authService;

    public UserController(
            UserService userService,
            FirebaseAuthService authService
    ) {
        this.userService = userService;
        this.authService = authService;
    }

    public record PreferencesRequest(
            String language,
            Boolean notificationsEnabled
    ) {}

    public record FavoriteRequest(
            String type,
            String targetId
    ) {}

    public record NotificationRequest(
            Boolean read
    ) {}

    // Verify identity and initialize user profile

    private String getCurrentUid(String authorization)
            throws ExecutionException, InterruptedException {

        FirebaseToken token =
                authService.verifyToken(authorization);

        userService.createUserIfAbsent(
                token.getUid(),
                token.getEmail(),
                token.getName()
        );

        return token.getUid();
    }

    // User profile

    @GetMapping
    public UserProfile getProfile(
            @RequestHeader(value = "Authorization", required = false)
            String authorization
    ) throws ExecutionException, InterruptedException {

        String uid = getCurrentUid(authorization);

        return userService.getUserProfile(uid);
    }

    // User preferences

    @PatchMapping("/preferences")
    public UserProfile updatePreferences(
            @RequestHeader(value = "Authorization", required = false)
            String authorization,
            @RequestBody PreferencesRequest request
    ) throws ExecutionException, InterruptedException {

        String uid = getCurrentUid(authorization);

        userService.updatePreferences(
                uid,
                request.language(),
                request.notificationsEnabled()
        );

        return userService.getUserProfile(uid);
    }

    // Favorites

    @GetMapping("/favorites")
    public List<Favorite> getFavorites(
            @RequestHeader(value = "Authorization", required = false)
            String authorization
    ) throws ExecutionException, InterruptedException {

        String uid = getCurrentUid(authorization);

        return userService.getFavorites(uid);
    }

    @PostMapping("/favorites")
    @ResponseStatus(HttpStatus.CREATED)
    public Favorite addFavorite(
            @RequestHeader(value = "Authorization", required = false)
            String authorization,
            @RequestBody FavoriteRequest request
    ) throws ExecutionException, InterruptedException {

        String uid = getCurrentUid(authorization);

        return userService.addFavorite(
                uid,
                request.type(),
                request.targetId()
        );
    }

    @DeleteMapping("/favorites/{favoriteId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeFavorite(
            @RequestHeader(value = "Authorization", required = false)
            String authorization,
            @PathVariable String favoriteId
    ) throws ExecutionException, InterruptedException {

        String uid = getCurrentUid(authorization);

        userService.removeFavorite(uid, favoriteId);
    }

    // Notification read statuses

    @GetMapping("/notifications")
    public List<NotificationStatus> getNotifications(
            @RequestHeader(value = "Authorization", required = false)
            String authorization
    ) throws ExecutionException, InterruptedException {

        String uid = getCurrentUid(authorization);

        return userService.getNotificationStatuses(uid);
    }

    @PatchMapping("/notifications/{notificationId}")
    public NotificationStatus updateNotification(
            @RequestHeader(value = "Authorization", required = false)
            String authorization,
            @PathVariable String notificationId,
            @RequestBody NotificationRequest request
    ) throws ExecutionException, InterruptedException {

        String uid = getCurrentUid(authorization);

        if (request.read() == null) {
            throw new IllegalArgumentException(
                    "Read status is required"
            );
        }

        return userService.updateNotificationStatus(
                uid,
                notificationId,
                request.read()
        );
    }

    // Invalid request handling

    @ExceptionHandler(IllegalArgumentException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public java.util.Map<String, String> handleInvalidRequest(
            IllegalArgumentException exception
    ) {
        return java.util.Map.of(
                "error", exception.getMessage()
        );
    }
}
