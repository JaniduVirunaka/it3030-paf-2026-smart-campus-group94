package com.backend.backend.services;

import com.backend.backend.models.Ticket;
import com.backend.backend.repositories.TicketRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Service
public class TicketService {

    @Autowired
    private TicketRepository ticketRepository;

    public Ticket createTicket(Ticket ticket) {
        ticket.setCreatedAt(Instant.now());
        ticket.setUpdatedAt(Instant.now());
        ticket.setStatus("OPEN");
        return ticketRepository.save(ticket);
    }

    public List<Ticket> getAllTickets() {
        return ticketRepository.findAll();
    }

    public List<Ticket> getTicketsByUserId(String userId) {
        return ticketRepository.findByUserId(userId);
    }

    public Optional<Ticket> getTicketById(String id) {
        return ticketRepository.findById(id);
    }

    public Ticket updateTicket(Ticket ticket) {
        ticket.setUpdatedAt(Instant.now());
        return ticketRepository.save(ticket);
    }

    public void deleteTicket(String id) {
        ticketRepository.deleteById(id);
    }
}
