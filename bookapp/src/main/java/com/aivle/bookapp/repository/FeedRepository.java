package com.aivle.bookapp.repository;

import com.aivle.bookapp.entity.Feed;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FeedRepository extends JpaRepository<Feed, Long> {
    List<Feed> findByBookId(Long bookId);

    List<Feed> findByUserIdInOrderByCreatedAtDesc(List<Long> userIds);

    void deleteByUserId(Long userId);

    void deleteByBookId(Long bookId);
}
