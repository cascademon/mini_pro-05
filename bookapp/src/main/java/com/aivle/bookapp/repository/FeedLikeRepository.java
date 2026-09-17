package com.aivle.bookapp.repository;

import com.aivle.bookapp.entity.FeedLike;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.List;

public interface FeedLikeRepository extends JpaRepository<FeedLike, Long> {
    void deleteByFeedIdIn(List<Long> feedIds);
    Optional<FeedLike> findByFeedIdAndUserId(Long feedId, Long userId);

    void deleteByUserId(Long userId);
}
