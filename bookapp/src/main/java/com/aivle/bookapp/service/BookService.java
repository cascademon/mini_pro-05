package com.aivle.bookapp.service;

import com.aivle.bookapp.dto.BookRecommendDto;
import com.aivle.bookapp.dto.RecommendResponse;
import com.aivle.bookapp.entity.Book;
import com.aivle.bookapp.entity.BookLike;
import com.aivle.bookapp.entity.Feed;
import com.aivle.bookapp.entity.User;
import com.aivle.bookapp.exception.BookNotFoundException;
import com.aivle.bookapp.repository.BookLikeRepository;
import com.aivle.bookapp.repository.BookRepository;
import com.aivle.bookapp.repository.FeedRepository;
import com.aivle.bookapp.repository.FeedCommentRepository;
import com.aivle.bookapp.repository.FeedLikeRepository;
import com.aivle.bookapp.repository.HighlightRepository;
import com.aivle.bookapp.repository.ReviewRepository;
import com.aivle.bookapp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class BookService {

    private final BookRepository bookRepository;
    private final BookLikeRepository bookLikeRepository;
    private final FeedRepository feedRepository;
    private final UserRepository userRepository;
    private final ReviewRepository reviewRepository;
    private final HighlightRepository highlightRepository;
    private final FeedCommentRepository feedCommentRepository;
    private final FeedLikeRepository feedLikeRepository;

    // 1. 전체 도서 조회 (휴지통 제외)
    @Transactional(readOnly = true)
    public List<Book> getAllBooks() {
        return bookRepository.findByDeletedAtIsNull();
    }

    // 2. 특정 도서 상세 조회
    @Transactional(readOnly = true)
    public Book getBookById(Long id) {
        return bookRepository.findById(id)
                .orElseThrow(() -> new BookNotFoundException(id));
    }

    // 3. 신규 도서 등록
    public Book createBook(Book book) {
        return bookRepository.save(book);
    }

    // 4. 도서 정보 전체 수정
    public Book updateBook(Long id, Book bookDetails) {
        Book book = getBookById(id);

        book.setTitle(bookDetails.getTitle());
        book.setAuthor(bookDetails.getAuthor());
        book.setIsbn(bookDetails.getIsbn());
        book.setGenre(bookDetails.getGenre());
        book.setDescription(bookDetails.getDescription());
        book.setPublisher(bookDetails.getPublisher());
        book.setPublishedDate(bookDetails.getPublishedDate());
        book.setPageCount(bookDetails.getPageCount());
        book.setPoster(bookDetails.getPoster());
        book.setLikes(bookDetails.getLikes());
        book.setRepresentativeCoverId(bookDetails.getRepresentativeCoverId());
        book.setIsFavorite(bookDetails.getIsFavorite());
        List<String> moods = new ArrayList<>(bookDetails.getMoods() == null ? List.of() : bookDetails.getMoods());
        book.getMoods().clear();
        book.getMoods().addAll(moods);

        return book;
    }

    // 5. 도서 정보 부분 수정
    public Book updateBookPartial(Long id, Map<String, Object> updates) {
        if (updates.containsKey("moods") && (!(updates.get("moods") instanceof List<?> moods)
                || moods.stream().anyMatch(m -> !(m instanceof String)))) {
            throw new IllegalArgumentException("분위기는 문자열 목록으로 입력해 주세요.");
        }
        Book book = getBookById(id);

        if (updates.containsKey("title")) {
            book.setTitle((String) updates.get("title"));
        }

        if (updates.containsKey("author")) {
            book.setAuthor((String) updates.get("author"));
        }

        if (updates.containsKey("isbn")) {
            book.setIsbn((String) updates.get("isbn"));
        }

        if (updates.containsKey("genre")) {
            book.setGenre((String) updates.get("genre"));
        }

        if (updates.containsKey("description")) {
            book.setDescription((String) updates.get("description"));
        }

        if (updates.containsKey("publisher")) {
            book.setPublisher((String) updates.get("publisher"));
        }

        if (updates.containsKey("publishedDate")) {
            book.setPublishedDate((String) updates.get("publishedDate"));
        }

        if (updates.containsKey("pageCount")) {
            Object value = updates.get("pageCount");
            if (value == null) {
                book.setPageCount(null);
            } else if (value instanceof Number) {
                book.setPageCount(((Number) value).intValue());
            }
        }

        if (updates.containsKey("poster")) {
            book.setPoster((String) updates.get("poster"));
        }

        if (updates.containsKey("likes")) {
            Object value = updates.get("likes");
            if (value == null) {
                book.setLikes(0);
            } else if (value instanceof Number) {
                book.setLikes(((Number) value).intValue());
            }
        }

        if (updates.containsKey("isFavorite")) {
            book.setIsFavorite((Boolean) updates.get("isFavorite"));
        }

        if (updates.containsKey("representativeCoverId")) {
            Object value = updates.get("representativeCoverId");
            if (value == null) {
                book.setRepresentativeCoverId(null);
            } else if (value instanceof Number) {
                book.setRepresentativeCoverId(((Number) value).longValue());
            }
        }

        if (updates.containsKey("moods")) {
            book.getMoods().clear();
            Object value = updates.get("moods");
            if (value instanceof java.util.List<?> moodList) {
                moodList.forEach(m -> book.getMoods().add((String) m));
            }
        }

        return book;
    }

    // 6. 도서 삭제 → 휴지통으로 이동
    public void deleteBook(Long id) {
        Book book = bookRepository.findById(id)
                .orElseThrow(() -> new BookNotFoundException(id));
        if (book.getDeletedAt() != null) {
            throw new IllegalArgumentException("이미 휴지통에 있는 책입니다.");
        }
        book.setDeletedAt(LocalDateTime.now());
    }

    // 7. 휴지통 조회
    @Transactional(readOnly = true)
    public List<Book> getTrashBooks() {
        return bookRepository.findByDeletedAtIsNotNull();
    }

    // 9. 휴지통 복구
    public void restoreBook(Long id) {
        Book book = bookRepository.findById(id)
                .orElseThrow(() -> new BookNotFoundException(id));
        if (book.getDeletedAt() == null) {
            throw new IllegalArgumentException("휴지통에 있는 책만 복구할 수 있습니다.");
        }
        book.setDeletedAt(null);
    }

    // 10. 영구 삭제 (연관 데이터 함께 정리 → 고아 레코드 방지)
    public void permanentlyDeleteBook(Long id) {
        List<Long> feedIds = feedRepository.findByBookId(id).stream().map(Feed::getId).toList();
        if (!feedIds.isEmpty()) {
            feedCommentRepository.deleteByFeedIdIn(feedIds);
            feedLikeRepository.deleteByFeedIdIn(feedIds);
        }
        bookLikeRepository.deleteByBookId(id);
        reviewRepository.deleteByBookId(id);
        highlightRepository.deleteByBookId(id);
        feedRepository.deleteByBookId(id);
        bookRepository.deleteById(id);
    }

    // 11. 타인 서재 도서 목록 (공개 여부 확인)
    @Transactional(readOnly = true)
    public List<Book> getUserBooks(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
        boolean isPublic = user.getLibraryPublic() == null || user.getLibraryPublic();
        if (!isPublic) {
            throw new IllegalArgumentException("비공개 서재입니다.");
        }
        return bookRepository.findByUserIdAndDeletedAtIsNull(userId);
    }

    // 13. 내 서재 도서 목록
    @Transactional(readOnly = true)
    public List<Book> getMyBooks(Long userId) {
        return bookRepository.findByUserIdAndDeletedAtIsNull(userId);
    }

    // 12. 독서 상태 변경
    public Book updateReadingStatus(Long id, String readingStatus) {
        Book book = getBookById(id);
        book.setReadingStatus(readingStatus);

        if (book.getUserId() != null && readingStatus != null && !readingStatus.isBlank()) {
            Feed feed = Feed.builder()
                    .userId(book.getUserId())
                    .bookId(id)
                    .action(readingStatus)
                    .createdAt(LocalDateTime.now())
                    .build();
            feedRepository.save(feed);
        }

        return book;
    }

    // 13. 책장 배정 (null = 해제)
    public Book assignToShelf(Long id, Long bookshelfId) {
        Book book = getBookById(id);
        book.setBookshelfId(bookshelfId);
        return book;
    }

    // 14. AI 표지 저장
    public Book updateBookCover(Long id, String posterUrl) {
        Book book = getBookById(id);
        book.setPoster(posterUrl);
        return book;
    }

    // 16. 맞춤 추천
    @Transactional(readOnly = true)
    public RecommendResponse getRecommendedBooks(Long userId) {
        // 취향 분석 + 후보 제외 모두 readingStatus가 설정된 책 기준
        // (Postman 시드처럼 userId만 일치하고 readingStatus 없는 책은 아직 읽지 않은 책으로 취급)
        List<Book> myBooks = bookRepository.findByUserIdAndDeletedAtIsNull(userId).stream()
                .filter(b -> b.getReadingStatus() != null && !b.getReadingStatus().isBlank())
                .collect(Collectors.toList());

        // 장르 빈도 집계
        Map<String, Long> genreCount = new HashMap<>();
        for (Book b : myBooks) {
            if (b.getGenre() != null && !b.getGenre().isBlank()) {
                genreCount.merge(b.getGenre().trim(), 1L, Long::sum);
            }
        }

        // 분위기 빈도 집계
        Map<String, Long> moodCount = new HashMap<>();
        for (Book b : myBooks) {
            for (String mood : b.getMoods()) {
                if (mood != null && !mood.isBlank()) {
                    moodCount.merge(mood.trim(), 1L, Long::sum);
                }
            }
        }

        // 화면 표시용: 대표 장르 3개, 분위기 5개
        List<String> topGenres = genreCount.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(3).map(Map.Entry::getKey).collect(Collectors.toList());

        List<String> topMoods = moodCount.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(5).map(Map.Entry::getKey).collect(Collectors.toList());

        // 스코어링용: 서재 전체 장르·분위기 (빈도 가중치 포함)
        Set<String> allGenres = genreCount.keySet();
        Set<String> allMoods = moodCount.keySet();

        Set<Long> myBookIds = myBooks.stream().map(Book::getId).collect(Collectors.toSet());

        // 내 서재에 없는 전체 도서에 점수 계산
        List<Book> candidates = bookRepository.findByDeletedAtIsNull().stream()
                .filter(b -> !myBookIds.contains(b.getId()))
                .collect(Collectors.toList());

        List<BookRecommendDto> scored = new ArrayList<>();
        for (Book b : candidates) {
            int score = 0;
            List<String> reasons = new ArrayList<>();

            if (b.getGenre() != null && allGenres.contains(b.getGenre().trim())) {
                // 자주 읽은 장르일수록 가중치 높음
                long freq = genreCount.getOrDefault(b.getGenre().trim(), 1L);
                score += (int) Math.min(freq + 2, 5);
                reasons.add(b.getGenre().trim() + " 장르");
            }

            List<String> matchedMoods = new ArrayList<>();
            for (String mood : b.getMoods()) {
                if (mood != null && allMoods.contains(mood.trim())) {
                    long freq = moodCount.getOrDefault(mood.trim(), 1L);
                    score += (int) Math.min(freq, 3);
                    matchedMoods.add(mood.trim());
                }
            }
            if (!matchedMoods.isEmpty()) {
                reasons.add(String.join(", ", matchedMoods) + " 분위기");
            }

            if (score > 0) {
                String reason = String.join(" · ", reasons) + " 기반 추천";
                scored.add(new BookRecommendDto(b, score, reason));
            }
        }

        scored.sort(Comparator.comparingInt(BookRecommendDto::getScore).reversed());
        List<BookRecommendDto> result = scored.stream().limit(20).collect(Collectors.toList());

        return new RecommendResponse(topGenres, topMoods, result, (int) myBooks.size());
    }

    // 18. 랜덤 도서 조회
    @Transactional(readOnly = true)
    public List<Book> getRandomBooks(int count) {
        List<Book> all = new ArrayList<>(bookRepository.findByDeletedAtIsNull());
        Collections.shuffle(all);
        return all.subList(0, Math.min(count, all.size()));
    }

    // 내 서재에 추가 (공개 도서 복사)
    public Book addToLibrary(Long bookId, Long userId) {
        Book original = bookRepository.findById(bookId)
                .orElseThrow(() -> new BookNotFoundException(bookId));

        Book copy = new Book();
        copy.setUserId(userId);
        copy.setTitle(original.getTitle());
        copy.setAuthor(original.getAuthor());
        copy.setIsbn(original.getIsbn());
        copy.setGenre(original.getGenre());
        copy.setMoods(new ArrayList<>(original.getMoods() == null ? List.of() : original.getMoods()));
        copy.setDescription(original.getDescription());
        copy.setPublisher(original.getPublisher());
        copy.setPublishedDate(original.getPublishedDate());
        copy.setPageCount(original.getPageCount());
        copy.setPoster(original.getPoster());
        copy.setReadingStatus("want");

        return bookRepository.save(copy);
    }

    // 15. 책 좋아요 토글
    public void toggleLike(Long bookId, Long userId) {
        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new BookNotFoundException(bookId));

        Optional<BookLike> existing = bookLikeRepository.findByBookIdAndUserId(bookId, userId);

        if (existing.isPresent()) {
            bookLikeRepository.delete(existing.get());
            book.setLikes(Math.max(0, book.getLikes() - 1));
            return;
        }

        BookLike newLike = new BookLike();
        newLike.setBookId(bookId);
        newLike.setUserId(userId);
        newLike.setCreatedDate(LocalDateTime.now());

        bookLikeRepository.save(newLike);
        book.setLikes(book.getLikes() + 1);
    }
}
