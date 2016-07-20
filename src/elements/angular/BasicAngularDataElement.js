(function (allex, module, applib, angular_module) {
  'use strict';

  var lib = allex.lib,
    BasicAngularController = lib.BasicAngularController,
    BasicAngularElement = module.elements.BasicAngularElement,
    DataElementMixIn = module.mixins.DataElementMixIn,
    q = lib.q;

    function BasicAngularDataElement (id, options) {
      BasicAngularElement.call(this, id, options);
      DataElementMixIn.call(this);
    }
    lib.inherit (BasicAngularDataElement, BasicAngularElement);
    DataElementMixIn.addMethods (BasicAngularDataElement);


    BasicAngularDataElement.prototype.__cleanUp = function () {
      BasicAngularElement.prototype.__cleanUp.call(this);
    };

    BasicAngularDataElement.prototype.initialize = function () {
      BasicAngularElement.prototype.initialize.call(this);
      DataElementMixIn.prototype.initialize.call(this);
    };

    BasicAngularDataElement.prototype.set_$scopectrl = function (val) {
      BasicAngularElement.prototype.set_$scopectrl.call(this, val);
      if (!this.$scopectrl) return;
      this._onScope(val);

      this.$scopectrl.set('data', this.data);
    };

    BasicAngularDataElement.prototype._onScope = lib.dummyFunc;

    BasicAngularDataElement.prototype.set_data = function (val) {
      DataElementMixIn.prototype.set_data.call(this, val);
      if (!this.scopectrl) return;

      this.$scopectrl.set('data', this.data);
    };


    module.elements.BasicAngularElement = BasicAngularElement;

})(ALLEX, ALLEX.WEB_COMPONENTS.allex_web_webappcomponent, ALLEX.WEB_COMPONENTS.allex_applib, angular.module('allex_applib'));
