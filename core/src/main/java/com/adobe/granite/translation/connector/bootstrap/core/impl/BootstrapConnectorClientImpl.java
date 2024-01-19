package com.adobe.granite.translation.connector.bootstrap.core.impl;

import com.adobe.granite.translation.connector.bootstrap.core.BootstrapConnectorClient;
import com.adobe.granite.translation.connector.bootstrap.core.HttpUtility;
import lombok.Getter;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.util.HashMap;

public class BootstrapConnectorClientImpl implements BootstrapConnectorClient {
    private static final Logger log = LoggerFactory.getLogger(BootstrapConnectorClientImpl.class);

    @Getter
    private boolean isLogin = false;
    private String token = "";
    private HttpUtility httpUtility = new HttpUtility();

    private void login() throws IOException {
        httpUtility.sendGetRequest("/login?token=123");
        token = "123";
    }

    @Override
    public String getScopeStatus() {
        try {
            if (StringUtils.isEmpty(token)) {
                login();
            }
            return httpUtility.sendPostRequest("/request-scope", "");
        } catch (IOException e) {
            log.error(e.getLocalizedMessage(), e);
        }
        return "";
    }
}
