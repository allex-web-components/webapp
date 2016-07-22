(function (allex, module, applib) {
  'use strict';

  var lib = allex.lib,
    WebElement = module.elements.WebElement,
    DataElementMixIn = module.mixins.DataElementMixIn;

  function DataAwareElement (id, options) {
    WebElement.call(this, id, options);
    DataElementMixIn.call(this);
  }
  lib.inherit (DataAwareElement, WebElement);
  DataElementMixIn.addMethods (DataAwareElement);

  DataAwareElement.prototype.__cleanUp = function () {
    DataElementMixIn.prototype.__cleanUp.call(this);
    WebElement.prototype.__cleanUp.call(this);
  };

  module.elements.DataAwareElement = DataAwareElement;
  applib.registerElementType ('DataAwareElement',DataAwareElement);

})(ALLEX, ALLEX.WEB_COMPONENTS.allex_web_webappcomponent, ALLEX.WEB_COMPONENTS.allex_applib);
