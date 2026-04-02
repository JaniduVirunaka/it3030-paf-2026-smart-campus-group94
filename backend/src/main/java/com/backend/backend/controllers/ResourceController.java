package com.backend.backend.controllers;

import com.backend.backend.models.Resource;
import com.backend.backend.services.ResourceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/resources")
@CrossOrigin(origins = "http://localhost:5173") 
public class ResourceController {

    @Autowired
    private ResourceService resourceService;

    // 1. POST - Create a new resource in the catalogue
    @PostMapping
    public ResponseEntity<Resource> createResource(@RequestBody Resource resource) {
        Resource newResource = resourceService.createResource(resource);
        return new ResponseEntity<>(newResource, HttpStatus.CREATED);
    }

    // 2. UPGRADED GET - Retrieve all active resources (Hides archived)
    @GetMapping
    public ResponseEntity<List<Resource>> getAllResources() {
        List<Resource> resources = resourceService.getAllResources();
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
    public ResponseEntity<Resource> updateResource(@PathVariable String id, @RequestBody Resource resourceDetails) {
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
}