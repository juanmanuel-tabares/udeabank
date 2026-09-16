package com.udea.lab1arq.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Permite que el frontend (Vite) consuma la API desde otro origen.
 * En desarrollo Vite corre en 5173/4173; ajusta la lista si usas otro puerto.
 */
@Configuration
public class CorsConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        // Patrones en vez de una lista fija: Vite cambia de puerto solo cuando
        // el 5173 esta ocupado (5174, 5175, …) y con allowedOrigins exactos
        // cada cambio de puerto rompia el frontend con "Invalid CORS request".
        registry.addMapping("/api/**")
                .allowedOriginPatterns(
                        "http://localhost:[*]",
                        "http://127.0.0.1:[*]")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*");
    }
}
