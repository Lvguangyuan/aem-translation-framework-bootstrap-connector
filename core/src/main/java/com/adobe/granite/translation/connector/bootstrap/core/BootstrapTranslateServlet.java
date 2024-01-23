package com.adobe.granite.translation.connector.bootstrap.core;

import com.adobe.granite.translation.api.TranslationConstants;
import com.adobe.granite.translation.bootstrap.tms.core.BootstrapTmsService;
import com.adobe.granite.translation.connector.bootstrap.core.impl.BootstrapTranslationServiceImpl;
import org.apache.felix.scr.annotations.Reference;
import org.apache.felix.scr.annotations.sling.SlingServlet;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.SlingHttpServletResponse;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.api.resource.ValueMap;
import org.apache.sling.api.servlets.SlingAllMethodsServlet;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.jcr.Node;
import javax.jcr.RepositoryException;
import javax.jcr.Session;
import java.io.IOException;

import static org.apache.sling.api.servlets.HttpConstants.METHOD_GET;
import static org.apache.sling.api.servlets.HttpConstants.METHOD_POST;

@SlingServlet(
        metatype = false,
        methods = {METHOD_POST, METHOD_GET},
        selectors = {"bootstrap"},
        extensions = {"translate"},
        resourceTypes = {"cq/gui/components/projects/admin/pod/translationjobpod"}
)
public class BootstrapTranslateServlet extends SlingAllMethodsServlet {
    private static final Logger log = LoggerFactory.getLogger(BootstrapTranslationServiceImpl.class);
    private static final String COMMITTED_FOR_TRANSLATION = TranslationConstants.TranslationStatus.COMMITTED_FOR_TRANSLATION.toString();

    @Reference
    BootstrapTmsService bootstrapTmsService;

    @Override
    protected void doGet(SlingHttpServletRequest request, SlingHttpServletResponse response) throws IOException {
        response.getWriter().write("OK GET");
    }

    @Override
    protected void doPost(SlingHttpServletRequest request, SlingHttpServletResponse response) throws IOException {

        String operation = request.getParameter(":operation");
        String translationJobPath = request.getParameter(":translationJobPath");
//        ValueMap jobMetaData = resourceResolver.getResource(translationJobPath).getValueMap();
//        String translationStatus = jobMetaData.get("translationStatus", "");
//        String translationObjectID = jobMetaData.get("translationObjectID", "");
        updateTranslationJobStatus(request.getResourceResolver(), translationJobPath);
        String strResponseMessage = String.format("{\"success\":%s, \"actionInProgress\": %s, \"featureImplemented\": %s," +
                "\"workflowOperation\": \"%s\", \"errorCode\": \"%s\"}",
                true, true, false, COMMITTED_FOR_TRANSLATION, "");

        response.setContentType("application/json");
        response.getWriter().write(strResponseMessage);
    }

    private boolean updateTranslationJobStatus(ResourceResolver resourceResolver, String translationJobPath) {
        try {
            resourceResolver.getResource(translationJobPath).adaptTo(Node.class).setProperty("translationStatus", COMMITTED_FOR_TRANSLATION);
            resourceResolver.adaptTo(Session.class).save();
            return true;
        } catch (RepositoryException e) {
            log.error("Update Translation Job Status Failed. ", e);
        }
        return false;
    }
}
