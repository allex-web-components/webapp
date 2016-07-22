(function (allex, module, applib) {
  'use strict';

  var lib = allex.lib,
    BasicAngularController = lib.BasicAngularController,
    q = lib.q;

    function DataElementMixIn () {
      this.data = null;
    }

    DataElementMixIn.prototype.__cleanUp = function () {
      this.data = null;
    };

    DataElementMixIn.prototype.set_data = function (data) {
      var f = this.getConfigVal('dataHandler');
      if (lib.isFunction(f)) return f(this.$element, data);

      if (this.data === data) return false;
      this.data = data;
      return true;
    };

    DataElementMixIn.prototype.hasDataChanged = function (ret) {
      return lib.isUndef(ret) || ret === true;
    };

    DataElementMixIn.addMethods = function (chld) {
      lib.inheritMethods (chld, DataElementMixIn, 'set_data', 'hasDataChanged');
    };

    module.mixins.DataElementMixIn = DataElementMixIn;

})(ALLEX, ALLEX.WEB_COMPONENTS.allex_web_webappcomponent, ALLEX.WEB_COMPONENTS.allex_applib);
