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
    portal.queryItems(queryParams).then(createGallery);
  }

  function createGallery(items){
    var htmlFragment = "";

    arrayUtils.forEach(items.results, function (item){
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
});
