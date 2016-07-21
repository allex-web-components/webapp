(function (allex, module, applib, angular_module) {
  'use strict';

  var lib = allex.lib,
    BasicAngularElementController = module.elements.BasicAngularElementController,
    BasicAngularElement = module.elements.BasicAngularElement,
    q = lib.q;


  function FormLogic(id, options) {
    BasicAngularElement.call(this, id, options);
    this.$form = null;
    this.submit = new lib.HookCollection();
    this.valid = null;
    this._valid_l = null;
    this.validfields = {
    };
    this._validfields = {
    };
  }

  lib.inherit (FormLogic, BasicAngularElement);
  FormLogic.prototype.__cleanUp = function () {
    this.validfields = null;
    this.$form = null;
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


    this.$form = this.$element.is('form') ? this.$element : this.$element.find('form');
    this.$form.attr({
      'name': this.get('id'), ///add a name to form, to make angular validation work ....
      'novalidate': ''});     ///prevent browser validation ...
    
    this.$form.find('[name]').toArray().forEach (this._prepareForAngular.bind(this));
    this.appendHiddenFields(this.getConfigVal('hidden_fields'));
  };

  FormLogic.prototype._prepareForAngular = function (el) {
    var $el = jQuery(el),
      name = $el.attr('name');
    ///tanko ti ovo, prijatelju ... form format dozvoljava i hash-ove i nizove ... ovim to nisi pokrio ....
    $el.attr({
      'data-ng-model':'_ctrl.data.'+name,
      'data-allex-angular-validate' : '_ctrl.validation.'+name
    });

    this._validfields[name] = null;
  };

  FormLogic.prototype.appendHiddenFields = function (fields) {
    if (!fields || !fields.length) return;
    fields.forEach (this._appendHiddenField.bind(this));
  };

  FormLogic.prototype._appendHiddenField = function (fieldname_or_record) {
    var name = lib.isString(fieldname_or_record) ? fieldname_or_record : fieldname_or_record.name,
      attrs = {
        name: name,
        type: 'hidden'
      };

    if (!lib.isString(fieldname_or_record)){
      attrs.required = fieldname_or_record.required ? '' : undefined;
    }

    this.findByFieldName(name).remove(); ///remove existing elements whatever they are ...
    var $el = $('<input>').attr(attrs);
    this._prepareForAngular($el);
    this.$form.append ($el);
    this.$form.append($('<span> {{_ctrl.data.'+name+' | json}}</span>'));
  };

  FormLogic.prototype.findByFieldName = function (name) {
    return this.$form.find ('[name="'+name+'"]');
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
    ctrl.set('validation', this.getConfigVal('validation'));
    lib.traverseShallow (this._validfields, this._watchForValid.bind(this, ctrl.scope, this.$form.attr('name')));
  };

  FormLogic.prototype._watchForValid = function (scope, formname, val, key) {
    this._validfields[key] = scope.$watch('_ctrl.data.'+key, this._updateError.bind(this, scope, formname, key));
  };

  FormLogic.prototype._updateError = function (scope, formname, key) {
    var s = lib.extend({}, this.validfields);
    s[key] = !Object.keys(scope[formname][key].$error).length;
    this.set('validfields', s);
  };

  FormLogic.prototype.set_valid = function (val) {
    if (this.valid === val) return false;
    console.log('FormLogic ',this.id,' will say valid', val);
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
    this.validation = null;
  }
  lib.inherit(AllexFormLogicController, BasicAngularElementController);
  AllexFormLogicController.prototype.__cleanUp = function () {
    this.validation = null;
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

  AllexFormLogicController.prototype.validate = function (name, modelValue, viewValue) {
    var validation = this.validation;
    if (!validation) return true;

    if (!validation[name]) return true;
    if (!this.validateJSON(validation[name].json_schema, modelValue)) return false;
    return this.validateFunction (validation[name].custom);
  };


  AllexFormLogicController.prototype.validateJSON = function (schema, value) {
    if (!schema) return true;
    var result = lib.jsonschema.validate(value, schema);
    return !result.errors.length;
  };

  AllexFormLogicController.prototype.validateFunction = function (f, value) {
    if (!lib.isFunction (f)) return true;
    return f(value);
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
