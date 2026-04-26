package com.backend.backend.repositories;

import com.backend.backend.models.Ticket;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface TicketRepository extends MongoRepository<Ticket, String> {
    List<Ticket> findByUserId(String userId);
    List<Ticket> findByTechnicianId(String technicianId);
}
