package com.backend.backend.repositories;

import com.backend.backend.models.TicketComment;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface TicketCommentRepository extends MongoRepository<TicketComment, String> {
    List<TicketComment> findByTicketIdOrderByCreatedAtAsc(String ticketId);
}
