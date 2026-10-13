package com.udea.lab1arq.controller;

import com.udea.lab1arq.DTO.VersionDTO;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Endpoints de estado usados por el health check de Render y por la prueba de
 * humo del pipeline, que compara el commit desplegado con el del push.
 */
@RestController
@RequestMapping("/api")
public class AppInfoController {

    private final String version;
    private final String commit;

    public AppInfoController(@Value("${app.version}") String version,
                             @Value("${app.commit}") String commit) {
        this.version = version;
        this.commit = commit;
    }

    @GetMapping("/health")
    public String healthCheck() {
        return "HEALTH CHECK OK!";
    }

    @GetMapping("/version")
    public VersionDTO version() {
        return new VersionDTO(version, commit);
    }
}
