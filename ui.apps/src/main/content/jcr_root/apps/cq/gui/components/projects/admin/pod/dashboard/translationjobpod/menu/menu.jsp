<%--
  ADOBE CONFIDENTIAL

  Copyright 2016 Adobe Systems Incorporated
  All Rights Reserved.

  NOTICE:  All information contained herein is, and remains
  the property of Adobe Systems Incorporated and its suppliers,
  if any.  The intellectual and technical concepts contained
  herein are proprietary to Adobe Systems Incorporated and its
  suppliers and may be covered by U.S. and Foreign Patents,
  patents in process, and are protected by trade secret or copyright law.
  Dissemination of this information or reproduction of this material
  is strictly forbidden unless prior written permission is obtained
  from Adobe Systems Incorporated.
--%><%
%><%@page session="false"
          import="com.adobe.cq.projects.api.Project,
                  com.adobe.cq.projects.api.ProjectLink,
                  com.adobe.granite.security.user.UserProperties,
                  com.adobe.granite.security.user.UserPropertiesManager,
                  com.adobe.granite.security.user.UserPropertiesService,
                  com.adobe.granite.translation.api.TranslationConfig,
                  com.day.cq.commons.jcr.JcrConstants,
                  org.apache.commons.lang.StringUtils,
                  org.apache.jackrabbit.api.security.user.Authorizable,
                  org.apache.jackrabbit.api.security.user.UserManager,
                  org.apache.sling.api.resource.Resource,
                  org.apache.sling.api.resource.ValueMap,
                  org.apache.sling.jcr.base.util.AccessControlUtil,
                  org.slf4j.Logger,
                  org.slf4j.LoggerFactory,
                  javax.jcr.RepositoryException,
                  javax.jcr.Session,
                  javax.jcr.security.AccessControlManager,
                  javax.jcr.security.Privilege,
                  java.net.URLEncoder,
                  java.text.SimpleDateFormat,
                  java.util.ArrayList,
                  java.util.Calendar,
                  java.util.HashMap,
                  java.util.Iterator,
                  com.adobe.cq.launches.api.Launch,
                  java.util.Set,
                  org.apache.sling.api.resource.ResourceResolver,
                  org.apache.sling.api.resource.ValueMap,
                  org.apache.sling.commons.json.io.JSONStringer,
                  javax.jcr.Node,
                  javax.jcr.Property,
                  javax.jcr.RepositoryException,
                  com.adobe.cq.projects.api.ProjectMember,
                  com.adobe.cq.projects.api.ProjectMemberRole,
                  com.adobe.granite.ui.components.AttrBuilder,
                  com.adobe.granite.translation.api.TranslationConstants.TranslationStatus,
                  java.util.List" %>
<%!
    private final Logger log = LoggerFactory.getLogger(getClass()); %>
<%
%><%@include file="/libs/granite/ui/global.jsp"%>

<ui:includeClientLib categories="cq.projects.admin.pod,cq.projects.admin.pod.translationprojectsummarypod" />
<%
    Resource parentResource = (Resource) request.getAttribute("projectLinkResource");
    boolean isOwner = false;
    AccessControlManager acm = null;
    try {
        acm = resourceResolver.adaptTo(Session.class).getAccessControlManager();
    } catch (RepositoryException e) {
        log.error("Unable to get access manager", e);
    }

    List<String> permissions = new ArrayList<String>();
    permissions.add("cq-project-admin-actions-open-activator");

    if (hasPermission(acm, parentResource, Privilege.JCR_REMOVE_NODE)) {
        permissions.add("cq-projects-admin-actions-delete-link-activator");
    }
    String projectPath = slingRequest.getRequestPathInfo().getSuffix();
    String popoverName = "translation_popover_" + parentResource.getName();
    String podName = "translation_pod_" + parentResource.getName();
    ValueMap translationPodVM = parentResource.adaptTo(ValueMap.class);
    Resource childPagesResource = parentResource.getChild("child_pages");
    List<Resource> pageList = new ArrayList<Resource>();
    List<Resource> assetList = new ArrayList<Resource>();
    List<Resource> contentFragmentList = new ArrayList<Resource>();
    List<Resource> i18nDictList = new ArrayList<Resource>();
    List<Resource> tagsList = new ArrayList<Resource>();
    boolean canAddNewObjects = false;
    boolean bChildPresent = false;

    if(childPagesResource!=null){

        canAddNewObjects = hasPermission(acm, childPagesResource, Privilege.JCR_ADD_CHILD_NODES);

        Iterator<Resource> childIt = childPagesResource.listChildren();
        if(childIt.hasNext()){
            bChildPresent = true;
        }

        while(childIt.hasNext()) {
            Resource childPage = childIt.next();
            ValueMap childMap = childPage.adaptTo(ValueMap.class);
            String fileType = childMap.get("translationFileType", "");
            if ("PAGE".equals(fileType)) {
                pageList.add(childPage);
            }
            else if ("ASSET".equals(fileType)) {
                assetList.add(childPage);
            }
            else if ("CONTENTFRAGMENT".equals(fileType)) {
                contentFragmentList.add(childPage);
            }
            else if ("I18NDICTIONARY".equals(fileType) || "I18NCOMPONENTSTRINGDICT".equals(fileType)) {
                i18nDictList.add(childPage);
            }
            else if ("TAG".equals(fileType) || "TAG".equals(fileType)) {
                tagsList.add(childPage);
            }
        }
    }
    else{
        canAddNewObjects = hasPermission(acm, parentResource, Privilege.JCR_ADD_CHILD_NODES);
    }

    String ref = request.getPathInfo();

    String translationJobActionsLink = "/libs/cq/core/content/projects/gadgets/translationjobactions.html?item=" + parentResource.getPath() + "&project=" + projectPath;
    String xssActionWizard = request.getContextPath() + translationJobActionsLink;

    ValueMap attributeMap = parentResource.adaptTo(ValueMap.class);
    int cardWeight = attributeMap.get("cardWeight", 0);
    String strCurrentStatus = attributeMap.get("translationStatus", "");

    String xssStatus = strCurrentStatus;
    if("SCOPE_COMPLETED".equals(xssStatus)){
        xssStatus = i18n.get("Scope Completed");
    }
    else if("SCOPE_REQUESTED".equals(xssStatus)){
        xssStatus = i18n.get("Scope Requested");
    }
    else if("COMMITTED_FOR_TRANSLATION".equals(xssStatus)){
        xssStatus = i18n.get("Committed for translation");
    }
    else if("TRANSLATION_IN_PROGRESS".equals(xssStatus)){
        xssStatus = i18n.get("Translation in progress");
    }
    else if("READY_FOR_REVIEW".equals(xssStatus)){
        xssStatus = i18n.get("Ready for review");
    }
    else if("ERROR_UPDATE".equals(xssStatus)){
        xssStatus = i18n.get("Error update");
    }
    else if("UNKNOWN_STATE".equals(xssStatus)){
        xssStatus = i18n.get("Unknown state");
    }
    else if("DRAFT".equals(xssStatus)){
        xssStatus = i18n.get("Draft");
    }
    else if("SUBMITTED".equals(xssStatus)){
        xssStatus = i18n.get("Submitted");
    }
    else if("TRANSLATED".equals(xssStatus)){
        xssStatus = i18n.get("Translated");
    }
    else if("REJECTED".equals(xssStatus)){
        xssStatus = i18n.get("Rejected");
    }
    else if("APPROVED".equals(xssStatus)){
        xssStatus = i18n.get("Approved");
    }
    else if("COMPLETE".equals(xssStatus)){
        xssStatus = i18n.get("Complete");
    }
    else if("CANCEL".equals(xssStatus)){
        xssStatus = i18n.get("Cancel");
    }
    else if("ARCHIVE".equals(xssStatus)){
        xssStatus = i18n.get("Archive");
    }
    else {
        xssStatus = i18n.get("Draft");
    }
    xssStatus = xssAPI.encodeForHTML(xssStatus);

    int pageCnt = pageList.size();
    int assetCnt = assetList.size();
    int contentFragmentCnt = contentFragmentList.size();
    int i18nDictCnt = i18nDictList.size();
    int tagCnt = tagsList.size();
    Calendar jobStartDate = attributeMap.get("dueDate", Calendar.class);
    String xssDueDate=null;
    String calendarDueDateString="";
    String strTranslationMethod = "";
    String strDestinationLanguage = "";
    String strTranslationProvider = "";

    ProjectLink link = parentResource.adaptTo(ProjectLink.class);
    Project project = link.getProject();
    Resource projectResource = project.adaptTo(Resource.class);
    Resource projectContent = projectResource.getChild(JcrConstants.JCR_CONTENT);
    ValueMap projectValueMap = projectResource.adaptTo(ValueMap.class);
    ValueMap projectContentVM = projectContent.adaptTo(ValueMap.class);
    Boolean isMultiLanguageProject = projectContentVM.get("isMultiLanguage", false);
    Calendar startDate = projectContentVM.get("project.dueDate", Calendar.class);
    strTranslationMethod = projectContentVM.get("translationMethod", String.class);
    if (!isMultiLanguageProject) {
        strDestinationLanguage = projectContentVM.get("destinationLanguage", String.class);
    } else {
        strDestinationLanguage = translationPodVM.get("destinationLanguage", String.class);
    }
    strTranslationProvider = projectContentVM.get("translationProvider", String.class);
    if(jobStartDate==null){
        jobStartDate = startDate;
    }
    SimpleDateFormat fmt = new SimpleDateFormat(i18n.get("MMM dd","Used in Translation project dashboard - CQ-37143"), slingRequest.getLocale());
    SimpleDateFormat fmtDueDate = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss");
    if (jobStartDate != null) {
        xssDueDate = xssAPI.filterHTML(fmt.format(jobStartDate.getTime()));
        calendarDueDateString = fmtDueDate.format(jobStartDate.getTime());
    }

    Session userSession = resourceResolver.adaptTo(Session.class);
    String userId = userSession.getUserID();
    if (projectResource != null) {
        Set<ProjectMember> members = project.getMembers();
        for (ProjectMember member : members) {
            if (member.getId().equals(userId)) {
                Set<ProjectMemberRole> roles = member.getRoles();
                for (ProjectMemberRole role : roles) {
                    String roleId = role.getId();
                    if (roleId.equals("owner") ||
                            roleId.equals("translationprojectmanager")
                            || roleId.equals("translationproducer")) {
                        isOwner = true;
                        break;
                    }
                }
                break;
            }
        }
    }


    AttrBuilder attrBuilder = new AttrBuilder(request, xssAPI);
    attrBuilder.addOther("translationjobpath", parentResource.getPath());
    attrBuilder.addOther("targetLanguage", strDestinationLanguage);
    attrBuilder.addOther("duedate", calendarDueDateString);
    attrBuilder.addOther("translationstatus", strCurrentStatus);

    AttrBuilder attrBuilderTranslationContent = new AttrBuilder(request, xssAPI);
    attrBuilderTranslationContent.addOther("translationmethod", strTranslationMethod);
    attrBuilderTranslationContent.addOther("translationstatus", strCurrentStatus);
    attrBuilderTranslationContent.addOther("translationjobpath", parentResource.getPath());

    boolean bShowScopeRequest = false, bShowScopeComplete = false, bShowStart = false, bShowClone = false,
            bShowCancel = false, bShowImport = true, bShowExport = true, bShowDuedate = false, bShowComplete = false,
            bShowArchive = false, bShowRename = true;
    TranslationStatus translationStatus = TranslationStatus.fromString(strCurrentStatus);
    switch (translationStatus) {
        case CANCEL:
            bShowArchive = true;
            bShowClone = true;
            break;
        case COMMITTED_FOR_TRANSLATION:
            bShowCancel = true;
            break;
        case COMPLETE:
            bShowExport = false;
            bShowImport = false;
            bShowArchive = true;
            bShowClone = true;
            break;
        case DRAFT:
            bShowScopeRequest = true;
            bShowStart = true;
            bShowExport = true;
            bShowImport = true;
            bShowDuedate = true;
            break;
        case ERROR_UPDATE:
            bShowClone = true;
            break;
        case READY_FOR_REVIEW:
            if ("MACHINE_TRANSLATION".equals(strTranslationMethod)) {
                bShowComplete = true;
            }
            break;
        case APPROVED:
            bShowComplete = true;
            bShowClone = true;
            break;
        case SCOPE_COMPLETED:
            bShowStart = true;
            bShowDuedate = true;
            break;
        case SUBMITTED:
            bShowStart = true;
            bShowScopeRequest = true;
            break;
        case TRANSLATED:
            bShowComplete = true;
            break;
        case TRANSLATION_IN_PROGRESS:
            bShowCancel = true;
            break;
        case SCOPE_REQUESTED:
            bShowDuedate = true;
            bShowStart = true;
            break;
        case UNKNOWN_STATE:
            bShowClone = true;
        default:
            bShowExport = false;
            bShowImport = false;
            break;
    }
    bShowScopeComplete = attributeMap.get("scopeComplete", false);

    if("MACHINE_TRANSLATION".equals(strTranslationMethod)){
        bShowScopeRequest = false;
        bShowScopeComplete = false;
        bShowImport = false;
        bShowExport = false;
        bShowDuedate = false;
    }
    if(StringUtils.isEmpty(strTranslationProvider)){
        bShowScopeRequest = false;
        bShowScopeComplete = false;
        bShowStart = false;
        bShowDuedate = false;
        bShowCancel = false;
    }

    if(!bChildPresent){
        bShowStart = bShowExport = bShowImport = false;
    }

    if(bShowCancel || bShowComplete || bShowArchive){
        if(isLaunchPresent(resourceResolver,pageList)){
            attrBuilder.addOther("launchPresent", "true");
        }
        if(isTemporaryAssetPresent(resourceResolver,assetList)){
            attrBuilder.addOther("temporaryAssetPresent", "true");
        }
    }


    ValueMap properties = parentResource.adaptTo(ValueMap.class);
    String jobTitle = properties.get(JcrConstants.JCR_TITLE, String.class);
    String strJobPodLink = "/libs/cq/core/content/projects/gadgets/translationjobpodlinks.html" + parentResource.getPath() +
            "?project=" + projectPath+"&translationjob="+parentResource.getPath() + "&targetLanguage="+strDestinationLanguage;
    String jobPodDetailsLink = xssAPI.getValidHref(strJobPodLink);
    String jobName = parentResource.getName();
    String trackingPage = "";
%>

<%if (isOwner && canAddNewObjects) {%>
<% if (bShowScopeRequest){
    trackingPage = getJsonDescription(projectContentVM, "TranslationScopeRequest", "scopeRequestButton",
            pageCnt, assetCnt, contentFragmentCnt , i18nDictCnt ,tagCnt);
%>
<a <%=attrBuilder.build() %> data-foundation-tracking-event="<%= xssAPI.encodeForHTMLAttr(trackingPage) %>"
                             class="translation-pod-action coral--light cq-translation-pod-action-scope-request" >
    <%= i18n.get("Request Scope") %>
</a>
<% } %>
<% if (bShowScopeComplete){ %>
<a <%=attrBuilder.build()%> class="translation-pod-action coral--light cq-translation-pod-action-scope-complete" >
    <%= i18n.get("Show Scope") %>
</a>
<% } %>
<% if (bShowStart && bChildPresent){
    trackingPage = getJsonDescription(projectContentVM, "startTranslation", "startTranslationButton",
            pageCnt, assetCnt, contentFragmentCnt , i18nDictCnt ,tagCnt);
%>
<a <%=attrBuilder.build()%> data-foundation-tracking-event="<%= xssAPI.encodeForHTMLAttr(trackingPage) %>"
                            class="translation-pod-action coral--light cq-translation-pod-action-start">
    <%= i18n.get("Approve Scope") %>
</a>
<% } %>
<% if (bShowClone){
    trackingPage = getJsonDescription(projectContentVM, "startTranslation", "startTranslationButton",
            pageCnt, assetCnt, contentFragmentCnt , i18nDictCnt ,tagCnt);
%>
<a <%=attrBuilder.build()%> data-foundation-tracking-event="<%= xssAPI.encodeForHTMLAttr(trackingPage) %>"
                            class="translation-pod-action coral--light cq-translation-pod-action-clone">
    <%= i18n.get("Clone") %>
</a>
<% } %>
<% if (bShowCancel){ %>
<a <%=attrBuilder.build()%> class="translation-pod-action coral--light cq-translation-pod-action-cancel">
    <%= i18n.get("Cancel") %>
</a>
<% } %>
<% if (bShowImport){ %>
<a <%=attrBuilder.build()%> class="coral-FileUpload-trigger translation-pod-action coral--light cq-translation-pod-action-import-button">
    <%= i18n.get("Import") %>
    <input <%=attrBuilder.build()%> class="fileInputImportFile coral-FileUpload-input" type="file" data-usehtml5="true" data-size-limit="100">
</a>
<% } %>
<% if (bShowExport){
    trackingPage = getJsonDescription(projectContentVM, "exportTranslation", "exportTranslationButton",
            pageCnt, assetCnt, contentFragmentCnt , i18nDictCnt ,tagCnt);

%>
<a <%=attrBuilder.build()%> data-foundation-tracking-event="<%= xssAPI.encodeForHTMLAttr(trackingPage) %>"
                            class="translation-pod-action coral--light cq-translation-pod-action-export">
    <%= i18n.get("Export") %>
</a>
<% } %>
<% if (bShowDuedate){ %>
<a <%=attrBuilder.build()%> class="translation-pod-action coral--light cq-translation-pod-action-duedate">
    <%= i18n.get("Due Date") %>
</a>
<% } %>
<% if (bShowComplete){ %>
<a <%=attrBuilder.build()%> class="translation-pod-action coral--light cq-translation-pod-action-complete">
    <%= i18n.get("Complete") %>
</a>
<% } %>
<% if (bShowArchive){ %>
<a <%=attrBuilder.build()%> class="translation-pod-action coral--light cq-translation-pod-action-archive">
    <%= i18n.get("Archive") %>
</a>
<% } %>
<% if (bShowRename){ %>
<a <%=attrBuilder.build()%> class="translation-pod-action coral--light cq-translation-pod-action-rename">
    <%= i18n.get("Rename") %>
</a>
<% } %>
<% if (isMultiLanguageProject && !bChildPresent){ %>
<a <%=attrBuilder.build()%> class="translation-pod-action coral--light cq-translation-pod-action-update-target">
    <%= i18n.get("Update Target") %>
</a>
<% } %>
<% } %>
<%!
    String getStringAttribute(Resource resource, String strAttributeName, String strDefaultValue) {
        try {
            Node node = resource.adaptTo(Node.class);
            if (node.hasProperty(strAttributeName)) {
                Property property = node.getProperty(strAttributeName);
                if (property != null) {
                    return property.getString();
                }
            }
        } catch (RepositoryException ex) {
        }
        return strDefaultValue;
    }
    String getTranslationObjectSourcePath(Resource resource) {
        String strSourcePath = getStringAttribute(resource,"sourcePath","");
        if (strSourcePath == null) {
            strSourcePath = "";
        }
        return strSourcePath;
    }
    boolean isLaunchPresent(ResourceResolver resourceResolver, List<Resource> pageList){
        boolean bRetVal = false;
        if(pageList!=null){
            for(Resource resource : pageList){
                String strSourcePath = getTranslationObjectSourcePath(resource);
                try{
                    Resource sourceResource = resourceResolver.resolve(strSourcePath);
                    Launch launch = getLaunchFromResource(sourceResource);
                    if(launch!=null){
                        bRetVal = true;
                        break;
                    }
                }catch(Exception e){}
            }
        }
        return bRetVal;
    }
    boolean isTemporaryAssetPresent(ResourceResolver resourceResolver, List<Resource> assetList){
        boolean bRetVal = false;
        if(assetList!=null){
            for(Resource resource : assetList){
                String strSourcePath = getTranslationObjectSourcePath(resource);
                try{
                    Resource sourceResource = resourceResolver.resolve(strSourcePath);
                    Node sourceNode = sourceResource.adaptTo(Node.class);
                    if(isTemporaryAssetNode(sourceNode)){
                        bRetVal = true;
                        break;
                    }
                }catch(Exception e){}
            }
        }
        return bRetVal;
    }
    String CQ_ASSET_TYPE = "dam:Asset";
    String ATTRIBUTE_DESTINATION_LANGUAGE_COPY_PATH = "dam:destinationLanguageCopy";
    boolean isTemporaryAssetNode(Node node) throws RepositoryException {
        if (null != node) {
            if (node.isNodeType(CQ_ASSET_TYPE) && node.hasNode(JcrConstants.JCR_CONTENT)) {
                Node assetContentNode = node.getNode(JcrConstants.JCR_CONTENT);
                if (assetContentNode.hasProperty(ATTRIBUTE_DESTINATION_LANGUAGE_COPY_PATH)) {
                    return true;
                }
            }
        }
        return false;
    }

    Launch getLaunchFromResource(Resource pageResource) {
        Launch retVal = null;
        if (pageResource != null) {
            retVal = pageResource.adaptTo(Launch.class);
            if (retVal == null) {
                retVal = getLaunchFromResource(pageResource.getParent());
            }
        }
        return retVal;
    }

    String getNodeProperty(Node node, String strAttributeName){
        String strValue = "";
        try {
            if(node.hasProperty(strAttributeName)){
                Property prop = node.getProperty(strAttributeName);
                if(prop!=null){
                    strValue = prop.getString();
                }
            }
        } catch (RepositoryException e) {
            // if we have a error then we will return false.
        }
        return strValue;
    }
    boolean hasPermission(AccessControlManager acm, Resource resource, String privilege) {
        try {
            if (acm != null && resource!= null) {
                Privilege p = acm.privilegeFromName(privilege);
                return acm.hasPrivileges(resource.getPath(), new Privilege[]{p});
            }
        } catch (RepositoryException e) {
            // if we have a error then we will return false.
        }
        return false;
    }

    String imageCK(Resource resource) {
        if (resource == null) return "";
        ValueMap metadata = resource.adaptTo(ValueMap.class);
        Calendar cal = metadata.get("jcr:lastModified", Calendar.class);
        if (cal == null) return "";
        return "?ck=" + (cal.getTimeInMillis() / 1000);
    }

    String getJsonDescription(ValueMap projectContentVM, String objectType, String widgetType, int pageCnt,
                              int assetCnt, int contentFragmentCnt ,int i18nDictCnt ,int tagCnt) {
        String retVal = "";
        try {
            JSONStringer jsonStringer = new JSONStringer();
            retVal = jsonStringer.object()
                    .key("feature").value("translation")
                    .key("element").value("translationjobpod")
                    .key("translationPages").value(pageCnt)
                    .key("translationAssets").value(assetCnt)
                    .key("translationContentFragments").value(contentFragmentCnt)
                    .key("translationDictionaries").value(i18nDictCnt)
                    .key("translationTags").value(tagCnt)
                    .key("translationSourceLanguage").value(projectContentVM.get("sourceLanguage"))
                    .key("translationTargetLanguage").value(projectContentVM.get("destinationLanguage"))
                    .key("translationMethod").value(projectContentVM.get("translationMethod"))
                    .key("translationProvider").value(projectContentVM.get("translationProvider"))
                    .key("type").value(objectType)
                    .key("widget").object()
                    .key("name").value("translationjobpod")
                    .key("type").value(widgetType)
                    .endObject()
                    .endObject()
                    .toString();
        } catch (Exception e) {}
        return retVal;
    }
%>
