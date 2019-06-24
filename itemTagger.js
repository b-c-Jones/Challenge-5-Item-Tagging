// Brings user to OAuth login page -- DONE
// Show list of Items owned by logged in user, with checkboxes -- DONE
// on click of item in list, check box -- DONE
// on clicking button at end of tag textbox, add tags to all checked items -- DONE
// report success or failure of adding tags -- DONE


require([
  "https://s3-us-west-1.amazonaws.com/patterns.esri.com/files/calcite-web/1.2.5/js/calcite-web.min.js",
  "esri/arcgis/Portal",
  "esri/arcgis/OAuthInfo",
  "esri/IdentityManager",
  "esri/request",
  "dojo/_base/lang",
  "dojo/dom-style",
  "dojo/dom-attr",
  "dojo/dom-construct",
  "dojo/dom",
  "dojo/query",
  "dojo/on",
  "dojo/_base/array",
  "dojo/domReady!"
], function (calcite, arcgisPortal, OAuthInfo, esriId, esriRequest, lang, domStyle, domAttr, domConstruct, dom, query, on, arrayUtils){
  // brings the logged in username and the current number of items to effectively global scope and saves them in vars
  calcite.init();
  var owner;
  var portal;
  var queryStart = 1;
  var htmlFragment = "";
  var currentTags = [];
	var tagsToAdd = [];
  var listNum = 0;
  
  // allows the user to log in with oauth 2.0
  var oAuthInfo = new OAuthInfo({
    appId: "pkA0skZI1sPjdepJ",
    popup: false
  });
  esriId.registerOAuthInfos([oAuthInfo]);
  // checks if the user is currently signed in. If so, display their items. If not, bring them to login page.
  esriId.checkSignInStatus(oAuthInfo.portalUrl + "/sharing").then(
    function (){
      displayItems();
    }
  ).otherwise(
    esriId.getCredential(oAuthInfo.portalUrl + "/sharing")
  );
  // clicking sign out signs you out. this brings you to the sign in page
  on(dom.byId("sign-out"), "click", function (){
    esriId.destroyCredentials();
    window.location.reload();
  });
  // 
  function displayItems(){
    new arcgisPortal.Portal(oAuthInfo.portalUrl).signIn().then(
      // passes in the signed in users info
      function (portalUser) {
        //////console.log("portaluser is", portalUser)
        owner = portalUser.username;
        portal = portalUser.portal;
        domAttr.set("userId", "innerHTML", portalUser.fullName);
        domAttr.set("userFullName", "innerHTML", portalUser.fullName);
        domAttr.set("userName", "innerHTML", portalUser.username);
        htmlFragment = "";
        // run queryPortal function, passing in owner as an argument.
        queryPortal(owner);
      }
    ).otherwise(
      function (error){
        console.log("Error occurred while signing in: ", error);
      }
    );
  }
  // get all of the users items, 100 at a time, then create the list html elements using createList()
  function queryPortal(){
    ////console.log("portal is: " + portal, "owner is: " + owner, "start is: " + queryStart)
    var queryParams = {
      q: `owner:${owner}`,
      sortField: "title",
      sortOrder: "asc",
      num: 100,
      start: queryStart
    };
    portal.queryItems(queryParams).then(createList);
  }
  // create a list of the first 100 items, sorted alphabetically. if there are more items, return to queryPortal()
  function createList(items){
  ////console.log(items.total)
	////console.log(items.results)
    arrayUtils.forEach(items.results, function (item){
      listNum++
      //console.log(item)
	////console.log(item.tags, ":", item.itemUrl);
      htmlFragment += (
      `<input type="checkbox" class="listItem" id="listItem${listNum}" value="${item.id}">
      <label class="block" for="listItem${listNum}"><img src="${item.thumbnailUrl}" /><br>${item.title}</label>
      `
      );
    });
  // only display the full list
    if (items.total >= queryStart + 100) {
      ////console.log(owner)
      queryStart += 100;
      queryPortal()
    } else {
      dom.byId("itemListDiv").innerHTML = htmlFragment;
    }
  }

	// Info needed to update tags - owner, itemID, current tags, tags to add. check tags to add against current tags and remove duplicates.
  // on clicking the addTagsBtn button, empty the results list, then check if there are tags to add and boxes checked. if so, add those tags to the items with checked boxes
  on(dom.byId("addTagsBtn"), "click", function (){
    if (!dom.byId("tagInputBox").value) {
      if (!dom.byId("tagUpdateModal")) {
        _calciteAlert("Updating Tags", 8);
        domConstruct.create("div", { class: "font-size--2", innerHTML: "No tags to add to Items."}, alertText);
      } else {
        domConstruct.create("div", { class: "font-size--2", innerHTML: "No tags to add to Items."}, alertText);
      };
      return
    }
    var itemIdArr = [];
    var items = query(".listItem");
    for (let i = 1; i <= items.length; i++) {
      if (dom.byId(`listItem${i}`).checked === true) {
        itemIdArr.push(dom.byId(`listItem${i}`).value);
      }
    };
    if (itemIdArr.length < 1) {
      if (!dom.byId("tagUpdateModal")) {
        _calciteAlert("Updating Tags", 8);
        domConstruct.create("div", { class: "font-size--2", innerHTML: "Please choose Items to add tags to."}, alertText);
      } else {
        domConstruct.create("div", { class: "font-size--2", innerHTML: "Please choose Items to add tags to."}, alertText);
      };
    };
    // for each item checked off by the user
    for (let i = 0; i < itemIdArr.length; i++) {
      // request that items current tags
      var currentTagsRequest = esriRequest({
        url: `https://www.arcgis.com/sharing/rest/content/items/${itemIdArr[i]}`,
        content: {
          f: "json"
        }
      });
    // then set current tags
    currentTagsRequest.then(
      function(response) {
        //console.log(response.title, response.id, response.tags);
        var currentObj = response;
        currentTags = response.tags;
        tagsToAdd = dom.byId("tagInputBox").value.split(",");
        for (let i = 0; i < tagsToAdd.length; i++) {
          if (currentTags.indexOf(tagsToAdd[i]) === -1) {
            currentTags.push(tagsToAdd[i].trim());
          }
        };
        console.log(currentTags, tagsToAdd, response.id);
        var tagUpdate = esriRequest({
          url: `https://arcgis.com/sharing/rest/content/users/${owner}/items/${response.id}/update`,
          content: {
            tags: currentTags.join(","),
            clearEmptyFields: true,
            id: response.id,
            f: "json",
            timeout: 500
          }},
          {usePost: true
        });
        tagUpdate.then(
          lang.hitch(currentObj, function() {
            if (!dom.byId("tagUpdateModal")) {
              _calciteAlert("Updating Tags", 8);
              domConstruct.create("div", { class: "font-size--2", innerHTML: `Added tags to ${currentObj.title} Succesfully.`, style: "color: #5a9359;" }, alertText);
            } else {
              domConstruct.create("div", { class: "font-size--2", innerHTML: `Added tags to ${currentObj.title} Succesfully.`, style: "color: #5a9359;" }, alertText);
            };
          },
          function() {
            console.log("failure");
            if (!dom.byId("tagUpdateModal")) {
              _calciteAlert("Updating Tags", 8);
              domConstruct.create("div", { class: "font-size--2", innerHTML: `Failed to add tags to ${currentObj.title}.`, style: "color: #de2900;" }, alertText);
            } else {
              domConstruct.create("div", { class: "font-size--2", innerHTML: `Failed to add tags to ${currentObj.title}.`, style: "color: #de2900;" }, alertText);
            };
          })
        )
      }, 
      function(error) {
        if (!dom.byId("tagUpdateModal")) {
          _calciteAlert("Updating Tags", 8);
          domConstruct.create("div", { class: "font-size--2", innerHTML: `Failed to get tags from ${error.title}.`, style: "color: #de2900;" }, alertText);
        } else {
          domConstruct.create("div", { class: "font-size--2", innerHTML: `Failed to get tags from ${error.title}.`, style: "color: #de2900;" }, alertText);
        };
      });
    }
  })

  _calciteAlert = function(title, columns) {
    if (!columns) columns=12;
    var alertOverlay = domConstruct.create("div", { class: "modal-overlay is-active", id: "tagUpdateModal" }, document.body);
    var alertContent = domConstruct.create("div", { class: "modal-content column-"+columns, id: "alertContent", "role":"dialog", "aria-labelledby":"modal" }, alertOverlay);
    domConstruct.create("h5", { class: "trailer-half text-blue", innerHTML: title }, alertContent);
    var alertText = domConstruct.create("div", { id: "alertText", style: "max-height: 60vh; overflow:auto" }, alertContent)
    var alertButtons = domConstruct.create("div", { class: "text-right" }, alertContent);
    var okBtn = domConstruct.create("button", { class: "btn btn-small", innerHTML: "OK" }, alertButtons);
    on(okBtn, "click", function() { dojo.destroy(alertOverlay) });
  }
});
