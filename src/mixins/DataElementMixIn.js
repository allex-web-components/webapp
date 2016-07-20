(function (allex, module, applib) {
  'use strict';

  var lib = allex.lib,
    BasicAngularController = lib.BasicAngularController,
    WebElement = module.abstractions.WebElement,
    q = lib.q;

    function DataElementMixIn () {
      this.data = null;
    }

    DataElementMixIn.prototype.__cleanUp = function () {
      this.data = null;
    };

    DataElementMixIn.prototype.set_data = function (data) {
      if (this.data === data) return false;
      this.data = data;
      this.$scopectrl.set('data', data);
    };

    DataElementMixIn.addMethods = function (chld) {
      lib.inheritMethods (chld, DataElementMixIn, 'set_data');
    };

    module.mixins.DataElementMixIn = DataElementMixIn;

})(ALLEX, ALLEX.WEB_COMPONENTS.allex_web_webappcomponent, ALLEX.WEB_COMPONENTS.allex_applib);
