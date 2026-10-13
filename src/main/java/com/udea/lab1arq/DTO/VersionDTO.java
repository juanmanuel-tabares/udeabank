package com.udea.lab1arq.DTO;

/**
 * Version de la aplicacion y commit de Git con el que se construyo la imagen desplegada.
 */
public record VersionDTO(String version, String commit) {
}
