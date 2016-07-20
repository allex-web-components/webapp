(function (allex, module, applib, angular_module) {
  'use strict';

  var lib = allex.lib,
    BasicAngularElementController = module.abstractions.BasicAngularElementController,
    BasicAngularElement = module.elements.BasicAngularElement,
    q = lib.q;


  function FormLogic(id, options) {
    BasicAngularElement.call(this, id, options);
    this.submit = new lib.HookCollection();
    this.valid = null;
    this._valid_l = null;
  }

  lib.inherit (FormLogic, BasicAngularElement);
  FormLogic.prototype.__cleanUp = function () {
    if (this._valid_l) this._valid_l.destroy();
    this._valid_l = null;
    this.submit.destroy();
    this.submit = null;
    this.valid = false;
    BasicAngularElement.prototype.__cleanUp.call(this);
  };

  FormLogic.prototype.set_actual = function (val) {
    BasicAngularElement.prototype.set_actual.call(this, val);
  };

  FormLogic.prototype.initialize = function () {
    BasicAngularElement.prototype.initialize.call(this);
    this.$element.attr ({ 'data-allex-form-logic': ''});
    var $form = this.$element.is('form') ? this.$element : this.$element.find('form');
    $form.attr({
      'name': this.get('id'),
      'novalidate': ''});
  };

  FormLogic.prototype.fireSubmit = function () {
    this.submit.fire(this.$scopectrl.data);
  };

  FormLogic.prototype.set_data = function (data) {
    this.$scopectrl.set('data', data);
  };

  FormLogic.prototype.get_data = function () {
    return this.$scopectrl.get('data');
  };

  FormLogic.prototype._onScope = function (ctrl) {
    this._valid_l = ctrl.attachListener('valid', this.set.bind(this, 'valid'));
  };

  FormLogic.prototype.set_valid = function (val) {
    if (this.valid === val) return false;
    console.log('FormLogic will say valid', val);
    this.valid = val;
    return true;
  };

  module.elements.FormLogic = FormLogic;
  applib.registerElementType ('FormLogic', FormLogic);

  function AllexFormLogicController ($scope) {
    BasicAngularElementController.call(this, $scope);
    this.data = {};
    this.valid = false;
    this._watcher = null;
  }
  lib.inherit(AllexFormLogicController, BasicAngularElementController);
  AllexFormLogicController.prototype.__cleanUp = function () {
    if (this._watcher) this._watcher();
    this._watcher = null;
    this.data = null;
    this.valid = null;
    BasicAngularElementController.prototype.__cleanUp.call(this);
  };

  AllexFormLogicController.prototype.elementReady = function ($el) {
    BasicAngularElementController.prototype.elementReady.call(this, $el);
    this._watcher = this.scope.$watch ($el.attr('id')+'.$valid', this.set.bind(this, 'valid'));
  };

  AllexFormLogicController.prototype.set_valid = function (val) {
    if (this.valid === val) return false;
    this.valid = val;
    return true;
  };


  angular_module.controller('allexFormLogicController', ['$scope', function ($scope) {
    new AllexFormLogicController($scope);
  }]);

  angular_module.directive ('allexFormLogic', function () {
    return {
      restrict : 'A',
      scope: true,
      controller : 'allexFormLogicController',
      link : function ($scope, $el, $attribs) {
        $scope._ctrl.elementReady($el);
      }
    };
  });
})(ALLEX, ALLEX.WEB_COMPONENTS.allex_web_webappcomponent, ALLEX.WEB_COMPONENTS.allex_applib, angular.module('allex_applib'));
