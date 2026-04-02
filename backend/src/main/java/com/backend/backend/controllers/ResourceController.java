package com.backend.backend.controllers;

import com.backend.backend.models.Resource;
import com.backend.backend.services.ResourceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile; // NEW: For file uploads

import jakarta.servlet.http.HttpServletResponse;
import java.io.BufferedReader; // NEW: For reading the file
import java.io.IOException;
import java.io.InputStreamReader; // NEW: For reading the file
import java.io.PrintWriter;
import java.nio.charset.StandardCharsets; // NEW: To handle text encoding
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/resources")
@CrossOrigin(origins = "http://localhost:5173") 
public class ResourceController {

    @Autowired
    private ResourceService resourceService;

    // 1. POST - Create a new resource in the catalogue
    @PostMapping
    public ResponseEntity<Resource> createResource(@Valid @RequestBody Resource resource) {
        Resource newResource = resourceService.createResource(resource);
        return new ResponseEntity<>(newResource, HttpStatus.CREATED);
    }

    // 2. UPGRADED GET - Retrieve all active resources (Hides archived)
   // UPGRADED GET - Server-Side Search and Filtering
    @GetMapping
    public ResponseEntity<List<Resource>> getAllResources(
            @RequestParam(required = false, defaultValue = "") String searchTerm,
            @RequestParam(required = false, defaultValue = "ALL") String type,
            @RequestParam(required = false, defaultValue = "ALL") String status) {
        
        // Pass the parameters to our new Service method
        List<Resource> resources = resourceService.searchAndFilterResources(searchTerm, type, status);
        return new ResponseEntity<>(resources, HttpStatus.OK);
    }

    // GET - Retrieve a single specific resource by its ID
    @GetMapping("/{id}")
    public ResponseEntity<Resource> getResourceById(@PathVariable String id) {
        Optional<Resource> resource = resourceService.getResourceById(id);
        return resource.map(value -> new ResponseEntity<>(value, HttpStatus.OK))
                       .orElseGet(() -> new ResponseEntity<>(HttpStatus.NOT_FOUND));
    }

    // 3. PUT - Update an existing resource
    @PutMapping("/{id}")
    public ResponseEntity<Resource> updateResource(@PathVariable String id, @Valid @RequestBody Resource resourceDetails) {
        Resource updatedResource = resourceService.updateResource(id, resourceDetails);
        if (updatedResource != null) {
            return new ResponseEntity<>(updatedResource, HttpStatus.OK);
        }
        return new ResponseEntity<>(HttpStatus.NOT_FOUND);
    }

    // 4. UPGRADED DELETE - Triggers the Soft Deletion
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteResource(@PathVariable String id) {
        boolean isArchived = resourceService.softDeleteResource(id);
        
        if (isArchived) {
            // Returns a nice JSON message to React
            return ResponseEntity.ok().body(Map.of("success", true, "message", "Resource archived safely."));
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("success", false, "message", "Resource not found."));
        }
    }

    // EXPORT ENDPOINT
   @GetMapping("/export")
    public void exportResourcesToCSV(
            @RequestParam(required = false, defaultValue = "") String searchTerm,
            @RequestParam(required = false, defaultValue = "ALL") String type,
            @RequestParam(required = false, defaultValue = "ALL") String status,
            HttpServletResponse response) throws IOException {

        response.setContentType("text/csv");
        response.setHeader("Content-Disposition", "attachment; filename=\"filtered_campus_resources.csv\"");

        PrintWriter writer = response.getWriter();
        writer.println("Name,Type,Capacity,Location,AvailabilityWindows,Status");

        // 1. Fetch ALL resources (including archived ones)
        List<Resource> allResources = resourceService.getAllResourcesIncludingArchived();

        // 2. Filter the list in Java based on the parameters sent from React
        List<Resource> filteredResources = allResources.stream().filter(r -> {
            boolean matchesSearch = searchTerm.isEmpty() || 
                (r.getName() != null && r.getName().toLowerCase().contains(searchTerm.toLowerCase())) ||
                (r.getLocation() != null && r.getLocation().toLowerCase().contains(searchTerm.toLowerCase()));
                
            boolean matchesType = type.equals("ALL") || 
                (r.getType() != null && r.getType().equalsIgnoreCase(type));
                
            boolean matchesStatus = status.equals("ALL") || 
                (r.getStatus() != null && r.getStatus().equalsIgnoreCase(status));

            return matchesSearch && matchesType && matchesStatus;
        }).toList();

        // 3. Write ONLY the filtered results to the CSV
        for (Resource res : filteredResources) {
            String name = res.getName() != null ? res.getName().replace(",", " ") : "";
            String location = res.getLocation() != null ? res.getLocation().replace(",", " ") : "";
            
            writer.println(
                name + "," +
                res.getType() + "," +
                res.getCapacity() + "," +
                location + "," +
                res.getAvailabilityWindows() + "," +
                res.getStatus()
            );
        }

        writer.flush();
        writer.close();
    }

    // NEW: IMPORT ENDPOINT
    @PostMapping("/import")
    public ResponseEntity<Map<String, String>> importResourcesFromCSV(@RequestParam("file") MultipartFile file) {
        Map<String, String> response = new HashMap<>();

        if (file.isEmpty()) {
            response.put("error", "Please upload a valid CSV file.");
            return ResponseEntity.badRequest().body(response);
        }

        try (BufferedReader fileReader = new BufferedReader(new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {
            List<Resource> resourcesToSave = new ArrayList<>(); 
            String line;
            boolean isFirstRow = true;

            while ((line = fileReader.readLine()) != null) {
                if (isFirstRow) {
                    isFirstRow = false; // Skip the header row
                    continue;
                }

                String[] data = line.split(",");

                // Make sure the row has the expected 6 columns (Name, Type, Capacity, Location, Availability, Status)
                if (data.length >= 6) {
                    Resource resource = new Resource();
                    resource.setName(data[0].trim());
                    resource.setType(data[1].trim());
                    
                    try {
                        resource.setCapacity(Integer.parseInt(data[2].trim()));
                    } catch (NumberFormatException e) {
                        resource.setCapacity(0); 
                    }
                    
                    resource.setLocation(data[3].trim());
                    resource.setAvailabilityWindows(data[4].trim());
                    resource.setStatus(data[5].trim());

                    resourcesToSave.add(resource);
                }
            }

            // Save each valid resource using your existing service method
            for (Resource res : resourcesToSave) {
                resourceService.createResource(res);
            }

            response.put("message", "Successfully imported " + resourcesToSave.size() + " resources!");
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            e.printStackTrace();
            response.put("error", "Failed to process the CSV file: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
}