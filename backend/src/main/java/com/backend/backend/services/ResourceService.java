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
}