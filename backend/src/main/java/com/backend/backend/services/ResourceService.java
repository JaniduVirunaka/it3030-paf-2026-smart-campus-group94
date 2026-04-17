package com.backend.backend.services;

import com.backend.backend.models.Resource;
import com.backend.backend.repositories.ResourceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.domain.PageImpl;

import java.util.List;
import java.util.Optional;

@Service
public class ResourceService {

    @Autowired
    private ResourceRepository resourceRepository;

    @Autowired
    private MongoTemplate mongoTemplate;

    // 1. CREATE (Will be used for POST)
    // Saves a brand new resource to the database
    public Resource createResource(Resource resource) {
        return resourceRepository.save(resource);
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
            updatedResource.setImageBase64(resourceDetails.getImageBase64());
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

    // Server-Side Search, Filter, and Pagination
    public Page<Resource> searchAndFilterResources(String searchTerm, String type, String status, Integer minCapacity, Pageable pageable) {
        Query query = new Query();

        // 1. Apply Search Term (checks Name OR Location, case-insensitive)
        if (searchTerm != null && !searchTerm.trim().isEmpty()) {
            Criteria searchCriteria = new Criteria().orOperator(
                Criteria.where("name").regex(searchTerm, "i"),
                Criteria.where("location").regex(searchTerm, "i")
            );
            query.addCriteria(searchCriteria);
        }

        // 2. Apply Type Filter
        if (type != null && !type.equals("ALL")) {
            query.addCriteria(Criteria.where("type").is(type));
        }

        // 3. Apply Status Filter (hide ARCHIVED unless explicitly requested)
        if (status != null && !status.equals("ALL")) {
            query.addCriteria(Criteria.where("status").is(status));
        } else {
            query.addCriteria(Criteria.where("status").ne("ARCHIVED"));
        }

        // 4. Apply Minimum Capacity Filter
        if (minCapacity != null && minCapacity > 0) {
            query.addCriteria(Criteria.where("capacity").gte(minCapacity));
        }

        // 5. Count total matching records before slicing into pages
        long totalCount = mongoTemplate.count(query, Resource.class);

        // 6. Apply pagination
        query.with(pageable);

        // 7. Fetch the page slice
        List<Resource> paginatedResources = mongoTemplate.find(query, Resource.class);

        return new PageImpl<>(paginatedResources, pageable, totalCount);
    }
}