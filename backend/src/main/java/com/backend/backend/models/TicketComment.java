package com.backend.backend.models;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Data
@Document(collection = "ticket_comments")
public class TicketComment {
    @Id
    private String id;
    private String ticketId;
    private String userId; // The person who wrote the comment
    private String userName;
    private String content;
    private Instant createdAt;
    private Instant updatedAt;

    public TicketComment() {
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }
}
