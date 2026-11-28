
package com.nyctransithub.backend.user;

import com.google.firebase.auth.FirebaseToken;
import com.nyctransithub.backend.auth.FirebaseAuthService;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class UserControllerTest {

    private UserService userService;
    private FirebaseAuthService authService;
    private UserController controller;

    @BeforeEach
    void setUp() {
        userService = mock(UserService.class);
        authService = mock(FirebaseAuthService.class);

        controller = new UserController(
                userService, authService
        );
    }

    @Test
    void rejectsMissingToken() {

        when(authService.verifyToken(null))
                .thenThrow(new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED
                ));

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> controller.getProfile(null)
        );

        assertEquals(
                HttpStatus.UNAUTHORIZED,
                exception.getStatusCode()
        );

        verifyNoInteractions(userService);
    }

    @Test
    void rejectsInvalidToken() {

        when(authService.verifyToken("Bearer invalid"))
                .thenThrow(new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED
                ));

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> controller.getFavorites("Bearer invalid")
        );

        assertEquals(
                HttpStatus.UNAUTHORIZED,
                exception.getStatusCode()
        );

        verifyNoInteractions(userService);
    }

    @Test
    void retrievesAuthenticatedUserFavorites()
            throws Exception {

        FirebaseToken token = mock(FirebaseToken.class);

        when(token.getUid()).thenReturn("userA");

        when(authService.verifyToken("Bearer validToken"))
                .thenReturn(token);

        Favorite favorite = new Favorite(
                "route_R", "route", "R"
        );

        when(userService.getFavorites("userA"))
                .thenReturn(List.of(favorite));

        List<Favorite> result =
                controller.getFavorites("Bearer validToken");

        assertEquals(1, result.size());
        assertEquals("route_R", result.get(0).getFavoriteId());

        verify(userService).getFavorites("userA");
        verify(userService, never()).getFavorites("userB");
    }

    @Test
    void differentUsersRetrieveSeparateFavorites()
            throws Exception {

        FirebaseToken tokenA = mock(FirebaseToken.class);
        FirebaseToken tokenB = mock(FirebaseToken.class);

        when(tokenA.getUid()).thenReturn("userA");
        when(tokenB.getUid()).thenReturn("userB");

        when(authService.verifyToken("Bearer tokenA"))
                .thenReturn(tokenA);

        when(authService.verifyToken("Bearer tokenB"))
                .thenReturn(tokenB);

        when(userService.getFavorites("userA"))
                .thenReturn(List.of(
                        new Favorite("route_R", "route", "R")
                ));

        when(userService.getFavorites("userB"))
                .thenReturn(List.of(
                        new Favorite("route_A", "route", "A")
                ));

        List<Favorite> favoritesA =
                controller.getFavorites("Bearer tokenA");

        List<Favorite> favoritesB =
                controller.getFavorites("Bearer tokenB");

        assertEquals("R", favoritesA.get(0).getTargetId());
        assertEquals("A", favoritesB.get(0).getTargetId());

        verify(userService).getFavorites("userA");
        verify(userService).getFavorites("userB");
    }
}
