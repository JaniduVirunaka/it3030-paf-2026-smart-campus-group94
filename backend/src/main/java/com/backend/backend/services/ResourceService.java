package com.backend.backend.services;

import com.backend.backend.models.Resource;
import com.backend.backend.repositories.ResourceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ResourceService {

    @Autowired
    private ResourceRepository resourceRepository;

    // 1. CREATE (Will be used for POST)
    // Saves a brand new resource to the database
    public Resource createResource(Resource resource) {
        return resourceRepository.save(resource);
    }

    // 2. READ (Will be used for GET)
    // UPGRADE: Filter out the ARCHIVED resources
    public List<Resource> getAllResources() {
        return resourceRepository.findByStatusNot("ARCHIVED");
    }

    // READ (Will be used for GET by ID)
    // Fetches a specific resource, if it exists
    public Optional<Resource> getResourceById(String id) {
        return resourceRepository.findById(id);
    }

    // NEW METHOD for the Export feature: Fetches absolutely everything
    public List<Resource> getAllResourcesIncludingArchived() {
        return resourceRepository.findAll(); 
    }

    // 3. UPDATE (Will be used for PUT)
    // Finds an existing resource and updates its details
    public Resource updateResource(String id, Resource resourceDetails) {
        Optional<Resource> existingResource = resourceRepository.findById(id);
        
        if (existingResource.isPresent()) {
            Resource updatedResource = existingResource.get();
            updatedResource.setName(resourceDetails.getName());
            updatedResource.setType(resourceDetails.getType());
            updatedResource.setCapacity(resourceDetails.getCapacity());
            updatedResource.setLocation(resourceDetails.getLocation());
            updatedResource.setAvailabilityWindows(resourceDetails.getAvailabilityWindows());
            updatedResource.setStatus(resourceDetails.getStatus());
            
            return resourceRepository.save(updatedResource);
        }
        return null; // In the next step, we will make the Controller handle this 'null' gracefully
    }

    // 4. DELETE (Will be used for DELETE)
    // NEW: Soft Deletion Logic
    public boolean softDeleteResource(String id) {
        Optional<Resource> resourceOpt = resourceRepository.findById(id);
        if (resourceOpt.isPresent()) {
            Resource resource = resourceOpt.get();
            resource.setStatus("ARCHIVED"); // Change status instead of deleting
            resourceRepository.save(resource);
            return true;
        }
        return false;
    }

    // NEW: Server-side search and filter logic
    public List<Resource> searchAndFilterResources(String searchTerm, String type, String status) {
        // Fetch your active resources from the database
        List<Resource> allActiveResources = resourceRepository.findAll(); // Or findByStatusNot("DELETED")

        // Use Java Streams to filter the data before sending it to the frontend
        return allActiveResources.stream().filter(r -> {
            boolean matchesSearch = searchTerm.isEmpty() || 
                (r.getName() != null && r.getName().toLowerCase().contains(searchTerm.toLowerCase())) ||
                (r.getLocation() != null && r.getLocation().toLowerCase().contains(searchTerm.toLowerCase()));
                
            boolean matchesType = type.equals("ALL") || 
                (r.getType() != null && r.getType().equalsIgnoreCase(type));
                
            boolean matchesStatus = status.equals("ALL") || 
                (r.getStatus() != null && r.getStatus().equalsIgnoreCase(status));

            return matchesSearch && matchesType && matchesStatus;
        }).toList();
    }
}