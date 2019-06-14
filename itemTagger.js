// Brings user to OAuth login page -- DONE
// Show list of Items owned by logged in user, with checkboxes -- DONE
// on click of item in list, check box -- DONE
// on clicking button at end of tag textbox, add tags to all checked items --
// report success or failure of adding tags --
// app ID: pkA0skZI1sPjdepJ


require([
  "esri/arcgis/Portal",
  "esri/arcgis/OAuthInfo",
  "esri/IdentityManager",
  "esri/request",
  "dojo/dom-style",
  "dojo/dom-attr",
  "dojo/dom-construct",
  "dojo/dom",
  "dojo/on",
  "dojo/_base/array",
  "dojo/domReady!"
], function (arcgisPortal, OAuthInfo, esriId, esriRequest, domStyle, domAttr, domConstruct, dom, on, arrayUtils){
  var owner;
  var listNum = 0;
  
  
  var oAuthInfo = new OAuthInfo({
    appId: "pkA0skZI1sPjdepJ",
    popup: false
  });
  esriId.registerOAuthInfos([oAuthInfo]);

  esriId.checkSignInStatus(oAuthInfo.portalUrl + "/sharing").then(
    function (){
      displayItems();
    }
  ).otherwise(
    esriId.getCredential(oAuthInfo.portalUrl + "/sharing")
  );

  on(dom.byId("sign-out"), "click", function (){
    esriId.destroyCredentials();
    window.location.reload();
  });

  function displayItems(){
    new arcgisPortal.Portal(oAuthInfo.portalUrl).signIn().then(
      function (portalUser) {
        owner = portalUser.username;
        domAttr.set("userId", "innerHTML", portalUser.fullName);
        domStyle.set("loggedIn", "display", "block");
        queryPortal(portalUser);
      }
    ).otherwise(
      function (error){
        console.log("Error occurred while signing in: ", error);
      }
    );
  }

  function queryPortal(portalUser){
    var portal = portalUser.portal;
    console.log(portal)
    var queryParams = {
      q: "owner:" + portalUser.username,
      sortField: "title",
      sortOrder: "asc",
      num: 20
    };
    portal.queryItems(queryParams).then(createList);
  }

  function createList(items){
    var htmlFragment = "";
		console.log(items.results)
    arrayUtils.forEach(items.results, function (item){
      listNum++
		console.log(item.tags, ":", item.itemUrl);
      htmlFragment += (
      `<input type="checkbox" class="listItemTitle" id="listItemTitle${listNum}">` +
      (
        item.title ?
          (item.title || "") :
          "Title not available"
      ) +
      "</input>" + `<span id="listItemId${listNum}">` + `${item.id}` + "</span>" + "</br>"
      );
    });
    dom.byId("itemList").innerHTML = htmlFragment;
  }
  
  var itemsRequest = esriRequest({
    url: `https://www.arcgis.com/sharing/rest/content/items/db63ed4a44e24755abe0154a8376a98d`,
    content: {
      f: "json"
    }
  }).then();

	// Info needed to update tags - owner, itemID, current tags, tags to add. check tags to add against current tags and remove duplicates.
	var itemID = "db63ed4a44e24755abe0154a8376a98d"; // 8f0b982017be4890a824e90e2b8a0924
	var owner = "b_Jones";
	var currentTags = ["OAuth","Test","Test2","Test3"];
	var tagsToAdd = ["OAuth","Test","DontNeedToken"];
	for (let i = 0; i < tagsToAdd.length; i++) {
			if (currentTags.indexOf(tagsToAdd[i]) === -1) {
				currentTags.push(tagsToAdd[i]);
			}
		};
	/*var tagUpdate = esriRequest({
		url: `https://arcgis.com/sharing/rest/content/users/${owner}/items/${itemID}/update`,
		content: {
			tags: currentTags.join(","),
			clearEmptyFields: true,
			id: itemID,
			f: "json"
		}},
		{usePost: true,	
  });*/
  
  on(dom.byId("userList"), "click", function (){
    var itemIdArr = [];
    items = document.getElementsByClassName("listItemTitle");
    for (let i = 1; i <= items.length; i++) {
      if (dom.byId(`listItemTitle${i}`).checked === true) {
        itemIdArr.push(dom.byId(`listItemId${i}`).innerHTML);
      }
    };
    console.log(itemIdArr);
    for (let i = 0; i < itemIdArr.length; i++) {
      console.log(`https://www.arcgis.com/sharing/rest/content/items/${itemIdArr[i]}`);
      var currentTagsRequest = esriRequest({
        url: `https://www.arcgis.com/sharing/rest/content/items/${itemIdArr[i]}`,
        content: {
          f: "json"
        }
    });
    currentTagsRequest.then(
      function(response) {
        console.log(response.title, response.id, response.tags);
        currentTags = response.tags;
        tagsToAdd = dom.byId("textTest").value.split(",");
        for (let i = 0; i < tagsToAdd.length; i++) {
          if (currentTags.indexOf(tagsToAdd[i]) === -1) {
            currentTags.push(tagsToAdd[i]);
          }
        };
        console.log(currentTags, tagsToAdd, response.id);
        var tagUpdate = esriRequest({
          url: `https://arcgis.com/sharing/rest/content/users/${owner}/items/${response.id}/update`,
          content: {
            tags: currentTags.join(","),
            clearEmptyFields: true,
            id: response.id,
            f: "json"
          }},
          {usePost: true,	
        });
        var testDiv = domConstruct.create("div", {innerHTML: `${response.title}, Tags: ${response.tags}`}, tempDiv)
      }, function(error) {
        console.log("Error: ", error.message);
      });
    }
  })
});
