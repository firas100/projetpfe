package com.example.projetpfe.Services;

import jakarta.ws.rs.core.Response;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.resource.*;
import org.keycloak.representations.idm.RoleRepresentation;
import org.keycloak.representations.idm.UserRepresentation;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;

import java.net.URI;
import java.util.Collections;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class KeycloakUserServiceTest {

    @InjectMocks
    private KeycloakUserService service;

    @Mock
    private Keycloak keycloakAdmin;

    @Mock
    private RealmResource realmResource;

    @Mock
    private UsersResource usersResource;

    @Mock
    private UserResource userResource;

    @Mock
    private RolesResource rolesResource;

    @Mock
    private RoleResource roleResource;

    @Mock
    private Response response;

    @BeforeEach
    void setup() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    @DisplayName("createUser should return success message when user is created")
    void testCreateUserSuccess() {
        // Préparer les mocks
        when(keycloakAdmin.realm("pfe-realm")).thenReturn(realmResource);
        when(realmResource.users()).thenReturn(usersResource);
        when(usersResource.create(any(UserRepresentation.class))).thenReturn(response);
        when(response.getStatus()).thenReturn(Response.Status.CREATED.getStatusCode());
        when(response.getLocation()).thenReturn(URI.create("http://localhost/users/12345"));

        RoleRepresentation role = new RoleRepresentation();
        role.setName("CANDIDAT");

        RolesResource rolesResourceMock = mock(RolesResource.class);
        when(realmResource.roles()).thenReturn(rolesResourceMock);
        when(rolesResourceMock.get("CANDIDAT")).thenReturn(roleResource);
        when(roleResource.toRepresentation()).thenReturn(role);

        UserResource userResourceMock = mock(UserResource.class);
        when(usersResource.get("12345")).thenReturn(userResourceMock);
        when(userResourceMock.roles()).thenReturn((RoleMappingResource) mock(RoleScopeResource.class));

        // Appel de la méthode
        String result = service.createUser("testuser", "test@example.com", "firas", "kdidi", "password123");

        assertTrue(result.contains("User created successfully"));
        assertTrue(result.contains("12345"));
    }

    @Test
    @DisplayName("createUser should return error message on failure")
    void testCreateUserFailure() {
        when(keycloakAdmin.realm("pfe-realm")).thenReturn(realmResource);
        when(realmResource.users()).thenReturn(usersResource);
        when(usersResource.create(any(UserRepresentation.class))).thenReturn(response);
        when(response.getStatus()).thenReturn(Response.Status.BAD_REQUEST.getStatusCode());
        when(response.readEntity(String.class)).thenReturn("User already exists");

        String result = service.createUser("testuser", "test@example.com", "firas", "kdidi", "password123");

        assertTrue(result.contains("Error creating user"));
        assertTrue(result.contains("User already exists"));
    }
}
