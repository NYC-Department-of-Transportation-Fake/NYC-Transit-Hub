package com.nyctransithub.backend.config;

import java.time.Duration;
import java.util.List;
import java.util.Map;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties("app.mta")
public record MtaProperties(String baseUrl, Duration timeout, Duration staleAfter,
        Map<String, List<String>> feeds) {}
