package com.aivle.bookapp.repository;

import com.aivle.bookapp.entity.FeedComment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FeedCommentRepository extends JpaRepository<FeedComment, Long> {
    void deleteByFeedIdIn(List<Long> feedIds);

    List<FeedComment> findByFeedIdOrderByCreatedAtAsc(Long feedId);

    void deleteByUserId(Long userId);
}
