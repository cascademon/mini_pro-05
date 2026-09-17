package com.aivle.bookapp.controller;

import lombok.Data;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.HttpStatus;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/ai")
public class AiCoverController {

    private final RestTemplate restTemplate;

    public AiCoverController() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(10_000);
        factory.setReadTimeout(120_000);
        this.restTemplate = new RestTemplate(factory);
    }

    AiCoverController(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    @PostMapping("/cover")
    public ResponseEntity<Map<String, Object>> generateCover(@Valid @RequestBody AiCoverRequest request) {

        String moodsText = request.getMoods() == null || request.getMoods().isEmpty()
                ? "없음"
                : String.join(", ", request.getMoods());

        String descriptionText = request.getDescription() == null || request.getDescription().isBlank()
                ? "도서 설명 없음"
                : request.getDescription();

        String coverPromptText = request.getCoverPrompt() == null || request.getCoverPrompt().isBlank()
                ? "없음"
                : request.getCoverPrompt();

        String commonBookInfo = """
                책 정보:
                제목: %s
                장르: %s
                분위기: %s
                설명: %s
                사용자의 추가 요청사항: %s

                해석 규칙:
                - 사용자의 추가 요청사항은 모든 표지에 똑같이 복사하지 말고, 분위기와 감정 참고용으로만 활용해줘.
                - 사용자의 요청사항에 특정 배경, 인물, 사물이 있어도 각 디자인 방식에 맞게 재해석해줘.
                - 입력된 책의 장르와 설명에 어울리는 시각 요소를 스스로 선택해줘.
                """.formatted(
                request.getTitle(),
                request.getGenre(),
                moodsText,
                descriptionText,
                coverPromptText
        );

        List<String> variationGuides = List.of(
                """
                디자인 방식: 시네마틱 장면형

                - 책의 분위기를 하나의 인상적인 장면처럼 보여주는 영화 포스터형 책 표지로 만들어줘.
                - 인물, 배경, 공간감을 사용할 수 있어.
                - 장르와 설명에 어울리는 실제 장면, 빛, 거리감, 풍경, 구도를 활용해줘.
                - 감정 몰입이 되는 서사적인 표지로 표현해줘.
                - 단, 하나의 완성된 책 앞표지만 보여줘.
                """,

                """
                디자인 방식: 미니멀 상징형

                - 실제 장면을 보여주지 말고, 책의 핵심 주제를 상징하는 하나의 오브제 또는 하나의 중심 이미지만 사용해줘.
                - 인물은 넣지 마.
                - 풍경 전체를 배경으로 깔지 마.
                - 자연 풍경, 도시 풍경, 우주 풍경처럼 넓은 배경 장면을 만들지 마.
                - 여백을 많이 사용하고, 중심 상징물 하나로 감정을 표현해줘.
                - 장르에 맞는 상징물을 스스로 선택해줘.
                - 예시는 참고하지 말고, 책 정보에 맞는 고유한 상징 이미지를 선택해줘.
                - 문학적이고 세련된 미니멀 북커버처럼 만들어줘.
                """,

                """
                디자인 방식: 추상 그래픽 타이포형

                - 실제 장면, 인물, 풍경, 사물을 그리지 마.
                - 제목 타이포그래피를 가장 큰 시각 요소로 사용해줘.
                - 장르와 분위기에 어울리는 색면, 질감, 선, 도형, 패턴, 추상적인 그래픽 요소로만 구성해줘.
                - 사진 같은 장면이 아니라 현대적인 그래픽 포스터처럼 만들어줘.
                - 배경은 추상적이어야 하고, 구체적인 장소처럼 보이면 안 돼.
                - 여백, 색감, 글자 배치로 책의 감정을 표현해줘.
                - 세련된 디자인 북커버 느낌으로 만들어줘.
                """
        );

        List<String> posters = new ArrayList<>();

        for (String variationGuide : variationGuides) {
            String prompt = """
                    하나의 완성된 책 앞표지를 생성해줘.

                    %s

                    반드시 지켜야 할 규칙:
                    - 오직 하나의 완성된 책 앞표지만 만들어줘.
                    - 이미지 안에 여러 개의 표지 시안, 여러 페이지, 여러 책, 콜라주, 패널 분할, 목업을 넣지 마.
                    - 하나의 직사각형 책 앞표지가 중앙에 크게 보이게 해줘.
                    - 표지 전체가 잘리지 않고 프레임 안에 모두 보이게 해줘.
                    - Only one single complete front book cover.
                    - No multiple covers, no collage, no split panels, no mockup, no spread pages.
                    - 책 제목 "%s"를 표지에 잘 보이게 넣어줘.
                    - 허위 출판사명, 허위 작가명, 임의의 로고, 바코드, 가격표는 넣지 마.
                    - 제목 외 텍스트는 최소화해줘.
                    - 실제 서점에 놓여도 자연스러운 책 표지처럼 만들어줘.

                    다양성 규칙:
                    - 이 표지는 다른 표지와 완전히 다른 표현 방식이어야 해.
                    - 구도, 색감, 시각 중심 요소, 표현 매체가 명확히 달라야 해.
                    - 같은 배경, 같은 인물 배치, 같은 풍경, 같은 색감이 반복되면 안 돼.
                    - 입력된 요청사항의 시각 요소를 그대로 반복하지 말고, 디자인 방식에 맞게 재해석해줘.

                    %s
                    """.formatted(
                    commonBookInfo,
                    request.getTitle(),
                    variationGuide
            );

            Map<String, Object> body = new HashMap<>();
            body.put("model", "gpt-image-2");
            body.put("prompt", prompt);
            body.put("n", 1);
            body.put("size", "1024x1024");

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(request.getApiKey());

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

            ResponseEntity<Map> response;
            try {
                response = restTemplate.postForEntity(
                    "https://api.openai.com/v1/images/generations",
                    entity,
                    Map.class
                );
            } catch (ResourceAccessException e) {
                throw new ResponseStatusException(HttpStatus.GATEWAY_TIMEOUT,
                        "표지 생성 서버에 연결하지 못했거나 응답 대기 시간을 초과했습니다.");
            } catch (RestClientException e) {
                // 외부 오류 원문에는 요청 정보가 포함될 수 있으므로 반환하지 않는다.
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                        "표지를 생성하지 못했습니다. API 키와 이용 한도를 확인해 주세요.");
            }

            Object data = response.getBody() == null ? null : response.getBody().get("data");
            if (!(data instanceof List<?> images) || images.isEmpty()
                    || !(images.get(0) instanceof Map<?, ?> first)
                    || !(first.get("b64_json") instanceof String encoded) || encoded.isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                        "표지 생성 서버에서 올바른 이미지 응답을 받지 못했습니다.");
            }
            posters.add("data:image/png;base64," + encoded);
        }

        Map<String, Object> result = new HashMap<>();
        result.put("posters", posters);

        return ResponseEntity.ok(result);
    }

    @Data
    static class AiCoverRequest {
        @NotBlank(message = "제목은 필수입니다.")
        private String title;
        private String genre;
        private List<String> moods;
        private String description;
        private String coverPrompt;
        @NotBlank(message = "API 키는 필수입니다.")
        private String apiKey;
    }
}
