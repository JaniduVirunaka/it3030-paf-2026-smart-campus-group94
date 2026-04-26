package com.backend.backend.models;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Data
@Document(collection = "tickets")
public class Ticket {
    @Id
    private String id;
    private String userId;
    private String userName;

    @NotBlank(message = "Resource selection is required")
    private String resourceId;
    private String resourceName;

    @NotBlank(message = "Category is required")
    private String category;

    @NotBlank(message = "Description is required")
    @Size(min = 10, message = "Description must be at least 10 characters")
    private String description;

    @NotBlank(message = "Priority is required")
    private String priority; // LOW, MEDIUM, HIGH, URGENT

    @NotBlank(message = "Contact details are required")
    private String contactDetails;

    private String status; // OPEN, IN_PROGRESS, RESOLVED, CLOSED, REJECTED
    private String technicianId;
    private String adminReason; // For rejection
    private String resolutionNotes;
    private List<String> attachments = new ArrayList<>();
    private Instant createdAt;
    private Instant updatedAt;

    public Ticket() {
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
        this.status = "OPEN";
    }
}
