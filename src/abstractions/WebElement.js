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
