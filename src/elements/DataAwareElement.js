(function (allex, module, applib) {
  'use strict';

  var lib = allex.lib,
    WebElement = module.elements.WebElement;

  function DataAwareElement (id, options) {
    WebElement.call(this, id, options);
    this.data = null;
  }
  lib.inherit (DataAwareElement, WebElement);
  DataAwareElement.prototype.__cleanUp = function () {
    this.data = null;
    WebElement.prototype.__cleanUp.call(this);
  };

  DataAwareElement.prototype.set_data = function (val) {
    if (this.data === val) return false;
    this.data = val;
    var dh = this.getConfigVal ('dataHandler');
    if (lib.isFunction(dh)) {
      dh(this.$element, val);
    }
    return true;
  };

  module.elements.DataAwareElement = DataAwareElement;
  applib.registerElementType ('DataAwareElement',DataAwareElement);


})(ALLEX, ALLEX.WEB_COMPONENTS.allex_web_webappcomponent, ALLEX.WEB_COMPONENTS.allex_applib);
