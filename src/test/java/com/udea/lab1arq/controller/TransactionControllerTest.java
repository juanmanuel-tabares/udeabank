package com.udea.lab1arq.controller;

import com.udea.lab1arq.DTO.TransactionDTO;
import com.udea.lab1arq.service.TransactionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class TransactionControllerTest {

    @Mock
    private TransactionService transactionService;

    @InjectMocks
    private TransactionController transactionController;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(transactionController).build();
    }

    @Test
    void transferMoneyReturnsSavedTransaction() throws Exception {
        when(transactionService.transferMoney(any(TransactionDTO.class)))
                .thenReturn(new TransactionDTO(5L, "1001", "1002", 120.0, LocalDateTime.of(2026, 10, 3, 8, 0)));

        mockMvc.perform(post("/api/transactions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"senderAccountNumber":"1001","receiverAccountNumber":"1002","amount":120.0}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(5))
                .andExpect(jsonPath("$.amount").value(120.0));
    }

    @Test
    void transferMoneyReturnsBadRequestWhenRejected() throws Exception {
        when(transactionService.transferMoney(any(TransactionDTO.class)))
                .thenThrow(new IllegalArgumentException("Saldo insuficiente en la cuenta del remitente."));

        mockMvc.perform(post("/api/transactions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"senderAccountNumber":"1001","receiverAccountNumber":"1002","amount":1.0E9}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(content().string("Saldo insuficiente en la cuenta del remitente."));
    }

    @Test
    void getTransactionsByAccountReturnsHistory() throws Exception {
        LocalDateTime timestamp = LocalDateTime.of(2026, 10, 3, 8, 0);
        when(transactionService.getTransactionsForAccount("1001")).thenReturn(List.of(
                new TransactionDTO(1L, "1001", "1002", 10.0, timestamp),
                new TransactionDTO(2L, "1002", "1001", 4.0, timestamp)));

        mockMvc.perform(get("/api/transactions/1001"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[1].senderAccountNumber").value("1002"));
    }
}
