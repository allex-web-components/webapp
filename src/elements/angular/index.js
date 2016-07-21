angular.module('allex_applib', []);

(function (allex, module, applib, angular_module) {
  'use strict';

  var lib = allex.lib, 
    BasicAngularController = lib.BasicAngularController;


  function BasicAngularElementController ($scope) {
    BasicAngularController.call(this, $scope);
  }
  lib.inherit (BasicAngularElementController, BasicAngularController);
  BasicAngularElementController.prototype.__cleanUp = function () {
    BasicAngularController.prototype.__cleanUp.call(this);
  };

  BasicAngularElementController.prototype.elementReady = function ($el) {
    var elc = $el.data('allex_element');
    if (!elc) throw new Error('Missing allex element ...');
    elc.set('$scopectrl', this);
  };

  function AngularDataAwareController ($scope) {
    BasicAngularElementController.call(this,$scope);
    this.data = null;
  }
  lib.inherit(AngularDataAwareController, BasicAngularElementController);
  AngularDataAwareController.prototype.__cleanUp = function () {
    this.data = null;
    BasicAngularElementController.prototype.__cleanUp.call(this);
  };

  AngularDataAwareController.prototype.set_data = function (data) {
    if (this.data === data) return false;
    this.data = data;
    return true;
  };


  module.elements.AngularDataAwareController = AngularDataAwareController;
  module.elements.BasicAngularElementController = BasicAngularElementController;
})(ALLEX, ALLEX.WEB_COMPONENTS.allex_web_webappcomponent, ALLEX.WEB_COMPONENTS.allex_applib, angular.module('allex_applib'));
