package com.adobe.granite.translation.connector.bootstrap.core;

import org.apache.http.client.methods.CloseableHttpResponse;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.entity.StringEntity;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClients;
import org.apache.http.util.EntityUtils;

import java.io.IOException;

public class HttpUtility {

    private static final String DOMAIN = "http://localhost:8081";

    public String sendGetRequest(String api) throws IOException {
        try (CloseableHttpClient httpClient = HttpClients.createDefault()) {
            HttpGet request = new HttpGet(DOMAIN + api);
            try (CloseableHttpResponse response = httpClient.execute(request)) {
                return EntityUtils.toString(response.getEntity());
            }
        }
    }

    public String sendPostRequest(String api, String jsonBody) throws IOException {
        try (CloseableHttpClient httpClient = HttpClients.createDefault()) {
            HttpPost postRequest = new HttpPost(DOMAIN + api);

            // Set the request body
            StringEntity entity = new StringEntity(jsonBody);
            postRequest.setEntity(entity);
            postRequest.setHeader("Accept", "application/json");
            postRequest.setHeader("Content-type", "application/json");

            // Execute the request
            try (CloseableHttpResponse response = httpClient.execute(postRequest)) {
                return EntityUtils.toString(response.getEntity());
            }
        }
    }
}

