package com.udea.lab1arq.exception;

public class CustomerNotFoundException extends RuntimeException {

    public CustomerNotFoundException(Long id) {
        super("El cliente con id " + id + " no existe.");
    }
}
