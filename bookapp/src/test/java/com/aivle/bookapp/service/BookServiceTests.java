package com.aivle.bookapp.service;

import com.aivle.bookapp.entity.Book;
import com.aivle.bookapp.entity.Feed;
import com.aivle.bookapp.repository.*;
import org.junit.jupiter.api.Test;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class BookServiceTests {
    private final BookRepository books = mock(BookRepository.class);
    private final BookLikeRepository likes = mock(BookLikeRepository.class);
    private final FeedRepository feeds = mock(FeedRepository.class);
    private final UserRepository users = mock(UserRepository.class);
    private final ReviewRepository reviews = mock(ReviewRepository.class);
    private final HighlightRepository highlights = mock(HighlightRepository.class);
    private final FeedCommentRepository comments = mock(FeedCommentRepository.class);
    private final FeedLikeRepository feedLikes = mock(FeedLikeRepository.class);
    private final BookService service = new BookService(books, likes, feeds, users, reviews, highlights, comments, feedLikes);

    @Test void updateRetainsNewMoodsAndDoesNotShareInputList() {
        Book existing = new Book();
        existing.getMoods().add("old");
        Book input = new Book();
        input.getMoods().add("new");
        when(books.findById(1L)).thenReturn(Optional.of(existing));
        service.updateBook(1L, input);
        assertEquals(List.of("new"), existing.getMoods());
        input.getMoods().clear();
        assertEquals(List.of("new"), existing.getMoods());
    }

    @Test void libraryCopyRetainsIndependentMoods() {
        Book original = new Book();
        original.getMoods().add("calm");
        when(books.findById(1L)).thenReturn(Optional.of(original));
        when(books.save(any(Book.class))).thenAnswer(call -> call.getArgument(0));
        Book copy = service.addToLibrary(1L, 2L);
        assertEquals(List.of("calm"), copy.getMoods());
        copy.getMoods().clear();
        assertEquals(List.of("calm"), original.getMoods());
    }

    @Test void invalidMoodsDoNotMutateBook() {
        Book existing = new Book();
        existing.getMoods().add("calm");
        assertThrows(IllegalArgumentException.class,
            () -> service.updateBookPartial(1L, Map.of("moods", List.of(1))));
        verifyNoInteractions(books);
        assertEquals(List.of("calm"), existing.getMoods());
    }

    @Test void deletesFeedChildrenBeforeFeeds() {
        Feed feed = new Feed();
        feed.setId(7L);
        when(feeds.findByBookId(1L)).thenReturn(List.of(feed));
        service.permanentlyDeleteBook(1L);
        var order = inOrder(comments, feedLikes, feeds, books);
        order.verify(comments).deleteByFeedIdIn(List.of(7L));
        order.verify(feedLikes).deleteByFeedIdIn(List.of(7L));
        order.verify(feeds).deleteByBookId(1L);
        order.verify(books).deleteById(1L);
    }
}
