(function (allex, module, applib, angular_module) {
  'use strict';

  ///MIND THE FACT that form name should not contain - in their name ... for example form-bla will not work ... inspect that ...

  var lib = allex.lib,
    BasicAngularElementController = module.elements.BasicAngularElementController,
    BasicAngularElement = module.elements.BasicAngularElement,
    q = lib.q,
    BasicModifier = applib.BasicModifier,
    BRACKET_END = /\[\]$/;


  function AngularFormLogic(id, options) {
    BasicAngularElement.call(this, id, options);
    this.$form = null;
    this.submit = new lib.HookCollection();
    this.valid = null;
    this._valid_l = null;
    this.validfields = {}; 
    this._validfields_l = {};
    this._default_values = {};
    this.change = new lib.HookCollection();
    this.initial = options ? options.initial : null;
    this.ftion_status = null;
    this.progress = null;
    this.array_keys = options ? options.array_keys : null;
  }

  lib.inherit (AngularFormLogic, BasicAngularElement);
  AngularFormLogic.prototype.__cleanUp = function () {
    this.progress = null;
    this.ftion_status = null;
    this.array_keys = null;
    this.initial = null;
    this.change.destroy();
    this.change = null;
    this._default_values = null;
    lib.traverseShallow(this._validfields_l, this._unlisten.bind(this));
    this.validfields = null;
    this.$form = null;
    if (this._valid_l) this._valid_l.destroy();
    this._valid_l = null;
    this.submit.destroy();
    this.submit = null;
    this.valid = false;
    BasicAngularElement.prototype.__cleanUp.call(this);
  };

  AngularFormLogic.prototype.set_ftion_status = function (val) {
    var was_active = false;
    if (val) {
      if (this.ftion_status) {
        was_active = this.ftion_status.working && val.result;
      }else{
        if (val.result){
          was_active = true;
        }
      }
    }


    this.ftion_status = val;
    var closeOnSuccess = this.getConfigVal('closeOnSuccess');
    console.log('was active?', was_active, closeOnSuccess);
    if (this.$scopectrl && was_active && (true === closeOnSuccess || lib.isNumber(closeOnSuccess))) {
      this.doCloseOnSuccess(closeOnSuccess);
    }


    if (!this.$scopectrl) return;
    this.$scopectrl.set('ftion_status', val);
  };

  AngularFormLogic.prototype.doCloseOnSuccess = function (val) {
    if (true === val) val = 0;
    this.$scopectrl.set('disabled', false);
    lib.runNext (this.set.bind(this, 'actual', false), val);
  };

  AngularFormLogic.prototype.set_progress = function (val) {
    this.progress = val;
    if (!this.$scopectrl) return;
    this.$scopectrl.set('progress', val);
  };

  AngularFormLogic.prototype._unlisten = function (f) {
    if (lib.isFunction (f)) f();
  };

  AngularFormLogic.prototype.set_actual = function (val) {
    BasicAngularElement.prototype.set_actual.call(this, val);
    //reset ftion_status and progress on every actual change
    this.set('ftion_status', null);
    this.set('progress', null);
    if (this.$scopectrl) {
      this.$scopectrl.set ('disabled', !val);
    }
  };

  AngularFormLogic.prototype.initialize = function () {
    BasicAngularElement.prototype.initialize.call(this);
    this.$element.attr ({ 'data-allex-angular-form-logic': ''});


    this.$form = this.$element.is('form') ? this.$element : this.$element.find('form');
    this.$form.attr({
      'name': this.get('id'), ///add a name to form, to make angular validation work ....
      'novalidate': ''     ///prevent browser validation ...
    });
    this.$form.removeAttr ('action'); //in order to avoid some refresh or so ...
    this.$form.find('[name]').toArray().forEach (this._prepareForAngular.bind(this));
    this.appendHiddenFields(this.getConfigVal('hidden_fields'));
  };

  AngularFormLogic.prototype._prepareForAngular = function (el) {
    var $el = jQuery(el),
      name = $el.attr('name'),
      model_name = this.getModelName(name);

    var old_read_only = $el.attr('data-ng-readonly'),
      new_read_only = old_read_only && old_read_only.length ? '('+old_read_only+') ||' : '';

    new_read_only += '(_ctrl.disabled || _ctrl.progress)';

    $el.attr({
      'data-allex-angular-validate' : '_ctrl.validation.'+model_name,
      'data-ng-change' : '_ctrl.onChange(\''+model_name+'\', _ctrl.data.'+model_name+')',
      'data-ng-readonly' : new_read_only
    });

    if (!$el.attr('data-ng-model') && !$el.attr('ng-model')) {
      $el.attr('data-ng-model', '_ctrl.data.'+model_name);
    }

    this._validfields_l[model_name] = null;
  };

  AngularFormLogic.prototype.appendHiddenFields = function (fields) {
    if (!fields || !fields.length) return;
    fields.forEach (this._appendHiddenField.bind(this));
  };

  AngularFormLogic.prototype._appendHiddenField = function (fieldname_or_record) {
    var name = lib.isString(fieldname_or_record) ? fieldname_or_record : fieldname_or_record.name,
      attrs = {
        name: name,
        type: 'hidden',
      },
      is_hash = !lib.isString(fieldname_or_record);

    if (is_hash){
      attrs.required = fieldname_or_record.required ? '' : undefined;
      if ('value' in fieldname_or_record) {
        this._default_values[name] = fieldname_or_record.value;
      }
    }

    this.findByFieldName(name).remove(); ///remove existing elements whatever they are ...
    var $el = $('<input>').attr(attrs);
    this._prepareForAngular($el);
    this.$form.append ($el);
    //this.$form.append($('<span> {{_ctrl.data.'+name+' | json}}</span>'));
  };

  AngularFormLogic.prototype.findByFieldName = function (name) {
    return this.$form.find ('[name="'+name+'"]');
  };

  AngularFormLogic.prototype.toArray = function (keys) {
    return lib.hashToArray(keys, this.get('data'));
  };

  AngularFormLogic.prototype.fireSubmit = function () {
    this.submit.fire(this.array_keys ? this.toArray(this.array_keys) : this.$scopectrl.data);
  };

  function setDefaultVals (data, value, key) {
    if (key in data) return;
    data[key] = value;
  }

  AngularFormLogic.prototype.set_data = function (data) {
    lib.traverseShallow (this._default_values, setDefaultVals.bind(null, data));
    this.$scopectrl.set('data', data);
  };

  AngularFormLogic.prototype.get_data = function () {
    return this.$scopectrl ? this.$scopectrl.get('data') : null;
  };

  AngularFormLogic.prototype.getModelName = function (name) {
    var model_name = name;
    if(name.match (BRACKET_END)){
      model_name = name.replace(BRACKET_END, '');
    }
    return model_name;
  };

  AngularFormLogic.prototype._onScope = function (ctrl) {
    this._valid_l = ctrl.attachListener('valid', this.set.bind(this, 'valid'));
    ctrl.set('validation', this.getConfigVal('validation'));
    ctrl.set('_onChange', this._onChanged.bind(this));
    lib.traverseShallow (this._validfields_l, this._watchForValid.bind(this, ctrl.scope, this.$form.attr('name')));
    ctrl.set('config', this.getConfigVal('form'));
    ctrl.set('progress', this.get('progress'));
    ctrl.set('ftion_status', this.get('ftion_status'));
    ctrl.set('disabled', !this.get('actual'));
    if (this.initial) lib.runNext(this._setInitial.bind(this));
  };

  AngularFormLogic.prototype._onChanged = function (data, field, name) {
    this.changed.fire('data', data);
    this.change.fire(field, name);
  };

  AngularFormLogic.prototype._setInitial = function (ext) {

    this.set('data', lib.extend ({}, this.initial, ext));
    for (var i in this.initial) {
      this.change.fire(i, this.initial[i]);
    }
  };

  AngularFormLogic.prototype.resetElement = function (ext) {
    BasicAngularElement.prototype.resetElement.call(this, ext);
    this.resetForm(ext);
  };

  AngularFormLogic.prototype.resetForm = function (ext) {
    this._setInitial(ext);
  };

  AngularFormLogic.prototype._watchForValid = function (scope, formname, val, key) {
    this._validfields_l[key] = scope.$watch('_ctrl.data.'+key, this._updateError.bind(this, scope, formname, key));
  };
  AngularFormLogic.prototype._updateError = function (scope, formname, key) {
    var s = lib.extend({}, this.validfields);
    if (!scope[formname][key]){
      console.warn ('no '+key+' in validator');
      return;
    }
    s[key] = !Object.keys(scope[formname][key].$error).length;
    this.set('validfields', s);
  };

  AngularFormLogic.prototype.set_valid = function (val) {
    if (this.valid === val) return false;
    //console.log('AngularFormLogic ',this.id,' will say valid', val);
    this.valid = val;
    return true;
  };

  AngularFormLogic.prototype.empty = function () {
    this.set('data', {});
  };

  AngularFormLogic.prototype.setInputEnabled = function (fieldname, enabled) {
    ///TODO: this does not work ....
    this.$form.find('[name="'+fieldname+'"]').attr('data-ng-disabled', enabled ? "false" : "true");
    this.$scopectrl.$apply();
  };

  AngularFormLogic.prototype.disableInput = function (fieldname) {
    this.setInputEnabled(fieldname, false);
  };

  AngularFormLogic.prototype.enableInput = function (fieldname) {
    this.setInputEnabled(fieldname, true);
  };


  module.elements.AngularFormLogic = AngularFormLogic;
  applib.registerElementType ('AngularFormLogic', AngularFormLogic);

  function AllexAngularFormLogicController ($scope) {
    BasicAngularElementController.call(this, $scope);
    this.data = {};
    this.valid = false;
    this._watcher = null;
    this.validation = null;
    this._onChange = null;
    this.config = null;
    this.progress = null;
    this.ftion_status = null;
    this.disabled = false;
  }
  lib.inherit(AllexAngularFormLogicController, BasicAngularElementController);
  AllexAngularFormLogicController.prototype.__cleanUp = function () {
    this.disabled = null;
    this.ftion_status = null;
    this.progress = null;
    this.validation = null;
    if (this._watcher) this._watcher();
    this._watcher = null;
    this.data = null;
    this.valid = null;
    this._onChange = null;
    this.config = null;
    BasicAngularElementController.prototype.__cleanUp.call(this);
  };

  AllexAngularFormLogicController.prototype.onChange = function (name, val){
    if (lib.isFunction(this._onChange)) this._onChange(this.data, name, val);
  };

  AllexAngularFormLogicController.prototype.elementReady = function ($el) {
    BasicAngularElementController.prototype.elementReady.call(this, $el);
    this._watcher = this.scope.$watch ($el.attr('id')+'.$valid', this.set.bind(this, 'valid'));
  };

  AllexAngularFormLogicController.prototype.set_valid = function (val) {
    if (this.valid === val) return false;
    this.valid = val || null;
    return true;
  };

  AllexAngularFormLogicController.prototype.validate = function (name, modelValue, viewValue) {
    var validation = this.validation;
    if (!validation) return true;

    if (!validation[name]) return true;
    if (!this.validateJSON(validation[name].json_schema, modelValue)) return false;
    return this.validateFunction (validation[name].custom, modelValue);
  };


  AllexAngularFormLogicController.prototype.validateJSON = function (schema, value) {
    if (!schema) return true;
    var result = lib.jsonschema.validate(value, schema);
    return !result.errors.length;
  };

  AllexAngularFormLogicController.prototype.validateFunction = function (f, value) {
    if (!lib.isFunction (f)) return true;
    return f(value, this.data);
  };

  angular_module.controller('allexAngularFormLogicController', ['$scope', function ($scope) {
    new AllexAngularFormLogicController($scope);
  }]);

  angular_module.directive ('allexAngularFormLogic', function () {
    return {
      restrict : 'A',
      scope: true,
      controller : 'allexAngularFormLogicController',
      link : function ($scope, $el, $attribs) {
        $scope._ctrl.elementReady($el);
      }
    };
  });

  function AngularFormLogicSubmitModifier (options) {
    BasicModifier.call(this, options);
  }

  lib.inherit (AngularFormLogicSubmitModifier, BasicModifier);
  AngularFormLogicSubmitModifier.prototype.destroy = function () {
    BasicModifier.prototype.destroy.call(this);
  };

  AngularFormLogicSubmitModifier.prototype.doProcess = function (name, options, links, logic, resources) {
    var elements = options.elements;
    var submitid = name+'Submit',
      path = '.'+submitid;

    elements.push ({
      name : submitid,
      type : 'WebElement'
    });

    links.push ({
      source : path+'.$element!click',
      target : '.>fireSubmit'
    });

    switch (this.getConfigVal('actualon')){
      default : 
      case 'valid' : {
        logic.push ({
          triggers : [ '.:valid, .:actual' ],
          references : path+', .',
          handler : function (submit, form) {
            submit.set('actual', form.get('valid') && form.get('actual'));
          }
        });
        break;
      }
    }
  };

  AngularFormLogicSubmitModifier.ALLOWED_ON = ['AngularFormLogic'];
  AngularFormLogicSubmitModifier.prototype.DEFAULT_CONFIG = function () {
    return {
      actualon : 'valid'
    };
  };

  applib.registerModifier ('AngularFormLogic.submit', AngularFormLogicSubmitModifier);


  function SubmissionModifier (options) {
    BasicModifier.call(this, options);
  }

  lib.inherit (SubmissionModifier, BasicModifier);
  SubmissionModifier.prototype.destroy = function () {
    BasicModifier.prototype.destroy.call(this);
  };

  SubmissionModifier.prototype.doProcess = function (name, options, links, logic, resources) {
    var form = this.getConfigVal('form'),
      ftion = this.getConfigVal('ftion'),
      filter = this.getConfigVal('filter'),
      closeOnSuccess = this.getConfigVal('closeOnSuccess'),
      closeOnSuccessAfter = this.getConfigVal('closeOnSuccessAfter') || 0;

    links.push ({
      source : form+'!submit',
      target : ftion,
      filter : filter
    });

    links.push ({
      source : ftion,
      target : form+':progress',
      filter : this._processProgress.bind(this)
    });

    links.push ({
      source : ftion,
      target : form+':ftion_status',
      filter : this._processStatus.bind(this)
    });
  };

  SubmissionModifier.prototype._processProgress = function (progress) {
    return progress && progress.working && progress.progress;
  };

  SubmissionModifier.prototype._processStatus = function (sttus) {
    if (!sttus || sttus.working) return null;
    if (sttus.error) return {error : sttus.error};
    if (sttus.result)return {result:sttus.result};

    return null;
  };
  SubmissionModifier.prototype.DEFAULT_CONFIG = function() {
    return null;
  };

  applib.registerModifier('SubmissionModifier', SubmissionModifier);



})(ALLEX, ALLEX.WEB_COMPONENTS.allex_web_webappcomponent, ALLEX.WEB_COMPONENTS.allex_applib, angular.module('allex_applib'));
