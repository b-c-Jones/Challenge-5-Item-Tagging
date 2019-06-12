// Prompt user to login using OAuth2
// Show list of Items owned by logged in user
// on click of item in list, show imput textbox to type tag in
// on clicking button at end of tag textbox, add tag to selected item
// report success or failure of adding tag
// app ID: 2ri89nIJnXGkjf46


require([
  "esri/arcgis/Portal", "esri/arcgis/OAuthInfo", "esri/IdentityManager",
  "dojo/dom-style", "dojo/dom-attr", "dojo/dom", "dojo/on", "dojo/_base/array",
  "dojo/domReady!"
], function (arcgisPortal, OAuthInfo, esriId,
  domStyle, domAttr, dom, on, arrayUtils){
  var info = new OAuthInfo({
    appId: "2ri89nIJnXGkjf46",
    popup: false
  });
  esriId.registerOAuthInfos([info]);

  esriId.checkSignInStatus(info.portalUrl + "/sharing").then(
    function (){
      displayItems();
    }
  ).otherwise(
    function (){
      // Anonymous view
      domStyle.set("loggedOut", "display", "block");
      domStyle.set("loggedIn", "display", "none");
    }
  );

  on(dom.byId("sign-in"), "click", function (){
    // user will be redirected to OAuth Sign In page
    esriId.getCredential(info.portalUrl + "/sharing");
  });

  on(dom.byId("sign-out"), "click", function (){
    esriId.destroyCredentials();
    window.location.reload();
  });

  function displayItems(){
    new arcgisPortal.Portal(info.portalUrl).signIn().then(
      function (portalUser) {
        domAttr.set("userId", "innerHTML", portalUser.fullName);
        domStyle.set("loggedOut", "display", "none");
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
    //See list of valid item types here:  http://www.arcgis.com/apidocs/rest/index.html?itemtypes.html
    //See search reference here:  http://www.arcgis.com/apidocs/rest/index.html?searchreference.html
    var queryParams = {
      q: "owner:" + portalUser.username,
      sortField: "numViews",
      sortOrder: "desc",
      num: 20
    };
    console.log(portal.queryItems(queryParams))
    portal.queryItems(queryParams).then(createGallery);
  }

  function createGallery(items){
    var htmlFragment = "";

    arrayUtils.forEach(items.results, function (item){
      htmlFragment += (
      "<div class=\"esri-item-container\">" +
      (
        item.thumbnailUrl ?
        "<div class=\"esri-image\" style=\"background-image:url(" + item.thumbnailUrl + ");\"></div>" :
          "<div class=\"esri-image esri-null-image\">Thumbnail not available</div>"
      ) +
      (
        item.title ?
        "<div class=\"esri-title\">" + (item.title || "") + "</div>" :
          "<div class=\"esri-title esri-null-title\">Title not available</div>"
      ) +
      "</div>"
      );
    });

    dom.byId("itemGallery").innerHTML = htmlFragment;
  }
});