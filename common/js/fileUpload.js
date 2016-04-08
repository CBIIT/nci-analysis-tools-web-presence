  var restService = {
        protocol : 'http',
        hostname : document.location.hostname,
        fqn : "nci.nih.gov",
        port : 9090,
  //      route : "LDlinkRest"
        route : ""
  }

  var restServerUrl = '';

  var url = '';
  var fileButtonName = '';
  var uploadButtonName = '';

  function _(e1){
     return document.getElementById(e1);
  }

  function uploadFile(fieldName, buttonName){
    restServerUrl = restService.protocol + "://" + restService.hostname + "/" + restService.route;
    url = restServerUrl;
    fileButtonName = fieldName;
    uploadButtonName = buttonName;
    var file = _(fieldName).files[0];
    if(file.type != 'text/plain' && file.type != 'text/csv'){
       _("status").innerHTML = "File type must be Text or CSV.";
       return;
    }
    var formdata = new FormData();
    formdata.append(fieldName, file);
    var ajax = new XMLHttpRequest();
    ajax.upload.addEventListener("progress", progressHandler, false);
    ajax.addEventListener("load", completeHandler, false);
    ajax.addEventListener("error", errorHandler, false);
    ajax.addEventListener("abort", abortHandler, false);
    ajax.open("POST", url);
    ajax.send(formdata);
    document.getElementById(fileButtonName).disabled = true;
    document.getElementById(uploadButtonName).disabled=true;
   }

  function progressHandler(event){
    _("loaded_n_total").innerHTML="Uploaded " + event.loaded + " bytes of " + event.total;
    var percent = (event.loaded / event.total) * 100;
    _("progressBar").value=  Math.round(percent);
    _("status").innerHTML = Math.round(percent) + "% uploaded... please wait";
  }

  function completeHandler(event){
    _("status").innerHTML = event.target.responseText;
    _("progressBar").value = 0;
    document.getElementById(fileButtonName).disabled = false;
    document.getElementById(uploadButtonName).disabled=false;

  }

  function errorHandler(event){
    _("status").innerHTML = "Upload Failed";
  }
  function abortHandler(event){
    _("status").innerHTML = "Upload Aborted";
  }

