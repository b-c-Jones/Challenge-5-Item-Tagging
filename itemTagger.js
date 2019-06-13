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
  "dojo/dom",
  "dojo/on",
  "dojo/_base/array",
  "dojo/domReady!"
], function (arcgisPortal, OAuthInfo, IDManager, request, domStyle, domAttr, dom, on, arrayUtils){
  var info = new OAuthInfo({
    appId: "pkA0skZI1sPjdepJ",
    popup: false
  });
  IDManager.registerOAuthInfos([info]);

  IDManager.checkSignInStatus(info.portalUrl + "/sharing").then(
    function (){
      displayItems();
    }
  ).otherwise(
    IDManager.getCredential(info.portalUrl + "/sharing")
  );

  on(dom.byId("sign-out"), "click", function (){
    IDManager.destroyCredentials();
    window.location.reload();
  });

  function displayItems(){
    new arcgisPortal.Portal(info.portalUrl).signIn().then(
      function (portalUser) {
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
		console.log(item.tags, ":", item.itemUrl);
      htmlFragment += (
      "<input type=\"checkbox\" name=\"listItem\">" +
      (
        item.title ?
          (item.title || "") :
          "Title not available"
      ) +
      "</input> </br>"
      );
    });

    dom.byId("itemList").innerHTML = htmlFragment;
  }
	
	// Info needed to update tags - owner, itemID, token, current tags, tags to add. check tags to add against current tags and remove duplicates.
	var itemID = "8f0b982017be4890a824e90e2b8a0924";
	var owner = "b_Jones";
	var token = "UxVLEVmcCS_OlJPLjnI2yID7eKIwTM60XzbZHEK2MPMdncW_TDIcPYsiERdWZDtpur9LcD3pYPSGp2ClcPqXe62xP5mOsu5Uju4P4PFoWR6YHvn4El9xLmL8LesMD960MF7It0lLWxS4YEwrzTDNfqm1X23fc6r5o5kFHshuVr9B5W-Mp47IFNSgsmKz76-k21YFWfVE2M46C04u7ciARANDR8nCMF_ofisl39YIKtE.";
	var currentTags = ["OAuth","Test","Test2","Test3"];
	var tagsToAdd = ["OAuth","Test","Test4"];
	for (let i = 0; i < tagsToAdd.length; i++) {
			if (currentTags.indexOf(tagsToAdd[i]) === -1) {
				currentTags.push(tagsToAdd[i]);
			}
		};
	var tagUpdate = request({
		url: `https://arcgis.com/sharing/rest/content/users/${owner}/items/${itemID}/update`,
		content: {
			tags: currentTags.join(","),
			clearEmptyFields: true,
			id: itemID,
			f: "json",
			token: token
		}},
		{usePost: true,	
	});
});
