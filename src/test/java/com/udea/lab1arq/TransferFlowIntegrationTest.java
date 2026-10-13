package com.udea.lab1arq;

import com.udea.lab1arq.repository.CustomerRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Recorre el flujo completo (controlador, servicio, mapper y JPA) contra H2.
 */
@SpringBootTest
class TransferFlowIntegrationTest {

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private CustomerRepository customerRepository;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(context).build();
    }

    private void createCustomer(String accountNumber, double balance) throws Exception {
        mockMvc.perform(post("/api/customers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"firstName":"Ana","lastName":"Gomez","accountNumber":"%s","balance":%s}
                                """.formatted(accountNumber, balance)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").isNumber());
    }

    @Test
    void transferUpdatesBalancesAndHistory() throws Exception {
        createCustomer("IT-1001", 1000.0);
        createCustomer("IT-1002", 100.0);

        mockMvc.perform(post("/api/transactions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"senderAccountNumber":"IT-1001","receiverAccountNumber":"IT-1002","amount":250.0}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.amount").value(250.0));

        mockMvc.perform(get("/api/transactions/IT-1002"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].senderAccountNumber").value("IT-1001"));

        assertEquals(750.0, customerRepository.findByAccountNumber("IT-1001").orElseThrow().getBalance());
        assertEquals(350.0, customerRepository.findByAccountNumber("IT-1002").orElseThrow().getBalance());
    }

    @Test
    void versionEndpointExposesConfiguredVersion() throws Exception {
        mockMvc.perform(get("/api/version"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.version").value("test"))
                .andExpect(jsonPath("$.commit").value("test"));
    }
}
