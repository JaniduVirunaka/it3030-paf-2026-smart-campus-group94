package com.backend.backend.models;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.time.LocalTime;

@Document(collection = "bookings")
public class Booking {

    @Id
    private String id;

    @NotBlank(message = "Resource ID is required.")
    private String resourceId;

    @NotBlank(message = "User ID is required.")
    private String userId;

    @NotBlank(message = "Student Registration Number is required.")
    private String studentRegNumber;

    @NotBlank(message = "Student Phone Number is required.")
    @Pattern(regexp = "^\\d{10}$", message = "Phone number must be exactly 10 digits.")
    private String studentPhone;

    @NotBlank(message = "Student Email is required.")
    @Email(message = "Please provide a valid email address.")
    private String studentEmail;

    @NotNull(message = "Date is required.")
    @FutureOrPresent(message = "Booking date cannot be in the past.")
    private LocalDate date;

    @NotNull(message = "Start time is required.")
    private LocalTime startTime;

    @NotNull(message = "End time is required.")
    private LocalTime endTime;

    @NotBlank(message = "Purpose is required.")
    @Size(max = 500, message = "Purpose must not exceed 500 characters.")
    private String purpose;

    @Min(value = 1, message = "Expected attendees must be at least 1.")
    private int expectedAttendees;

    private String status; // PENDING, APPROVED, REJECTED, CANCELLED

    private String rejectionReason;

    public Booking() {
    }

    public Booking(String resourceId, String userId, LocalDate date, LocalTime startTime, LocalTime endTime, String purpose, int expectedAttendees, String status) {
        this.resourceId = resourceId;
        this.userId = userId;
        this.date = date;
        this.startTime = startTime;
        this.endTime = endTime;
        this.purpose = purpose;
        this.expectedAttendees = expectedAttendees;
        this.status = status;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getResourceId() { return resourceId; }
    public void setResourceId(String resourceId) { this.resourceId = resourceId; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getStudentRegNumber() { return studentRegNumber; }
    public void setStudentRegNumber(String studentRegNumber) { this.studentRegNumber = studentRegNumber; }

    public String getStudentPhone() { return studentPhone; }
    public void setStudentPhone(String studentPhone) { this.studentPhone = studentPhone; }

    public String getStudentEmail() { return studentEmail; }
    public void setStudentEmail(String studentEmail) { this.studentEmail = studentEmail; }

    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }

    public LocalTime getStartTime() { return startTime; }
    public void setStartTime(LocalTime startTime) { this.startTime = startTime; }

    public LocalTime getEndTime() { return endTime; }
    public void setEndTime(LocalTime endTime) { this.endTime = endTime; }

    public String getPurpose() { return purpose; }
    public void setPurpose(String purpose) { this.purpose = purpose; }

    public int getExpectedAttendees() { return expectedAttendees; }
    public void setExpectedAttendees(int expectedAttendees) { this.expectedAttendees = expectedAttendees; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getRejectionReason() { return rejectionReason; }
    public void setRejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; }
}
