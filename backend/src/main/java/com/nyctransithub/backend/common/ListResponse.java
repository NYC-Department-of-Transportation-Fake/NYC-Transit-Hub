package com.nyctransithub.backend.common;

import java.util.List;

public record ListResponse<T>(List<T> data, int total) {
    public ListResponse(List<T> data) {
        this(List.copyOf(data), data.size());
    }
}
