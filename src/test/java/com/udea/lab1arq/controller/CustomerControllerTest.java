package com.udea.lab1arq.controller;

import com.udea.lab1arq.DTO.CustomerDTO;
import com.udea.lab1arq.exception.CustomerNotFoundException;
import com.udea.lab1arq.exception.GlobalExceptionHandler;
import com.udea.lab1arq.service.CustomerService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class CustomerControllerTest {

    @Mock
    private CustomerService customerService;

    @InjectMocks
    private CustomerController customerController;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(customerController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void getAllCustomersReturnsList() throws Exception {
        when(customerService.getAllCustomers()).thenReturn(List.of(
                new CustomerDTO(1L, "Ana", "Gomez", "1001", 500.0),
                new CustomerDTO(2L, "Luis", "Perez", "1002", 80.0)));

        mockMvc.perform(get("/api/customers"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].accountNumber").value("1001"))
                .andExpect(jsonPath("$[1].firstName").value("Luis"));
    }

    @Test
    void getCustomerByIdReturnsCustomer() throws Exception {
        when(customerService.getCustomerById(1L)).thenReturn(new CustomerDTO(1L, "Ana", "Gomez", "1001", 500.0));

        mockMvc.perform(get("/api/customers/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.balance").value(500.0));
    }

    @Test
    void getCustomerByIdReturnsNotFoundWhenMissing() throws Exception {
        when(customerService.getCustomerById(99L)).thenThrow(new CustomerNotFoundException(99L));

        mockMvc.perform(get("/api/customers/99"))
                .andExpect(status().isNotFound())
                .andExpect(content().string("El cliente con id 99 no existe."));
    }

    @Test
    void createCustomerReturnsCreatedCustomer() throws Exception {
        when(customerService.createCustomer(any(CustomerDTO.class)))
                .thenReturn(new CustomerDTO(3L, "Sara", "Diaz", "1003", 250.0));

        mockMvc.perform(post("/api/customers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"firstName":"Sara","lastName":"Diaz","accountNumber":"1003","balance":250.0}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(3))
                .andExpect(jsonPath("$.accountNumber").value("1003"));
    }

    @Test
    void createCustomerWithoutBalanceReturnsBadRequest() throws Exception {
        mockMvc.perform(post("/api/customers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"firstName":"Sara","lastName":"Diaz","accountNumber":"1003"}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(content().string("Balance cannot be null"));

        verify(customerService, never()).createCustomer(any());
    }

    @Test
    void updateCustomerReturnsUpdatedCustomer() throws Exception {
        when(customerService.updateCustomer(eq(1L), any(CustomerDTO.class)))
                .thenReturn(new CustomerDTO(1L, "Maria", "Gomez", "1001", 500.0));

        mockMvc.perform(put("/api/customers/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"firstName":"Maria"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.firstName").value("Maria"));
    }

    @Test
    void updateCustomerReturnsBadRequestOnValidationError() throws Exception {
        when(customerService.updateCustomer(eq(99L), any(CustomerDTO.class)))
                .thenThrow(new IllegalArgumentException("El cliente con id 99 no existe."));

        mockMvc.perform(put("/api/customers/99")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(content().string("El cliente con id 99 no existe."));
    }

    @Test
    void deleteCustomerReturnsNoContent() throws Exception {
        mockMvc.perform(delete("/api/customers/1"))
                .andExpect(status().isNoContent());

        verify(customerService).deleteCustomer(1L);
    }

    @Test
    void deleteCustomerReturnsBadRequestWhenMissing() throws Exception {
        doThrow(new IllegalArgumentException("El cliente con id 99 no existe."))
                .when(customerService).deleteCustomer(99L);

        mockMvc.perform(delete("/api/customers/99"))
                .andExpect(status().isBadRequest());
    }
}
