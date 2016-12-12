(function (allex, module, applib, angular_module) {
  'use strict';

  var lib = allex.lib,
    BasicAngularController = lib.BasicAngularController,
    WebElement = module.elements.WebElement,
    DataElementMixIn = module.mixins.DataElementMixIn,
    q = lib.q;

    function BasicAngularElement (id, options) {
      WebElement.call(this, id, options);
      DataElementMixIn.call(this);
      this._addHook('onAngularReady');
      this.$scopectrl = null;
      if (options && options.initialData) this.set('data', options.initialData);
    }
    lib.inherit (BasicAngularElement, WebElement);
    BasicAngularElement.prototype.__cleanUp = function () {
      this.$scopectrl = null;
      DataElementMixIn.prototype.__cleanUp.call(this);
      WebElement.prototype.__cleanUp.call(this);
    };

    BasicAngularElement.prototype.updateHashField = function (name, value) {
      var val = {};
      val[name] = value;
      this.set('data', lib.extend ({}, this.get('data'), val));
    };

    BasicAngularElement.prototype.updateArrayElement = function (index, value) {
      var old = this.get('data'),
        n = old ? old.slice() : [];

      n[index] = value;
      this.set('data', n);
    };

    BasicAngularElement.prototype.getArrayDataCopy = function () {
      var data = this.get('data');
      return data ? data.slice() : null;
    };

    BasicAngularElement.prototype.getHashDataCopy = function () {
      return lib.extend ({}, this.get('data'));
    };

    BasicAngularElement.prototype.set_$scopectrl = function (val) {
      this.$scopectrl = val;
      this._onScope(val);
      this._setRaise();
      this.fireHook('onAngularReady', [this]);
      this.$scopectrl.set('data', this.get('data'));
    };

    BasicAngularElement.prototype.isScopeReady = function () {
      return !!this.$scopectrl;
    };

    BasicAngularElement.prototype.executeOnScopeIfReady = function (method, args) {
      if (!this.$scopectrl) return;
      var fc = lib.readPropertyFromDotDelimitedString (this.$scopectrl, method, true);
      return fc.val.apply(fc.ctx, args);
    };

    BasicAngularElement.prototype._setRaise = function () {
      this.$scopectrl.set('raise', this.raiseEvent.bind(this));
      this.$scopectrl.set('_getResource', this.getResource.bind(this));
    };

    BasicAngularElement.prototype.set_data = function (val) {
      var ret = DataElementMixIn.prototype.set_data.call(this, val);
      if (DataElementMixIn.prototype.hasDataChanged.call(this, ret)){
        this.executeOnScopeIfReady ('set', ['data', this.data]);
      }
      return ret;
    };

    BasicAngularElement.prototype.getMeAsElement = function () {
      return this.$element;
    };

    BasicAngularElement.prototype.initialize = function () {
      WebElement.prototype.initialize.call(this);
      this.$element.data('allex_element', this);
      this.attachHook('onAngularReady', this.getConfigVal('onAngularReady'));
    };

    BasicAngularElement.prototype.$apply = function () {
      if (!this.$scopectrl) return;
      this.$scopectrl.$apply();
    };

    BasicAngularElement.prototype._onScope = lib.dummyFunc;
    module.elements.BasicAngularElement = BasicAngularElement;

})(ALLEX, ALLEX.WEB_COMPONENTS.allex_web_webappcomponent, ALLEX.WEB_COMPONENTS.allex_applib, angular.module('allex_applib'));
