package com.udea.lab1arq.service;

import com.udea.lab1arq.DTO.CustomerDTO;
import com.udea.lab1arq.entity.Customer;
import com.udea.lab1arq.exception.CustomerNotFoundException;
import com.udea.lab1arq.mapper.CustomerMapper;
import com.udea.lab1arq.repository.CustomerRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mapstruct.factory.Mappers;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CustomerServiceTest {

    @Mock
    private CustomerRepository customerRepository;

    private CustomerService customerService;

    @BeforeEach
    void setUp() {
        // Se usa el mapper real generado por MapStruct para probar tambien el mapeo.
        CustomerMapper customerMapper = Mappers.getMapper(CustomerMapper.class);
        customerService = new CustomerService(customerRepository, customerMapper);
    }

    private static Customer customer(Long id, String accountNumber, double balance) {
        return new Customer(id, accountNumber, "Ana", "Gomez", balance);
    }

    @Test
    void getAllCustomersReturnsMappedDtos() {
        when(customerRepository.findAll()).thenReturn(List.of(
                customer(1L, "1001", 500.0),
                customer(2L, "1002", 800.0)));

        List<CustomerDTO> customers = customerService.getAllCustomers();

        assertEquals(2, customers.size());
        assertEquals("1001", customers.get(0).getAccountNumber());
        assertEquals(800.0, customers.get(1).getBalance());
    }

    @Test
    void getCustomerByIdReturnsCustomerWhenItExists() {
        when(customerRepository.findById(1L)).thenReturn(Optional.of(customer(1L, "1001", 500.0)));

        CustomerDTO dto = customerService.getCustomerById(1L);

        assertEquals(1L, dto.getId());
        assertEquals("Ana", dto.getFirstName());
        assertEquals("Gomez", dto.getLastName());
    }

    @Test
    void getCustomerByIdThrowsWhenCustomerDoesNotExist() {
        when(customerRepository.findById(99L)).thenReturn(Optional.empty());

        CustomerNotFoundException ex = assertThrows(CustomerNotFoundException.class,
                () -> customerService.getCustomerById(99L));
        assertEquals("El cliente con id 99 no existe.", ex.getMessage());
    }

    @Test
    void createCustomerSavesAndReturnsDto() {
        when(customerRepository.save(any(Customer.class))).thenAnswer(invocation -> {
            Customer saved = invocation.getArgument(0);
            saved.setId(10L);
            return saved;
        });
        CustomerDTO request = new CustomerDTO(null, "Luis", "Perez", "2001", 150.0);

        CustomerDTO created = customerService.createCustomer(request);

        assertEquals(10L, created.getId());
        assertEquals("2001", created.getAccountNumber());
        assertEquals(150.0, created.getBalance());
    }

    @Test
    void updateCustomerOnlyOverwritesNonNullFields() {
        Customer existing = customer(1L, "1001", 500.0);
        when(customerRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(customerRepository.save(existing)).thenReturn(existing);
        CustomerDTO changes = new CustomerDTO(null, "Maria", null, null, 900.0);

        CustomerDTO updated = customerService.updateCustomer(1L, changes);

        assertEquals("Maria", updated.getFirstName());
        assertEquals("Gomez", updated.getLastName());
        assertEquals("1001", updated.getAccountNumber());
        assertEquals(900.0, updated.getBalance());
        verify(customerRepository, never()).findByAccountNumber(any());
    }

    @Test
    void updateCustomerChangesAccountNumberWhenItIsFree() {
        Customer existing = customer(1L, "1001", 500.0);
        when(customerRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(customerRepository.findByAccountNumber("3003")).thenReturn(Optional.empty());
        when(customerRepository.save(existing)).thenReturn(existing);
        CustomerDTO changes = new CustomerDTO(null, null, "Lopez", "3003", null);

        CustomerDTO updated = customerService.updateCustomer(1L, changes);

        assertEquals("3003", updated.getAccountNumber());
        assertEquals("Lopez", updated.getLastName());
        assertEquals(500.0, updated.getBalance());
    }

    @Test
    void updateCustomerRejectsAccountNumberOwnedByAnotherCustomer() {
        when(customerRepository.findById(1L)).thenReturn(Optional.of(customer(1L, "1001", 500.0)));
        when(customerRepository.findByAccountNumber("1002")).thenReturn(Optional.of(customer(2L, "1002", 10.0)));
        CustomerDTO changes = new CustomerDTO(null, null, null, "1002", null);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> customerService.updateCustomer(1L, changes));
        assertTrue(ex.getMessage().contains("1002"));
        verify(customerRepository, never()).save(any());
    }

    @Test
    void updateCustomerThrowsWhenCustomerDoesNotExist() {
        when(customerRepository.findById(99L)).thenReturn(Optional.empty());
        CustomerDTO changes = new CustomerDTO();

        assertThrows(IllegalArgumentException.class, () -> customerService.updateCustomer(99L, changes));
    }

    @Test
    void deleteCustomerRemovesExistingCustomer() {
        when(customerRepository.existsById(1L)).thenReturn(true);

        customerService.deleteCustomer(1L);

        verify(customerRepository).deleteById(1L);
    }

    @Test
    void deleteCustomerThrowsWhenCustomerDoesNotExist() {
        when(customerRepository.existsById(99L)).thenReturn(false);

        assertThrows(IllegalArgumentException.class, () -> customerService.deleteCustomer(99L));
        verify(customerRepository, never()).deleteById(any());
    }
}
