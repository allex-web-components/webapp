(function (allex, module, applib, vektr, $){
  'use strict';

  var lib = allex.lib,
    BasicElement = applib.BasicElement;

  function VektrElement (id, options) {
    BasicElement.call(this, id, options);
    this.data = null;
  }
  lib.inherit (VektrElement, BasicElement);
  VektrElement.prototype.__cleanUp = function () {
    this.data = null;
    BasicElement.prototype.__cleanUp.call(this);
  };

  VektrElement.prototype.dropCaches = function () {
    vektr.helpers.dropCaches();
  };

  module.elements.VektrElement = VektrElement;
  applib.registerElementType('VektrElement', VektrElement);

})(ALLEX, ALLEX.WEB_COMPONENTS.allex_web_webappcomponent, ALLEX.WEB_COMPONENTS.allex_applib, vektr, jQuery);
