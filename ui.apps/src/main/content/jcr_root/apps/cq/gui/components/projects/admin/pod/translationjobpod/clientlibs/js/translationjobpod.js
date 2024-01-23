/*
 * ADOBE CONFIDENTIAL
 *
 * Copyright 2015 Adobe Systems Incorporated
 * All Rights Reserved.
 *
 * NOTICE:  All information contained herein is, and remains
 * the property of Adobe Systems Incorporated and its suppliers,
 * if any.  The intellectual and technical concepts contained
 * herein are proprietary to Adobe Systems Incorporated and its
 * suppliers and may be covered by U.S. and Foreign Patents,
 * patents in process, and are protected by trade secret or copyright law.
 * Dissemination of this information or reproduction of this material
 * is strictly forbidden unless prior written permission is obtained
 * from Adobe Systems Incorporated.
 */
(function(document, Granite, $) {
    "use strict";
    var startButton = '.cq-translation-pod-action-start';
    var cloneButton = '.cq-translation-pod-action-clone';
    var scopeRequestButton = '.cq-translation-pod-action-scope-request';
    var scopeCompleteButton = '.cq-translation-pod-action-scope-complete';
    var cancelButton = '.cq-translation-pod-action-cancel';
    var exportButton = '.cq-translation-pod-action-export';
    var completeButton = '.cq-translation-pod-action-complete';
    var archiveButton = '.cq-translation-pod-action-archive';
    var dueDateButton = '.cq-translation-pod-action-duedate';
    var renameJobButton = '.cq-translation-pod-action-rename';
    var updateTargetButton = '.cq-translation-pod-action-update-target';
    var setTargetButton = '.cq-translation-pod-action-set-target';
    var translationPodLanguageSelect = "translation-job-select-lanaguage";
    var fileInputImportFile = ".fileInputImportFile";
    var dialogUniqueClass = "cq-translation-pod-action-unique-dialog";
    var translationJobPod = ".cq-translation-pod";
    var cqProjectsPod = ".cq-projects-Pod";
    var asyncErrorClose = ".cq-translation-async-error-close";
    var iCurrentModalCount = 1;
    var customActionData = null;
    var redirectClass = "cq-project-translation-job-redirect-link";
    var renameJobOkButton = "cq-projects-translation-job-rename-ok-button";
    var updateTargetOkButton = "cq-projects-translation-job-update-target-ok-button";
    var translationPodDefaultName = "Translation Job";
    var availableLanguages = {};
    var scopeDialog;
    var renameJobDialog;
    var updateTargetDialog;
    var $updateTargetDialog;
    var $renameJobDialog;
    var pages="pages";
    var assets="assets";

    console.log("debug........js loaded.")

    var ui = $(window).adaptTo("foundation-ui");

    function showActionTaken(operationName, buttonClass){
        var successMessage = getSuccessMessage(buttonClass);
        refreshAPIWindow();
        ui.notify(Granite.I18n.get("Action"), successMessage, "success");
    }

    function getSuccessMessage(buttonClass){
        var retVal = "";
        switch(buttonClass){
            case startButton:
                retVal = Granite.I18n.get("Starting translation process...");
                break;
            case cloneButton:
                retVal = Granite.I18n.get("Cloning Translation Job...");
                break;
            case scopeRequestButton:
                retVal = Granite.I18n.get("Requesting Scope. The Translation Job will be updated with Scope information when we get it back from translation vendor");
                break;
            case cancelButton:
                retVal = Granite.I18n.get("Canceling Translation Job request...");
                break;
            case completeButton:
                retVal = Granite.I18n.get("Updated Translation Job status to Complete.");
                break;
            case archiveButton:
                retVal = Granite.I18n.get("Updated Translation Job status to Archive.");
                break;
            case dueDateButton:
                retVal = Granite.I18n.get("Updated Translation Job due date");
                break;
            case renameButton:
                retVal = Granite.I18n.get("Updated Translation Job title");
                break;
        }
        return retVal;
    }

    function getFeatureNotImplementedString(buttonClass){
        var retVal = "";
        switch(buttonClass){
            case scopeRequestButton:
                retVal = Granite.I18n.get("Scope is not supported by Connector");
                break;
            case dueDateButton:
                retVal = Granite.I18n.get("Due date update is not supported by Connector");
                break;
        }
        return retVal;
    }

    function getWorkflowErrorString(strOperation, strErrorCode){
        var strWorkflow ="unknown";
        switch(strOperation){
            case "START_SCOPE_REQUEST":
                strWorkflow = Granite.I18n.get("Scope has already been requested. Waiting for Vendor to finish the process.");
                break;
            case "START_TRANSLATION":
                strWorkflow = Granite.I18n.get("The Job has already been committed for Translation.");
                break;
            case "START_IMPORT":
                strWorkflow = Granite.I18n.get("Import in progress. Please try again later.");
                break;
            case "START_EXPORT":
                strWorkflow = Granite.I18n.get("Export in progress. Please try again later.");
                break;
            case "ARCHIVE_JOB":
                strWorkflow = Granite.I18n.get("The Job is being archived.");
                break;
            case "COMPLETE_JOB":
                strWorkflow = Granite.I18n.get("The Job is being completed.");
                break;
            case "CANCEL_JOB":
                strWorkflow = Granite.I18n.get("The job has already been requested for cancellation.");
                break;
        }
        if(strErrorCode!=null && strErrorCode.length >0){
            switch(strErrorCode){
                case "101_lang_code":
                    strWorkflow = Granite.I18n.get("The Translation Provider doesn't support translation for the selected language pair.");
                    break;
                case "102_due_date":
                    strWorkflow = Granite.I18n.get("Translation job due date can't be after the project due date.");
                    break;

            }
        }
        return strWorkflow;
    }

    function isAttributePresent(buttonObj, strAttributeName){
        var bPresent = false;
        var propertyVal = buttonObj.getAttribute(strAttributeName);
        if(propertyVal!=null && propertyVal.length >0){
            bPresent = true;
        }
        return bPresent;
    }

    function isProjectTargetLanguageCorrect(buttonObj){
        return isAttributePresent(buttonObj,'data-targetLanguage');
    }

    function isLaunchPagePresent(buttonObj){
        return isAttributePresent(buttonObj,'data-launchPresent');
    }

    function isTemporaryAssetPresent(buttonObj){
        return isAttributePresent(buttonObj,'data-temporaryAssetPresent');
    }

    function handleLaunchDialogDone(e, buttonClass, operationName, bDeleteLaunch){
        if(bDeleteLaunch){
            customActionData = [];
            customActionData.push({name:"deleteLaunchPages", value: "true"});
        }
        takeAction(e, buttonClass, operationName, true, false, null);
    }

    function handleLaunchDialog(e, buttonClass, operationName){
        if(isLaunchPagePresent(e.currentTarget) || isTemporaryAssetPresent(e.currentTarget)){
            showLaunchCleanupDialog(e,buttonClass,operationName);
        }
        else{
            takeAction(e, buttonClass, operationName, true, false, null);
        }
    }

    function handleResourceDeleteDialog(e, buttonClass, operationName){
        if(isJobInProgress(e.currentTarget)) {
            showResourceCleanupDialog(e, buttonClass, operationName);
        }
        else {
            takeAction(e, buttonClass, operationName, true, false, null);
        }
    }

    function isJobInProgress(buttonObj){
        return (buttonObj.getAttribute('data-translationstatus')=== "TRANSLATION_IN_PROGRESS");
    }

    function takeBootstrapAction(e, buttonClass, operationName, bRefresh, bCheckForTargetLanguage, waitDialog , successCallbackFn ) {
        e.preventDefault();
        if(bCheckForTargetLanguage && !isProjectTargetLanguageCorrect(e.currentTarget)){
            ui.notify(Granite.I18n.get("Error"), Granite.I18n.get("Please set Project Target Language, and try again."), "error");
            return;
        }
        if(waitDialog == null){
            ui.wait();
        }
        var url = e.currentTarget.getAttribute('data-translationjobpath') + ".bootstrap.translate";
        var translationJobPath = e.currentTarget.getAttribute('data-translationjobpath');
        // var url = "/content/demo/us/en/_jcr_content.bootstrap.translate"

        var data = {
            ":operation" : operationName,
            ":translationJobPath" : translationJobPath
        };
        if(customActionData!=null){
            for(var index=0;index<customActionData.length;index++){
                var obj = customActionData[index];
                data[obj.name] = obj.value;
            }
        }
        var strFeatureNotImplementedMessage = getFeatureNotImplementedString(buttonClass);

        var ajaxOptions = {
            url: url,
            type: "post",
            data: data,
            complete: function(){
                customActionData = null;
                if(waitDialog == null){
                    ui.clearWait();
                }
            },
            success: function(data, status, request) {
                var bFeatureImplemented = true;
                var bSuccess = false;
                var currentOperation = "";
                var strErrorCode = "";
                try{
                    var jsonObj = JSON.parse(data);
                    bFeatureImplemented = jsonObj.featureImplemented;
                    bSuccess = jsonObj.success;
                    if(!bSuccess){
                        currentOperation = jsonObj.workflowOperation;
                        strErrorCode = jsonObj.errorCode;
                    }

                }catch(e){bFeatureImplemented = true;}
                if(bSuccess){
                    if(bFeatureImplemented){
                        if(bRefresh){
                            showActionTaken(operationName, buttonClass);
                        }
                        if(successCallbackFn!=null){
                            successCallbackFn(url);
                        }
                    }
                    else{
                        ui.notify(Granite.I18n.get("Error"), strFeatureNotImplementedMessage, "error");
                    }
                }
                else{
                    var strError = getWorkflowErrorString(currentOperation, strErrorCode);
                    ui.notify(Granite.I18n.get("Error"), strError, "error");
                    if(waitDialog != null){
                        waitDialog.hide();
                    }
                }
            },
            error: function(jqXHR, message, error) {
                if(waitDialog != null){
                    waitDialog.hide();
                }
                ui.notify(Granite.I18n.get("Error"), Granite.I18n.get("Unable to take action"), "error");
            }
        };
        $.ajax(ajaxOptions);
    }

    function takeAction(e, buttonClass, operationName, bRefresh, bCheckForTargetLanguage, waitDialog , successCallbackFn ) {
        e.preventDefault();
        if(bCheckForTargetLanguage && !isProjectTargetLanguageCorrect(e.currentTarget)){
            ui.notify(Granite.I18n.get("Error"), Granite.I18n.get("Please set Project Target Language, and try again."), "error");
            return;
        }
        if(waitDialog == null){
            ui.wait();
        }
        var url = e.currentTarget.getAttribute('data-translationjobpath');

        var data = {
            ":operation" : operationName,
            ":translationJobPath" : url
        };
        if(customActionData!=null){
            for(var index=0;index<customActionData.length;index++){
                var obj = customActionData[index];
                data[obj.name] = obj.value;
            }
        }
        var strFeatureNotImplementedMessage = getFeatureNotImplementedString(buttonClass);

        var ajaxOptions = {
            url: url,
            type: "post",
            data: data,
            complete: function(){
                customActionData = null;
                if(waitDialog == null){
                    ui.clearWait();
                }
            },
            success: function(data, status, request) {
                var bFeatureImplemented = true;
                var bSuccess = false;
                var currentOperation = "";
                var strErrorCode = "";
                try{
                    var jsonObj = JSON.parse(data);
                    bFeatureImplemented = jsonObj.featureImplemented;
                    bSuccess = jsonObj.success;
                    if(!bSuccess){
                        currentOperation = jsonObj.workflowOperation;
                        strErrorCode = jsonObj.errorCode;
                    }

                }catch(e){bFeatureImplemented = true;}
                if(bSuccess){
                    if(bFeatureImplemented){
                        if(bRefresh){
                            showActionTaken(operationName, buttonClass);
                        }
                        if(successCallbackFn!=null){
                            successCallbackFn(url);
                        }
                    }
                    else{
                        ui.notify(Granite.I18n.get("Error"), strFeatureNotImplementedMessage, "error");
                    }
                }
                else{
                    var strError = getWorkflowErrorString(currentOperation, strErrorCode);
                    ui.notify(Granite.I18n.get("Error"), strError, "error");
                    if(waitDialog != null){
                        waitDialog.hide();
                    }
                }
            },
            error: function(jqXHR, message, error) {
                if(waitDialog != null){
                    waitDialog.hide();
                }
                ui.notify(Granite.I18n.get("Error"), Granite.I18n.get("Unable to take action"), "error");
            }
        };
        $.ajax(ajaxOptions);
    }

    function showWait(message) {
        var dialog = new Coral.Dialog().set({
            header: {
                textContent: Granite.I18n.get("Please wait...")
            },
            content: {
                innerHTML: message
            }
        });
        document.body.appendChild(dialog);
        dialog.show();
        return dialog;
    }

    function showLaunchCleanupDialog(event,buttonClass,operationName){
        iCurrentModalCount++;
        var jobItems = getTranslationJobItems(event);
        var dialogMessage = "";
        if (jobItems[pages] > 0) {
            dialogMessage = Granite.I18n.get("This Translation job contains launch pages. Do you want to delete these as well?");
        }
        if (jobItems[assets] > 0) {
            if (jobItems[pages] > 0) {
                dialogMessage = Granite.I18n.get("This Translation job contains launch pages and temporary assets. Do you want to delete these as well?");
            } else {
                dialogMessage = Granite.I18n.get("This Translation job contains temporary assets. Do you want to delete these as well?");
            }
        }
        var dialog = new Coral.Dialog().set({
            header: {
                textContent: Granite.I18n.get("Warning")
            },
            content: {
                textContent: Granite.I18n.getVar(dialogMessage)
            },
            footer: {
                innerHTML: '<button is="coral-button" coral-close>' + Granite.I18n.get("Cancel") + '</button>' +
                         '<button is="coral-button" class="cq-translation-launch-do-not-delete">' + Granite.I18n.get("Do not Delete") + '</button>' +
                         '<button is="coral-button" class="cq-translation-launch-delete" variant="primary">' + Granite.I18n.get("Delete") + '</button>'
            },
            closable: "on"
        });
        dialog.className += ' ' + getUniqueDialogClass(false);
        document.body.appendChild(dialog);

         $(document).on("coral-overlay:beforeopen", getUniqueDialogClass(true), function(e) {
            var $dialog = $(getUniqueDialogClass(true));
            var deleteBtn = $dialog.find(".cq-translation-launch-delete");
            var doNotDeleteBtn = $dialog.find(".cq-translation-launch-do-not-delete");
            $(deleteBtn).on("click", function(e) {
                handleLaunchDialogDone(event,buttonClass,operationName, true);
            });
            $(doNotDeleteBtn).on("click", function(e) {
                handleLaunchDialogDone(event,buttonClass,operationName, false);
            });
        });
        dialog.show();
        return dialog;
    }

    function showResourceCleanupDialog(event,buttonClass,operationName){
        iCurrentModalCount++;
        var jobItems = getTranslationJobItems(event);
        var dialogMessage = "This action will also delete resources for which translation is done or is in Progress. Do you want to continue?";
        var dialog = new Coral.Dialog().set({
            header: {
                textContent: Granite.I18n.get("Warning")
            },
            content: {
                textContent: Granite.I18n.getVar(dialogMessage)
            },
            footer: {
                innerHTML: '<button is="coral-button" coral-close>' + Granite.I18n.get("No") + '</button>' +
                         '<button is="coral-button" class="cq-translation-delete-resources">' + Granite.I18n.get("Yes") + '</button>'
            },
            closable: "on"
        });
        dialog.className += ' ' + getUniqueDialogClass(false);
        document.body.appendChild(dialog);

         $(document).on("coral-overlay:beforeopen", getUniqueDialogClass(true), function(e) {
            var $dialog = $(getUniqueDialogClass(true));
            var yesBtn = $dialog.find(".cq-translation-delete-resources");
            $(yesBtn).on("click", function(e) {
		takeAction(event, buttonClass, operationName, true, false, null);
            });
        });
        dialog.show();
        return dialog;
    }

    function getTranslationJobItems(event) {
        var selectedJobPod = $(event.currentTarget).closest(".cq-projects-CardDashboard");
        var itemsJson = {};
        itemsJson[pages] = getItemCountByType(selectedJobPod, pages);
        itemsJson[assets] = getItemCountByType(selectedJobPod, assets);
        return itemsJson;
    }

    function getItemCountByType(selectedJobPod, resourceType) {
        var element =  $(selectedJobPod.find('.cq-translation-pod-gadget-' + resourceType + '-cell')).closest('tr').find('.cell-status-value');
        return parseInt(element.html());
    }

    function showDownloadDialog(downloadURL){
        var dialog = new Coral.Dialog().set({
            header: {
                textContent: Granite.I18n.get("Export")
            },
            content: {
                innerHTML: '<a target="_blank" href="' + Granite.HTTP.externalize(downloadURL) + '">' + Granite.I18n.get("Download Exported file") + '</a>'
            },
            footer: {
                innerHTML: '<button is="coral-button" coral-close>' + Granite.I18n.get("Close") + '</button>'
            },
            closable: "on"
        });
        document.body.appendChild(dialog);
        dialog.show();
    }

    function getJobStatus(originalURL, callbackFn){
        var url = originalURL + "?operation=GET_CURRENT_ACTION_STATUS&translationJobPath="+originalURL;
        var ajaxOptions = {
            url: url,
            type: "get",
            success: function(json, status, request) {
                try{
                    json.inProgress = "true" == json.inProgress;
                    if(json.inProgress && json.currentAction == "START_EXPORT"){
                        setTimeout(function() {
                            getJobStatus(originalURL, callbackFn);
                        }, 3000);   //call every 2 sec
                    }
                    else if(!json.inProgress){
                        json.url = originalURL;
                        callbackFn(json);
                    }
                }catch(e){
                }
            },
            error: function(jqXHR, message, error) {
                callbackFn(null);
            }
        };
        $.ajax(ajaxOptions);
    }

    function startExportNow(e, exportButton){
        var wait = null;
        if(isProjectTargetLanguageCorrect(e.currentTarget)){
            wait = showWait(Granite.I18n.get("Export in progress..."));
        }

        takeAction(e, exportButton, 'EXPORT', false, true, wait, function(url){
            getJobStatus(url, function(jsonObj){
                wait.hide();
                if(jsonObj && !jsonObj.inProgress && jsonObj.currentAction == "EXPORT_DONE"){
                    var strExportURL = jsonObj.url + "?operation=DOWNLOAD_EXPORTED_FILE&translationJobPath=" + jsonObj.url;
                    showDownloadDialog(strExportURL);
                }
                else{
                    ui.notify(Granite.I18n.get("Error"), Granite.I18n.get("Error while doing export"), "error");
                }
            });
        });

    }

    function getUniqueDialogClass(bAddDot){
        var dueDateString = dialogUniqueClass+iCurrentModalCount;
        if(bAddDot){
            return "."+dueDateString
        }
        return dueDateString;
    }

    function showScopeDialog(jsonObj) {
        var strExtraRows = "";
        var costEstimate = "";
        var detailsLink = "";
        var getRowFn = function (strKey, strValue) {
            return '<div>' +
                '<span class="cq-translation-scope-key">' + strKey + '</span>' +
                '<span>' + strValue + '</span> ' +
                '</div>';
        };
        for (var index = 0; index < jsonObj.scopeMap.keyCount; index++) {
            if (stringStartsWith(jsonObj.scopeMap[index].key, 'TranslationScope:')) {
                if (jsonObj.scopeMap[index].key == 'TranslationScope:CostEstimate') {
                    costEstimate = "<br>" + getRowFn("Cost Estimate", jsonObj.scopeMap[index].value);
                } else if (jsonObj.scopeMap[index].key == 'TranslationScope:DetailsLink') {
                    detailsLink = Granite.HTTP.externalize(jsonObj.scopeMap[index].value);
                }

            } else {
                strExtraRows += getRowFn(jsonObj.scopeMap[index].key, jsonObj.scopeMap[index].value);
            }
        }
        scopeDialog.set({
            content: {
                innerHTML: '<div style="padding: 10px;">' +
                strExtraRows + costEstimate + '</div>'
            }
        });
        if ($.trim(detailsLink)) {
            scopeDialog.set({
                footer: {
                    innerHTML: '<button class=' + redirectClass + ' is="coral-button" ' +
                                'variant="primary" coral-close data-link=' + detailsLink + '>' +
                                Granite.I18n.get("Details") + '</button>' +
                                '<div style="padding: 10px;" align="left">' +
                                Granite.I18n.get('Scope Provided by ') + jsonObj.scopeProvider + '</div>'
                }
            });
        } else {
            scopeDialog.set({
                footer: {
                    innerHTML: '<button is="coral-button" variant="primary" coral-close>' + Granite.I18n.get("Close") + '</button>' +
                    '<div style="padding: 10px;" align="left">' + Granite.I18n.get('Scope Provided by ') + jsonObj.scopeProvider + '</div>'
                }
            });
        }
        scopeDialog.show();
    }

    function openLink(link) {
        if (link) {
            if (stringStartsWith(link, 'http://') || stringStartsWith(link, 'https://')) {
                var host = link.replace('http://', '').replace('https://', '').split('/')[0];
                if (host && host != location.host) {
                    showRedirectionWarning(link);
                    return;
                }
            }
            window.open(link, '_target')
        }
    }

    function showRedirectionWarning(link) {
        ui.prompt("Redirecting", "You will be redirected to an external page:<br><br><b>" + link +
            "</b><br><br>If you trust the site, choose Allow. If you do not trust the site, choose Cancel",
            "warning",
            [{
                text: "Cancel"
            }, {
                text: "Allow",
                warning: true,
                handler: function () {
                    window.open(link, '_target')
                }
            }]);
    }

    function createScopeDialog(){
        if(!scopeDialog) {
            scopeDialog = new Coral.Dialog().set({
                variant: "info",
                closable: "on",
                header: {
                    textContent: Granite.I18n.get("Scope")
                }
            });
            document.body.appendChild(scopeDialog);
            $(scopeDialog).on("click", "." + redirectClass, function (e) {
                openLink($(e.target).closest("button").data("link"));
            });
        }
    }

    function onScopeCompleteClick(event){
        event.preventDefault();
        ui.wait();
        var scopeElement = $(event.currentTarget);
        var get_url = scopeElement.data('translationjobpath') + "?operation=RETURN_SCOPE&translationJobPath="+scopeElement.data('translationjobpath');
        $.ajax({
            url: get_url,
            type: 'GET',
            cache: false,
            success: function(jsonObj, textStatus, jqXHR)
            {
                showScopeDialog(jsonObj);
            },
            error: function(jqXHR, textStatus, errorThrown)
            {
                ui.notify(Granite.I18n.get("Error"), Granite.I18n.get("Unable to get Scope "+ textStatus), "error");
            },
            complete: function()
            {
                ui.clearWait();
            }
        });
    }

    function showDueDateDialog(event){
        iCurrentModalCount++;
        var formData = new FormData();
        var DueDateElement = $(event.currentTarget);
        var upload_url = DueDateElement.data('translationjobpath');
        var dueDate = DueDateElement.data('duedate');
        var dialog = new Coral.Dialog().set({
            closable: "on",
            header: {
                textContent: Granite.I18n.get("Due Date")
            },
            content: {
                innerHTML: '<div style="padding: 10px;" class="coral-InputGroup translation-duedate-picker" data-dueDate="'+dueDate+'">' +
                           '<coral-datepicker type="datetime" min="today" value="' + dueDate + '" displayformat="' + Granite.I18n.get("MMMM DD, YYYY hh:mm a") + '"> </coral-datepicker>' + '</div>'
            },
            footer: {
                innerHTML: '<button is="coral-button" coral-close>' + Granite.I18n.get("Cancel") + '</button>' +
                           '<button is="coral-button" data-translationjobpath="' + upload_url + '" class="cq-translation-due-date-save" variant="primary">' +
                           Granite.I18n.get("Save") + '</button>'
            }
        });
        dialog.className += ' ' + getUniqueDialogClass(false);
        document.body.appendChild(dialog);

        $(document).on("coral-overlay:beforeopen", getUniqueDialogClass(true), function(e) {
            var $modal = $(getUniqueDialogClass(true));
            var saveDueDateButton = $modal.find(".cq-translation-due-date-save");
            moment.locale(Granite.I18n.getLocale());
            $(saveDueDateButton).on("click", function(e) {
                var $dueDatePicker = $modal.find(".translation-duedate-picker > coral-datepicker > input");
                var dateMoment = moment($dueDatePicker[0].value);
                if(dateMoment!=null && dateMoment.isValid()){
                    customActionData = [];
                    customActionData.push({name:"dueDate", value: dateMoment.format('YYYY-MM-DD[T]HH:mm:ss.000Z')});
                    takeAction(e, dueDateButton, 'DUE_DATE', true, false, null);
                }
                else{
                    ui.notify(Granite.I18n.get("Error"), Granite.I18n.get("Unable to save due date "), "error");
                }
            });
        });

        dialog.show();
        return dialog;
    }

    function refreshAPIWindow(){
        //var api = $(".foundation-content").adaptTo("foundation-content");
        //api.refresh();
        // var contentApi = $('.foundation-collection').adaptTo('foundation-collection');
        // contentApi.reload();
        window.location.reload();
    }

    function startFileUpload(event){
        var fileInputImportFileElement = $(event.currentTarget);
        if(!isProjectTargetLanguageCorrect(event.currentTarget)){
            ui.notify(Granite.I18n.get("Error"), Granite.I18n.get("Please set Project Target Language, and try again."), "error");
            return;
        }
        ui.wait();
        var formData = new FormData();
        var upload_url = fileInputImportFileElement.data('translationjobpath');
        formData.append("file", fileInputImportFileElement[0].files[0]);
        formData.append(':operation','IMPORT');
        formData.append(':translationJobPath',upload_url);
        $.ajax({
            url: upload_url,
            type: 'POST',
            data: formData,
            cache: false,
            processData: false, // Don't process the files
            contentType: false, // Set content type to false as jQuery will tell the server its a query string request
            success: function(data, textStatus, jqXHR)
            {
                var bSuccess = false;
                var bInvalidFile = false;
                try{
                    var jsonObj = JSON.parse(data);
                    bSuccess = jsonObj.success;
                    bInvalidFile = "103_invalid_zip" == jsonObj.errorCode;
                }catch(e){}

                if(bSuccess)
                {
                    ui.notify(Granite.I18n.get("Import"), Granite.I18n.get("File uploaded successfully. Import in progress"), "success");
                    refreshAPIWindow();
                }
                else
                {
                    var strError = Granite.I18n.get("Unable to import file");
                    if(bInvalidFile){
                        strError = Granite.I18n.get("Uploaded file is invalid");
                    }
                    ui.notify(Granite.I18n.get("Error"), strError, "error");
                }
            },
            error: function(jqXHR, textStatus, errorThrown)
            {
                ui.notify(Granite.I18n.get("Error"), Granite.I18n.get("Unable to import "+ textStatus), "error");
            },
            complete: function()
            {
                ui.clearWait();
            }
        });
    }

    function isSyncCallAllowed(method, status){
        var bRetVal = false;
        if("HUMAN_TRANSLATION"==method){
            switch(status){
                case "SUBMITTED":
                case "SCOPE_REQUESTED":
                case "COMMITTED_FOR_TRANSLATION":
                case "TRANSLATION_IN_PROGRESS":
                case "TRANSLATED":
                case "REJECTED":
                case "APPROVED":
                case "ERROR_UPDATE":
                    bRetVal = true;
                    break;
            }
        }
        return bRetVal;
    }

    function checkStatusforSpecificBox(box){
        var method = box.data('translationmethod');
        var status = box.data('translationstatus');
        if(isSyncCallAllowed(method, status)){
            var url = box.data('translationjobpath');

            var data = {
                ":operation" : "GET_LATEST_STATUS",
                ":translationJobPath" : url
            };

            var ajaxOptions = {
                url: url,
                type: "post",
                data: data,
                success: function(data, status, request) {
                    var bSuccess = false;
                    try{
                        var jsonObj = JSON.parse(data);
                        bSuccess = jsonObj.success;
                    }catch(e){bFeatureImplemented = true;}
                    if(bSuccess){
                        //we should refresh now
                        refreshAPIWindow();
                    }
                }
            };
            $.ajax(ajaxOptions);
        }
    }

    function checkForLatestStatus(){
        var topBoxArray = $(translationJobPod);
        if(topBoxArray){
            for(var index=0;index< topBoxArray.length; index++){
                var box = topBoxArray[index];
                checkStatusforSpecificBox($(box));
            }
        }
    }

    function clearErrorDescription(event){
        ui.wait();
        var currentElement = $(event.currentTarget);
        var post_url = "/libs/cq/gui/components/projects/admin/translation";

        $.ajax({
            url: post_url,
            type: 'POST',
            cache: false,
            data:{
                operation: "clearError",
                translationJobPath: currentElement.closest(cqProjectsPod).data('path')
            },
            success: function(data, status, request) {
                ui.notify(Granite.I18n.get("Success"), Granite.I18n.get("Error message cleared"), "success");
            },
            error: function(jqXHR, textStatus, errorThrown)
            {
                ui.notify(Granite.I18n.get("Error"), Granite.I18n.get("Unable to clear error"), "error");
                refreshAPIWindow();
            },
            complete: function()
            {
                ui.clearWait();
            }
        });
    }

    function renameJob(jobPath, title){

        var data = {
            "title" : title,
            "_charset_" : "UTF-8",
            ":operation" : "JOB_TITLE",
            ":translationJobPath" : jobPath
        };

        var ajaxOptions = {
            url: jobPath,
            type: "post",
            data: data,
            success: function(data, status, request) {
                var bSuccess = false;
                try{
                    var jsonObj = JSON.parse(data);
                    bSuccess = jsonObj.success;
                }catch(e){}
                if(bSuccess){
                    //we should refresh now
                    refreshAPIWindow();
                    ui.notify(Granite.I18n.get("Success"), Granite.I18n.get("Job renamed"), "success");
                } else {
                    ui.notify(Granite.I18n.get("Error"), Granite.I18n.get("Failed to rename job"), "error");
                }
                ui.clearWait();
            }
        };
        ui.wait();
        $.ajax(ajaxOptions);

    }

    function createRenameJobDialog() {
        if(!renameJobDialog) {
            renameJobDialog = new Coral.Dialog().set({
                closable: "on",
                header: {
                    textContent: Granite.I18n.get("Rename Job")
                },
                content: {
                    innerHTML: '<input is="coral-textfield" placeholder="'+ Granite.I18n.get("Enter job title") +'" name="title" value="" maxlength="28">'
                },
                footer: {
                    innerHTML: '<button is="coral-button" variant="default" coral-close>' + Granite.I18n.get("Cancel") + '</button>' +
                    '<button id=' + renameJobOkButton + ' is="coral-button" variant="primary" coral-close>' + Granite.I18n.get("Done") + '</button>'
                }
            });
            document.body.appendChild(renameJobDialog);
            $renameJobDialog = $(renameJobDialog);
            $renameJobDialog.on("click", "#" + renameJobOkButton, function (e) {
                renameJob(e.currentTarget.getAttribute('data-translationjobpath'), $renameJobDialog.find('[name="title"]').val());
            });
        }
    }

    function handleUpdateLanguage(e) {
        var translationJobPath = e.currentTarget.getAttribute('data-translationjobpath');
        var translationPodLanguage = e.currentTarget.getAttribute('data-targetlanguage');
        var data = {
            "_charset_" : "UTF-8",
            "operation" : "GET_PROJECT_LANGUAGES",
            "translationJobPath" : translationJobPath
        };
        $.ajax({
            url: translationJobPath,
            type: "GET",
            data: data,
            async: false,
            success: function(response) {
                availableLanguages = JSON.stringify(response);
                availableLanguages = JSON.parse(availableLanguages);
                createUpdateTargetDialog (translationJobPath, translationPodLanguage, availableLanguages);
            }
        });
    }

    function setPodLanguageAndTitle(translationjobpath, title, language) {
        var data = {
            "_charset_" : "UTF-8",
            "destinationLanguage": language,
            "title": title,
            ":operation" : "UPDATE_POD_LANGUAGE_AND_TITLE",
            ":translationJobPath" : translationjobpath
        };

        var ajaxOptions = {
            url: translationjobpath,
            type: "post",
            data: data,
            success: function(data, status, request) {
                var bSuccess = false;
                try{
                    var jsonObj = JSON.parse(data);
                    bSuccess = jsonObj.success;
                }catch(e){}
                if(bSuccess){
                    //we should refresh now
                    refreshAPIWindow();
                    ui.notify(Granite.I18n.get("Success"), Granite.I18n.get("Language updated"), "success");
                } else {
                    ui.notify(Granite.I18n.get("Error"), Granite.I18n.get("Failed to update target language"), "error");
                }
                ui.clearWait();
            }
        };
        ui.wait();
        $.ajax(ajaxOptions);
    }
	
    function appendLanguageInJobName(currentEvent) {
        var translationJobPath = currentEvent.currentTarget.getAttribute('data-translationjobpath');
        var currentDestLang = currentEvent.currentTarget.getAttribute('data-targetlanguage');
        var currentTranslationJobName = getCurrentTranslationJobName(translationJobPath);
        if ( currentTranslationJobName === translationPodDefaultName || currentTranslationJobName === getUpdatedJobName(currentDestLang)) {
            var selectedLang = $('#' + translationPodLanguageSelect)[0].value.toUpperCase();
            return getUpdatedJobName(selectedLang);
        }
        else
            return currentTranslationJobName;
    }
	
    function getUpdatedJobName(destinationLanguage) {
        return translationPodDefaultName + " [" + destinationLanguage.toUpperCase() + "]";
    }
	
    function getCurrentTranslationJobName(translationJobPath) {
        var currentTranslationJobName = $(".cq-projects-CardDashboard[data-path='"+translationJobPath+"']").find("h1.cq-projects-CardDashboard-title").text();
        return currentTranslationJobName;
    }

    function createUpdateTargetDialog (translationJobPath, translationPodLanguage, availableLanguages) {
            if (!updateTargetDialog) {

                var select = new Coral.Select().set({
                    name: "destinationLanguage"
                });

                select.set({"id" : translationPodLanguageSelect});
                for (var language in availableLanguages) {
                    select.items.add({
                        content: {
                            innerHTML: Granite.I18n.getVar(availableLanguages[language] + " (" + language + ")")
                        },
                        value: language,
                        disabled: false
                    });
                }

                var cancelButton = new Coral.Button().set({
                    label: {
                        innerHTML: Granite.I18n.get("Cancel")
                    }
                });
                cancelButton.setAttribute('coral-close', '');

                var doneButton = new Coral.Button().set({
                    label: {
                        innerHTML: Granite.I18n.get("Done")
                    },
                    variant: "primary"
                });
                doneButton.setAttribute("id", updateTargetOkButton);
                doneButton.setAttribute("data-translationjobpath", translationJobPath);
                doneButton.setAttribute("data-targetlanguage", translationPodLanguage);
                doneButton.setAttribute('coral-close', '');

                updateTargetDialog = new Coral.Dialog().set({
                    closable: "on",
                    header: {
                        textContent: Granite.I18n.get("Select Target Language")
                    },
                    content: {
                        innerHTML: select.outerHTML
                    }
                });
                updateTargetDialog.footer.append(cancelButton);
                updateTargetDialog.footer.append(doneButton);
                document.body.appendChild(updateTargetDialog);
                $updateTargetDialog = $(updateTargetDialog);
                $updateTargetDialog.on("click", "#" + updateTargetOkButton, function (e) {
                    setPodLanguageAndTitle(e.currentTarget.getAttribute('data-translationjobpath'), appendLanguageInJobName(e), $('#' + translationPodLanguageSelect)[0].value);
                });
            }
            updateTargetDialog.show();
        }

    $(document).on("foundation-contentloaded", function(e) {
        $(startButton).off("click").on("click", function(e) {
            // takeAction(e, startButton, 'START_TRANSLATION', true, true, null);
            takeBootstrapAction(e, startButton, 'START_TRANSLATION', true, true, null);
        });
        $(cloneButton).off("click").on("click", function(e) {
            takeAction(e, cloneButton, 'CLONE_POD', true, true, null);
        });
        $(cancelButton).off("click").on("click", function(e) {
            handleResourceDeleteDialog(e, cancelButton,'CANCEL');
        });
        $(exportButton).off("click").on("click", function(e) {
            startExportNow(e, exportButton);
        });
        $(completeButton).off("click").on("click", function(e) {
            handleLaunchDialog(e, completeButton,'COMPLETE');
        });
        $(scopeRequestButton).off("click").on("click", function(e) {
            takeAction(e, scopeRequestButton, 'SCOPE_REQUESTED', true, true, null);
        });
        $(scopeCompleteButton).off("click").on("click", function(e) {
            onScopeCompleteClick(e);
        });
        $(dueDateButton).off("click").on("click", function(e) {
            showDueDateDialog(e);
        });
        $(archiveButton).off("click").on("click", function(e) {
            handleLaunchDialog(e, archiveButton,'ARCHIVE');
        });
        $(fileInputImportFile).off("change").on("change", function(e) {
            startFileUpload(e);
        });
        $(asyncErrorClose).off("click").on("click",function (e){
            clearErrorDescription(e);
        });
        $(renameJobButton).off("click").on("click",function (e){
            $('#' + renameJobOkButton).attr('data-translationjobpath', e.currentTarget.getAttribute('data-translationjobpath'));
            $renameJobDialog.find('[name="title"]').val("");
            renameJobDialog.show();
        });
        $(updateTargetButton).off("click").on("click",function (e) {
            handleUpdateLanguage(e);
        });
        $(setTargetButton).off("click").on("click",function (e) {
            handleUpdateLanguage(e);
        });
        createScopeDialog();
        createRenameJobDialog();
        checkForLatestStatus();
    });

    function stringStartsWith (string, searchString) {
        return string.slice(0, searchString.length) == searchString;
    }

})(document, Granite, Granite.$);
