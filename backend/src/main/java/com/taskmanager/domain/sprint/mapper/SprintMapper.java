package com.taskmanager.domain.sprint.mapper;

import com.taskmanager.domain.sprint.dto.SprintResponse;
import com.taskmanager.domain.sprint.dto.SprintSummaryResponse;
import com.taskmanager.domain.sprint.entity.Sprint;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.ERROR)
public interface SprintMapper {

    @Mapping(target = "projectId", source = "project.id")
    SprintResponse toResponse(Sprint sprint);

    @Mapping(target = "projectId", source = "project.id")
    SprintSummaryResponse toSummaryResponse(Sprint sprint);
}
