package com.udea.lab1arq.service;

import com.udea.lab1arq.DTO.TransactionDTO;
import com.udea.lab1arq.entity.Customer;
import com.udea.lab1arq.entity.Transaction;
import com.udea.lab1arq.repository.CustomerRepository;
import com.udea.lab1arq.repository.TransactionRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TransactionServiceTest {

    @Mock
    private TransactionRepository transactionRepository;

    @Mock
    private CustomerRepository customerRepository;

    @InjectMocks
    private TransactionService transactionService;

    private static Customer customer(String accountNumber, double balance) {
        // Customer.equals compara por id, asi que cada cliente necesita uno distinto.
        return new Customer(Long.parseLong(accountNumber), accountNumber, "Ana", "Gomez", balance);
    }

    private static TransactionDTO request(String sender, String receiver, Double amount) {
        return new TransactionDTO(null, sender, receiver, amount, null);
    }

    private void stubAccounts(Customer sender, Customer receiver) {
        when(customerRepository.findByAccountNumber(sender.getAccountNumber())).thenReturn(Optional.of(sender));
        when(customerRepository.findByAccountNumber(receiver.getAccountNumber())).thenReturn(Optional.of(receiver));
    }

    @Test
    void transferMoneyMovesBalanceAndSavesTransaction() {
        Customer sender = customer("1001", 1000.0);
        Customer receiver = customer("1002", 500.0);
        stubAccounts(sender, receiver);
        when(transactionRepository.save(any(Transaction.class))).thenAnswer(invocation -> {
            Transaction saved = invocation.getArgument(0);
            saved.setId(7L);
            return saved;
        });

        TransactionDTO result = transactionService.transferMoney(request("1001", "1002", 200.0));

        assertEquals(800.0, sender.getBalance());
        assertEquals(700.0, receiver.getBalance());
        verify(customerRepository).save(sender);
        verify(customerRepository).save(receiver);
        assertEquals(7L, result.getId());
        assertEquals("1001", result.getSenderAccountNumber());
        assertEquals("1002", result.getReceiverAccountNumber());
        assertEquals(200.0, result.getAmount());
        assertNotNull(result.getTimestamp());
    }

    @Test
    void transferMoneyKeepsTimestampSentByClient() {
        stubAccounts(customer("1001", 1000.0), customer("1002", 0.0));
        when(transactionRepository.save(any(Transaction.class))).thenAnswer(invocation -> invocation.getArgument(0));
        LocalDateTime timestamp = LocalDateTime.of(2026, 10, 1, 9, 30);
        TransactionDTO dto = request("1001", "1002", 50.0);
        dto.setTimestamp(timestamp);

        transactionService.transferMoney(dto);

        ArgumentCaptor<Transaction> captor = ArgumentCaptor.forClass(Transaction.class);
        verify(transactionRepository).save(captor.capture());
        assertEquals(timestamp, captor.getValue().getTimestamp());
    }

    @Test
    void transferMoneyRequiresBothAccountNumbers() {
        TransactionDTO dto = request(null, "1002", 10.0);

        assertThrows(IllegalArgumentException.class, () -> transactionService.transferMoney(dto));
        verifyNoInteractions(customerRepository, transactionRepository);
    }

    @Test
    void transferMoneyFailsWhenSenderDoesNotExist() {
        when(customerRepository.findByAccountNumber("9999")).thenReturn(Optional.empty());
        TransactionDTO dto = request("9999", "1002", 10.0);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> transactionService.transferMoney(dto));
        assertEquals("La cuenta del remitente no existe.", ex.getMessage());
    }

    @Test
    void transferMoneyFailsWhenReceiverDoesNotExist() {
        when(customerRepository.findByAccountNumber("1001")).thenReturn(Optional.of(customer("1001", 100.0)));
        when(customerRepository.findByAccountNumber("9999")).thenReturn(Optional.empty());
        TransactionDTO dto = request("1001", "9999", 10.0);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> transactionService.transferMoney(dto));
        assertEquals("La cuenta del receptor no existe.", ex.getMessage());
    }

    @ParameterizedTest
    @NullSource
    @ValueSource(doubles = {0.0, -25.0})
    void transferMoneyRejectsNonPositiveAmounts(Double amount) {
        stubAccounts(customer("1001", 1000.0), customer("1002", 0.0));
        TransactionDTO dto = request("1001", "1002", amount);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> transactionService.transferMoney(dto));
        assertEquals("El monto debe ser mayor que cero.", ex.getMessage());
        verify(transactionRepository, never()).save(any());
    }

    @Test
    void transferMoneyRejectsSameSourceAndDestination() {
        when(customerRepository.findByAccountNumber("1001")).thenReturn(Optional.of(customer("1001", 1000.0)));
        TransactionDTO dto = request("1001", "1001", 10.0);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> transactionService.transferMoney(dto));
        assertEquals("La cuenta de origen y la de destino deben ser diferentes.", ex.getMessage());
    }

    @Test
    void transferMoneyRejectsInsufficientBalance() {
        Customer sender = customer("1001", 30.0);
        Customer receiver = customer("1002", 0.0);
        stubAccounts(sender, receiver);
        TransactionDTO dto = request("1001", "1002", 50.0);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> transactionService.transferMoney(dto));
        assertEquals("Saldo insuficiente en la cuenta del remitente.", ex.getMessage());
        assertEquals(30.0, sender.getBalance());
        verify(customerRepository, never()).save(any());
    }

    @Test
    void getTransactionsForAccountMapsEntitiesToDtos() {
        LocalDateTime timestamp = LocalDateTime.of(2026, 10, 2, 14, 0);
        when(transactionRepository.findBySenderAccountNumberOrReceiverAccountNumber("1001", "1001"))
                .thenReturn(List.of(
                        new Transaction(1L, "1001", "1002", 20.0, timestamp),
                        new Transaction(2L, "1003", "1001", 5.0, timestamp)));

        List<TransactionDTO> history = transactionService.getTransactionsForAccount("1001");

        assertEquals(2, history.size());
        assertEquals(1L, history.get(0).getId());
        assertEquals("1002", history.get(0).getReceiverAccountNumber());
        assertEquals("1003", history.get(1).getSenderAccountNumber());
        assertEquals(5.0, history.get(1).getAmount());
        assertEquals(timestamp, history.get(1).getTimestamp());
    }
}
