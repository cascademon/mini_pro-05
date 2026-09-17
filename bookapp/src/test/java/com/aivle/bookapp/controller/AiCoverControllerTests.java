package com.aivle.bookapp.controller;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;
import jakarta.validation.Validation;
import java.net.SocketTimeoutException;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.*;
import static org.springframework.test.web.client.response.MockRestResponseCreators.*;

class AiCoverControllerTests {
    private final RestTemplate client = new RestTemplate();
    private final MockRestServiceServer server = MockRestServiceServer.bindTo(client).build();
    private final AiCoverController controller = new AiCoverController(client);

    private AiCoverController.AiCoverRequest request() {
        var request = new AiCoverController.AiCoverRequest();
        request.setTitle("가상 도서");
        request.setApiKey("test-placeholder-not-a-key");
        request.setMoods(List.of("차분함"));
        return request;
    }

    @Test void returnsThreeImagesWithoutRealApiCalls() {
        for (int i = 0; i < 3; i++) {
            server.expect(requestTo("https://api.openai.com/v1/images/generations"))
                .andExpect(method(HttpMethod.POST))
                .andRespond(withSuccess("{\"data\":[{\"b64_json\":\"aW1hZ2U=\"}]}", MediaType.APPLICATION_JSON));
        }
        var result = controller.generateCover(request());
        assertEquals(3, ((List<?>) result.getBody().get("posters")).size());
        server.verify();
    }

    @Test void failureStopsRemainingCallsAndDoesNotExposeProviderBody() {
        server.expect(requestTo("https://api.openai.com/v1/images/generations"))
            .andRespond(withStatus(HttpStatus.UNAUTHORIZED).body("private-provider-response"));
        var error = assertThrows(ResponseStatusException.class, () -> controller.generateCover(request()));
        assertEquals(HttpStatus.BAD_GATEWAY, error.getStatusCode());
        assertFalse(error.getReason().contains("private-provider-response"));
        server.verify();
    }

    @Test void rejectsMissingImageResponse() {
        server.expect(requestTo("https://api.openai.com/v1/images/generations"))
            .andRespond(withSuccess("{\"data\":[{}]}", MediaType.APPLICATION_JSON));
        assertEquals(HttpStatus.BAD_GATEWAY,
            assertThrows(ResponseStatusException.class, () -> controller.generateCover(request())).getStatusCode());
        server.verify();
    }

    @Test void timeoutHasSafeMessage() {
        server.expect(requestTo("https://api.openai.com/v1/images/generations"))
            .andRespond(withException(new SocketTimeoutException("private connection details")));
        assertEquals(HttpStatus.GATEWAY_TIMEOUT,
            assertThrows(ResponseStatusException.class, () -> controller.generateCover(request())).getStatusCode());
        server.verify();
    }

    @Test void requiresTitleAndKey() {
        try (var factory = Validation.buildDefaultValidatorFactory()) {
            assertEquals(2, factory.getValidator().validate(new AiCoverController.AiCoverRequest()).size());
            assertTrue(factory.getValidator().validate(request()).isEmpty());
        }
    }
}
