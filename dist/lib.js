(function (allex, applib) {
  'use strict';
  allex.WEB_COMPONENTS.allex_web_webappcomponent = {
    abstractions : {},
    APP : null,
  };
})(ALLEX, ALLEX.WEB_COMPONENTS.allex_applib);

//samo da te vidim
(function (allex, module, applib) {
  'use strict';

  var lib = allex.lib,
    BasicElement = applib.BasicElement;


  function WebElement (id, options)  {
    BasicElement.call(this, id, options);
  }
  lib.inherit (WebElement, BasicElement);
  WebElement.prototype.__cleanUp = function () {
    BasicElement.prototype.__cleanUp.call(this);
  };


  module.abstractions.WebElement = WebElement;

})(ALLEX, ALLEX.WEB_COMPONENTS.allex_web_webappcomponent, ALLEX.WEB_COMPONENTS.allex_applib);
//samo da te vidim
(function (allex, module, applib) {
  'use strict';

  var lib = allex.lib,
    WebElement = module.abstractions.WebElement;

  function WebPage (id, options){
    WebElement.call(this, id, options);
  }
  lib.inherit (WebPage, WebElement);
  WebPage.prototype.__cleanUp = function () {
    WebElement.prototype.__cleanUp.call(this);
  };

  module.abstractions.WebPage = WebPage;
})(ALLEX, ALLEX.WEB_COMPONENTS.allex_web_webappcomponent, ALLEX.WEB_COMPONENTS.allex_applib);
