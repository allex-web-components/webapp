angular.module ('allex_applib', []);

(function (allex, applib, component) {
  'use strict';

  var lib = allex.lib,
    registerPreprocessor = applib.registerPreprocessor,
    BasicProcessor = applib.BasicProcessor,
    ANGULAR_REQUIREMENTS = new lib.Map();

  component.ANGULAR_REQUIREMENTS = ANGULAR_REQUIREMENTS;

  function AngularPreProcessor () {
    BasicProcessor.call(this);
  }

  lib.inherit (AngularPreProcessor, BasicProcessor);
  AngularPreProcessor.prototype.destroy = function () {
    BasicProcessor.prototype.destroy.call(this);
  };

  AngularPreProcessor.prototype.process = function (desc) {
    if (!desc) throw new Error('No APP descriptor');
    if (!desc.resources) {
      desc.resources = [];
    }
    var resources = desc.resources, 
      angular_resource = null, 
      cnt = 0,
      i;
    for (i = 0; i < resources.length; i++) {

      if (resources[i].type === 'AngularBootstrapper') {
        if (cnt > 0) throw new Error('Multiple instances of AngularBootstrapper found, only one allowed');

        angular_resource = resources[i];
        cnt++;
      }
    }

    if (!angular_resource) {
      angular_resource = {
        type : 'AngularBootstrapper',
        name : 'AngularBootstrapper',
        options : {
          angular_dependencies : []
        }
      };
      resources.push (angular_resource);
    }

    if (!angular_resource.options.angular_dependencies) angular_resource.options.angular_dependencies = [];

    var used_angular_elements = new lib.Map ();
    traverseElements (desc.elements, used_angular_elements);
    used_angular_elements.traverse (appendRequirements.bind(null, angular_resource.options.angular_dependencies));
    angular_resource.options.angular_dependencies = lib.arryOperations.unique (angular_resource.options.angular_dependencies);
  };

  function appendRequirements (dependencies, req, name) {
    Array.prototype.push.apply (dependencies, component.ANGULAR_REQUIREMENTS.get(name));
  }

  function traverseElements (elements, used_angular_elements) {
    for (var i = 0; i < elements.length; i++) {
      if (component.ANGULAR_REQUIREMENTS.get(elements[i].type) && !used_angular_elements.get(elements[i].type)){
        used_angular_elements.add(elements[i].type, true);
      }

      if (elements[i].options && elements[i].options.elements) traverseElements(elements[i].options.elements, used_angular_elements);
    }
  }

  registerPreprocessor ('AngularPreProcessor', AngularPreProcessor);
})(ALLEX, ALLEX.WEB_COMPONENTS.allex_applib,ALLEX.WEB_COMPONENTS.allex_web_webappcomponent);

//samo da te vidim
angular.module('allex_applib', []);

(function (allex, module, applib, angular_module) {
  'use strict';

  var lib = allex.lib, 
    BasicAngularController = lib.BasicAngularController;


  function BasicAngularElementController ($scope) {
    BasicAngularController.call(this, $scope);
    this.raise = null;
    this._getResource = null;
  }
  lib.inherit (BasicAngularElementController, BasicAngularController);
  BasicAngularElementController.prototype.__cleanUp = function () {
    this.raise = null;
    this._getResource = null;
    BasicAngularController.prototype.__cleanUp.call(this);
  };

  BasicAngularElementController.prototype.getResource = function (name) {
    return this._getResource ? this._getResource(name) : undefined;
  };

  BasicAngularElementController.prototype.elementReady = function ($el) {
    var elc = $el.data('allex_element');
    if (!elc) throw new Error('Missing allex element ...');
    elc.set('$scopectrl', this);
  };

  BasicAngularElementController.prototype.raiseEvent = function (name, val) {
    this.raise(name, val);
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
//samo da te vidim
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
//samo da te vidim
(function (allex, module, applib, angular_module) {
  'use strict';
  //use this if you want simply to use angular mechanism in any DOM element ....

  var lib = allex.lib,
    AngularDataAwareController = module.elements.AngularDataAwareController,
    BasicAngularElement = module.elements.BasicAngularElement,
    q = lib.q;

    ///This is allexApp part of code ....
    function AngularElement (id, options) {
      BasicAngularElement.call(this, id, options);
    }
    lib.inherit (AngularElement, BasicAngularElement);

    AngularElement.prototype.__cleanUp = function () {
      BasicAngularElement.prototype.__cleanUp.call(this);
    };

    AngularElement.prototype.initialize = function () {
      BasicAngularElement.prototype.initialize.call(this);
      this.$element.attr('data-allex-angular-element', '');
    };

    module.elements.AngularElement = AngularElement;
    applib.registerElementType('AngularElement', AngularElement);

    angular_module.controller('allexAngularElementController', ['$scope', function ($scope) {
      new AngularDataAwareController($scope);
    }]);

    angular_module.directive ('allexAngularElement', [function () {
      return {
        restrict : 'A',
        scope: true,
        controller: 'allexAngularElementController',
        link : function ($scope, $el, $attribs) {
          $scope._ctrl.elementReady ($el);
        }
      };
    }]);

    function AngularFormElement(id, options) {
      BasicAngularElement.call(this, id, options);
    }
    lib.inherit(AngularFormElement, BasicAngularElement);
    AngularFormElement.prototype.set_data = function (val) {
      var ret = BasicAngularElement.prototype.set_data.call(this, val),
        parentscopectrl, myname;

      if (ret !== false) {
        parentscopectrl = this.__parent.$scopectrl;
        myname = this.$element.attr('name');
        if (parentscopectrl && myname) {
          if (parentscopectrl.data) {
            parentscopectrl.data[myname] = val;
          }else{
            var dd = {};
            dd[myname] = val;
            parentscopectrl.set('data', dd);
          }
        }
      }
      return ret;
    };
    module.elements.AngularFormElement = AngularFormElement;
    applib.registerElementType('AngularFormElement', AngularFormElement);

})(ALLEX, ALLEX.WEB_COMPONENTS.allex_web_webappcomponent, ALLEX.WEB_COMPONENTS.allex_applib, angular.module('allex_applib'));
//samo da te vidim
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
    this.partialSubmit = new lib.HookCollection();
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
    this.partialSubmit.destroy();
    this.partialSubmit = null;

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

    if (this.isScopeReady() && was_active) {
      if (true === closeOnSuccess || lib.isNumber(closeOnSuccess)){
        this.doCloseOnSuccess(closeOnSuccess);
      }
      if (this.getConfigVal('clearOnSuccess')){
        this.set('data', null);
      }
    }

    this.executeOnScopeIfReady ('set', ['ftion_status', val]);
  };

  AngularFormLogic.prototype.doCloseOnSuccess = function (val) {
    if (true === val) val = 0;

    this.executeOnScopeIfReady ('set', ['disabled', false]);
    lib.runNext (this.set.bind(this, 'actual', false), val);
  };

  AngularFormLogic.prototype.set_progress = function (val) {
    this.progress = val;
    this.executeOnScopeIfReady ('set', ['progress', val]);
  };

  AngularFormLogic.prototype._unlisten = function (f) {
    if (lib.isFunction (f)) f();
  };

  AngularFormLogic.prototype.set_actual = function (val) {
    BasicAngularElement.prototype.set_actual.call(this, val);
    //reset ftion_status and progress on every actual change
    this.set('ftion_status', null);
    this.set('progress', null);
    this.executeOnScopeIfReady ('set', ['disabled', !val]);
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

    if (!model_name) {
      console.warn ('There is no name for input field ', $el.attr('id'), 'form logic', this.get('id'));
      return;
    }

    var old_read_only = $el.attr('data-ng-readonly'),
      new_read_only = old_read_only && old_read_only.length ? '('+old_read_only+') ||' : '';

    new_read_only += '(_ctrl.disabled || _ctrl.progress)';

    $el.attr({
      'data-allex-angular-validate' : '_ctrl.validation.'+model_name,
      'data-ng-change' : '_ctrl.onChange(\''+model_name+'\', _ctrl.data.'+model_name+')'
    });

    if (!$el.attr('readonly')){
      $el.attr('data-ng-readonly',new_read_only);
    }

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
    this.submit.fire(this.array_keys ? this.toArray(this.array_keys) : this.get('data'));
  };

  AngularFormLogic.prototype.firePartialSubmit = function (field) {
    if (!this.isFieldValid(field)) return;
    this.partialSubmit.fire (field, this.data ? this.data[field] : null);
  };

  function setDefaultVals (data, value, key) {
    if (key in data) return;
    data[key] = value;
  }

  AngularFormLogic.prototype.set_data = function (data) {
    lib.traverseShallow (this._default_values, setDefaultVals.bind(null, data));
    return BasicAngularElement.prototype.set_data.call(this, data);
  };

  AngularFormLogic.prototype.get_data = function () {
    return this.$scopectrl ? this.$scopectrl.get('data') : this.data;
  };

  AngularFormLogic.prototype.getModelName = function (name) {
    var model_name = name;
    if(name.match (BRACKET_END)){
      model_name = name.replace(BRACKET_END, '');
    }
    return model_name;
  };

  AngularFormLogic.prototype.revalidate = function () {
    if (!this.$scopectrl) return;
    var form = this.$scopectrl.scope[this.id];
    if (!form) return;

    for (var i in this.validfields) {
      if (!form[i]) continue;
      form[i].$validate();
    }
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

  AngularFormLogic.prototype.isFieldValid = function (field) {
    return this.$scopectrl && this.$scopectrl.scope[this.get('id')] ? this.$scopectrl.scope[this.get('id')][field].$valid : false;
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
    this.executeOnScopeIfReady ('$apply');
  };

  AngularFormLogic.prototype.disableInput = function (fieldname) {
    this.setInputEnabled(fieldname, false);
  };

  AngularFormLogic.prototype.enableInput = function (fieldname) {
    this.setInputEnabled(fieldname, true);
  };

  AngularFormLogic.prototype.isFormValid = function () {
    for (var i in this.validfields) {
      if (!this.isFieldValid(i)) return false;
    }
    return true;
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
    },
    {
      source : '.:valid',
      target : '$element.#'+submitid+':attr.disabled',
      filter : this._decideDisabled.bind(this)
    });

    switch (this.getConfigVal('actual')){
      case 'always' : {
        links.push ({
          source : '.:actual',
          target : path+':actual',
        });
        break;
      }
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
  AngularFormLogicSubmitModifier.prototype._decideDisabled = function (valid) {
    return valid ? undefined : 'disabled';
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

  function createSubmissionTriggers(item) {
    return item.ftion;
  }

  ///FALI TI DEFAULT_CONFIG i ostalo za validaciju options -a ...

  SubmissionModifier.prototype.doProcess = function (name, options, links, logic, resources) {
    var form = this.getConfigVal('form'),
      cbs = this.getConfigVal('cbs');
     

    if (!form) throw new Error ('No form in SubmissionModifier');
    if (!cbs) throw new Error ('No cbs in SubmissionModifier');

    logic.push ({
        triggers : form+'!submit',
        references : ([form].concat(cbs.map (createSubmissionTriggers))).join (','),
        handler : this._onSubmit.bind(this, cbs)
    });

    var form_progress = form+':progress',
      ftion_status = form+':ftion_status';

    for (var i = 0; i < cbs.length; i++) {
      links.push ({
        source : cbs[i].ftion,
        target : form_progress,
        filter : this._processProgress.bind(this)
      },{
        source : cbs[i].ftion,
        target : ftion_status,
        filter : this._processStatus.bind(this)
      });
    }
  };

  SubmissionModifier.prototype._onSubmit = function (cbs, form) {
    //TODO: ovde moras nekako da handlujes throw koji je podagao neki od filtera ....
    var len = cbs.length,
      offset = 2,
      frefs = Array.prototype.slice.call (arguments, offset, cbs.length+offset),
      data = arguments[offset+cbs.length];


    for (var i = 0; i < len; i++) {
      if (cbs[i].conditional && !cbs[i].conditional(data)) continue;
      frefs[i](lib.isFunction(cbs[i].filter) ?  cbs[i].filter(data, form) : [data]);
    }
  };

  SubmissionModifier.prototype._processFilter = function (filter) {
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

  function FieldBindingModifier (options) {
    BasicModifier.call(this, options);
  }
  lib.inherit (FieldBindingModifier, BasicModifier);
  FieldBindingModifier.prototype.destroy = function () {
    BasicModifier.prototype.destroy.call(this);
  };
  FieldBindingModifier.ALLOWED_ON = ['AngularFormLogic'];

  FieldBindingModifier.prototype._prepareItem = function (name, options, links, logic, resources, data) {
    var path = data.path, field = data.field;

    if (!field) throw new Error('No field given in FieldBindingModifier '+name);

    if (!path) path = name+'_partialSubmit_'+field;

    links.push (
    {
      source: '.:actual',
      target: path+':actual'
    });

    logic.push (
    {
      triggers : ['.:actual', '.:data'],
      references : '., '+path,
      handler : this._decide.bind(this, field)
    },
    {
      triggers : path+'.$element!click',
      references : '.',
      handler : this._onTrigger.bind(this, field)
    });

  };

  FieldBindingModifier.prototype.doProcess = function (name, options, links, logic, resources) {

    var list = this.getConfigVal ('list');
    if (lib.isArray(list)) {
      list.forEach (this._prepareItem.bind(this, name, options, links, logic, resources));
      return;
    }

    var path = this.getConfigVal('path'), field = this.getConfigVal('field');
    if (field) this._prepareItem (name, options, links, logic, resources, {path : path, field : field});
  };

  FieldBindingModifier.prototype._decide = function (field, form, el) {
    ///neka ga ovako za sad ...
    el.$element.attr('disabled', form.isFieldValid(field) ? null : 'disabled');
  };

  FieldBindingModifier.prototype._onTrigger = function (field, form) {
    form.firePartialSubmit(field);
  };

  FieldBindingModifier.prototype.DEFAULT_CONFIG = function () {
    return null;
  };

  applib.registerModifier ('AngularFormLogic.bindField', FieldBindingModifier);
})(ALLEX, ALLEX.WEB_COMPONENTS.allex_web_webappcomponent, ALLEX.WEB_COMPONENTS.allex_applib, angular.module('allex_applib'));
//samo da te vidim
(function (allex, module, applib, angular_module) {
  'use strict';

  var lib = allex.lib,
    AngularDataAwareController = module.elements.AngularDataAwareController,
    DataElementMixIn = module.mixins.DataElementMixIn,
    BasicAngularElement = module.elements.BasicAngularElement,
    CBMapable = lib.CBMapable,
    q = lib.q;


  function addDefaultHeaderCellFilter (defaultHeaderCellFilter, columnDef) {
    if ('headerCellFilter' in columnDef) return;
    columnDef.headerCellFilter = defaultHeaderCellFilter;
  }

  function prepareActionsTable(config) {
    var ret = lib.extend({}, config.actions, {field : '-', enableFiltering : false});
    addDefaultHeaderCellFilter (config.defaultHeaderCellFilter, ret);
    return ret;
  }

  function AngularDataTable (id, options) {
    BasicAngularElement.call(this, id, options);
    this.afterEdit = new lib.HookCollection();
    this.config.grid = lib.extend({}, AngularDataTable.DEFAULT_GRID_CONFIG, this.config.grid);
    if (!this.config.grid.data) this.config.grid.data = '_ctrl.data';

    if (this.config.defaultHeaderCellFilter) {
      this.config.grid.columnDefs.forEach (addDefaultHeaderCellFilter.bind (null, this.config.defaultHeaderCellFilter));
    }
  }
  lib.inherit(AngularDataTable, BasicAngularElement);

  AngularDataTable.prototype.__cleanUp = function () {
    this.afterEdit.destroy();
    this.afterEdit = null;
    BasicAngularElement.prototype.__cleanUp.call(this);
  };

  function checkIfEditable (item) {
    return checkIfPropIsTrue ('enableCellEdit', item);
  }

  function checkIfResizable (item) {
    return checkIfPropIsTrue ('enableColumnResizing', item);
  }

  function checkIfPropIsTrue (prop, item) {
    if (item[prop]) return true;
  }

  function replaceTemplate (item, field) {
    if (!item[field] || item[field].charAt(0) !== '#') return;
    item[field] = jQuery('#references > '+item[field]).html();
  }

  AngularDataTable.prototype._replacePossibleTemplates = function (item) {
    replaceTemplate(item, 'cellTemplate');
    replaceTemplate (item, 'filterHeaderTemplate');
  };

  AngularDataTable.prototype.initialize = function () {
    BasicAngularElement.prototype.initialize.call(this);

    var editable = this.config.grid.enableCellEdit || lib.traverseConditionally (this.getColumnDefs(), checkIfEditable);
    var resizable = this.config.grid.enableColumnResizing || lib.traverseConditionally (this.getColumnDefs(), checkIfResizable);
    var noDataContent = this.getConfigVal('noDataContent');
    var dataString = this.getConfigVal('grid.data');
    this.getColumnDefs().forEach (this._replacePossibleTemplates.bind(this));

    var $container = $('<div class="table_container" ng-show="'+dataString+'.length"></div>');
    var $noDataContainer = $('<div class="no_data_container" ng-show = "!'+dataString+'.length"></div>');

    $container.attr('ui-grid', '_ctrl.gridOptions');
    $container.attr('ui-grid-auto-resize', '');

    if (editable) {
      $container.attr('ui-grid-edit','');
    }

    if (resizable) {
      $container.attr('ui-grid-resize-columns', '');
    }

    //noDataContent
    if (lib.isString(noDataContent)){
      if (noDataContent[0] === '#'){ //id
        $noDataContainer.append($('#references > ' + noDataContent).html());
      }else{ //markup
        $noDataContainer.append(noDataContent);
      }
    }
    if (noDataContent === true){ //find markup on pre-defined place in references
      $noDataContainer.append(this.findDomReference('nodata').html());
    }

    $container.addClass('grid');

    this.$element.attr({'data-allex-angular-data-table': ''});
    this.$element.append($container);
    if (!!noDataContent){
      this.$element.append($noDataContainer);
    }
    var $actions = this.findDomReference('actions');

    if ($actions.length === 0) {
      return;
    }
    var cd = lib.arryOperations.findElementWithProperty (this.config.grid.columnDefs, 'field', '-'),
      actions = { displayName: $actions.attr('data-title') || 'Actions', cellTemplate: $actions.html()};
    if (cd) {
      if (!cd.displayName) cd.displayName = actions.displayName;
      if (!cd.cellTemplate) cd.cellTemplate = actions.cellTemplate;
    }else{
      this.config.grid.columnDefs.unshift (lib.extend ({}, actions, prepareActionsTable(this.config)));
    }
  };

  AngularDataTable.prototype.getApi = function () {
    return this.$scopectrl ? this.$scopectrl.api : null;
  };

  AngularDataTable.prototype._onScope = function (_ctrl) {
    var _cbmap = {
      appendNewRow : this.appendNewRow.bind(this)
    };

    if (this.$element.find('.grid.table_container').attr('ui-grid-edit') === '') {
      _cbmap.afterEdit = this.afterEdit.fire.bind(this.afterEdit);
    }


    _ctrl.set('_cbmap', _cbmap);
    //patch realative stupid approach ....
    this.config.grid.enableHorizontalScrollbar = this.config.grid.enableHorizontalScrollbar === false ? _ctrl.uiGridConstants.scrollbars.NEVER : _ctrl.uiGridConstants.scrollbars.ALWAYS;
    this.config.grid.enableVerticalScrollbar = this.config.grid.enableVerticalScrollbar === false ? _ctrl.uiGridConstants.scrollbars.NEVER : _ctrl.uiGridConstants.scrollbars.ALWAYS;

    this.config.grid.columnDefs.forEach (this._processFilters.bind(this, _ctrl));
    _ctrl.set('gridOptions', this.config.grid);
  };

  function _processSingleFilter (FILTERS, filter_data) {
    if (filter_data.type) {
      filter_data.type = FILTERS[filter_data.type];
    }

    if (filter_data.condition && lib.isString(filter_data.condition)) {
      filter_data.condition = FILTERS[filter_data.condition];
    }
  }

  AngularDataTable.prototype._processFilters = function (_ctrl, coldef, index) {
    var FILTERS = _ctrl.uiGridConstants.filter;

    if (coldef.filter) {
      _processSingleFilter (FILTERS,coldef.filter);
      return;
    }

    if (coldef.filters) {
      coldef.filters.forEach (_processSingleFilter.bind(null, FILTERS));
      return;
    }
  };

  AngularDataTable.prototype.set_data = function (data) {
    var ret = BasicAngularElement.prototype.set_data.call(this, data);
    if (false === ret) return;

    this.executeOnScopeIfReady ('set', ['data', data]);
    this.executeOnScopeIfReady ('api.core.refresh');
  };

  AngularDataTable.prototype.getCleanData = function () {
    angular.copy(this.getTableData());
  };

  AngularDataTable.prototype.appendNewRow = function (current_length) {
    var row = {};

    if (this.getConfigVal('config.bSetNewRowProps')) {
      ///TODO: uzmi iz grid options columnDefs i popuni row sa null ...
    }

    var f = this.getConfigVal('appendNewRow');
    return f ? f(this, current_length, row) : row;
  };

  AngularDataTable.prototype.get_rows = function () {
    return this.$scopectrl.api ? this.$scopectrl.api.grid.rows : null;
  };

  AngularDataTable.prototype.getElement = function (path) {
    if ('$element' === path) return this.$element;
    return BasicAngularElement.prototype.getElement.call(this, path);
  };


  AngularDataTable.prototype.set_row_count = function (rc) {
    return this.executeOnScopeIfReady ('set', ['row_count', rc]);
  };

  AngularDataTable.prototype.get_row_count = function () {
    return this.executeOnScopeIfReady ('get', ['row_count']);
  };

  AngularDataTable.prototype.getColumnDefs = function () {
    return this.getConfigVal('grid.columnDefs');
  };

  AngularDataTable.prototype.$apply = function () {
    BasicAngularElement.prototype.$apply.call(this);
    this.executeOnScopeIfReady ('api.core.refresh');
  };

  AngularDataTable.prototype.removeAllColumns = function () {
    if (this.isScopeReady()) {
      this.config.grid.columnDefs.splice(0, this.config.grid.columnDefs.length);
      this.refreshGrid();
    }else{
      var cd = this.getColumnDefs();
      cd.splice (0, cd.length);
    }
  };

  AngularDataTable.prototype.appendColumn = function (definition) {
    if (this.isScopeReady()){
      this.config.grid.columnDefs.push (definition);
      this.refreshGrid();
    }else{
      this.getColumnDefs().push(definition);
    }
  };

  AngularDataTable.prototype.set_column_defs = function (defs) {
    if (this.isScopeReady()) {
      this.config.grid.columnDefs = defs;
      this.refreshGrid();
    }else{
      var cd = this.getColumnDefs();
      cd.splice (0, cd.length);
      Array.prototype.push.apply(cd, defs);
    }
  };

  AngularDataTable.prototype.updateColumnDef = function (name, coldef) {
    if (this.isScopeReady()){
      var column = this.getColumnDef(name);
      column.colDef = coldef;
      this.refreshGrid();
      return;
    }

    var cd = this.getColumnDef (name), all = this.getColumnDefs(), index = all.indexOf(cd);
    if (index < 0) throw new Error ('No column definition for name ', name);
    all[index] = coldef;
  };

  AngularDataTable.prototype.getColumnDef = function (name) {
    if (this.isScopeReady() && this.getApi().grid.columns.length){
      var column = this.getApi().grid.getColumn (name);
      return column ? column.colDef : null;
    }
    return lib.arryOperations.findElementWithProperty (this.getColumnDefs(), 'name', name);
  };

  AngularDataTable.prototype.refreshGrid = function () {
    this.executeOnScopeIfReady ('api.grid.refresh');
  };

  function extractEntity (item) {
    return item.entity;
  }

  AngularDataTable.prototype.getTableData = function () {
    return this.executeOnScopeIfReady('getActualData');
  };

  AngularDataTable.prototype.getRowIndexUponEntity = function (entity_data) {
    var rows = this.getApi().grid.rows;
    for (var i = 0; i < rows.length; i++) {
      if (rows[i].entity.$$hashKey === entity_data.$$hashKey) return i;
    }
    return -1;
  };

  AngularDataTable.prototype.removeRow = function (entity_data) {
    var data = this.getTableData(),
      index = this.getRowIndexUponEntity (entity_data);
    if (index < 0) return;

    data.splice(index, 1);
    this.refreshGrid();
  };

  AngularDataTable.isSpecialColumnName = function (key) {
    return '-' === key;
  };

  AngularDataTable.DEFAULT_GRID_CONFIG = null;

  module.elements.AngularDataTable = AngularDataTable;
  applib.registerElementType('AngularDataTable', AngularDataTable);
  module.ANGULAR_REQUIREMENTS.add ('AngularDataTable', ['ui.grid','ui.grid.edit', 'ui.grid.autoResize', 'ui.grid.resizeColumns']);

  //This is angular part of code ... //and what about this ... raise ....
  function AllexAngularDataTableController ($scope, $parse, uiGridConstants) {
    AngularDataAwareController.call(this, $scope);
    CBMapable.call(this);
    this.uiGridConstants = uiGridConstants;
    this.data = [];
    this.gridOptions = null;
    this.api = null;

    this._listenToEditEvents = false;
  }
  lib.inherit (AllexAngularDataTableController, AngularDataAwareController);
  CBMapable.addMethods (AllexAngularDataTableController);


  AllexAngularDataTableController.prototype.__cleanUp = function () {
    this.uiGridConstants = null;
    this.rowCountChanged.destroy();
    this.rowCountChanged = null;

    this.editDone = new lib.HookCollection();

    this.gridOptions = null;
    this.data = null;
    this.api = null;
    CBMapable.prototype.__cleanUp.call(this);
    AngularDataAwareController.prototype.__cleanUp.call(this);
  };

  AllexAngularDataTableController.prototype.set_gridOptions = function (val) {
    if (this.gridOptions === val) {
      return false;
    }
    this.api = null;

    ///TODO: check if equal ...
    this.gridOptions = val;
    if (!this.gridOptions) {
      return true;
    }

    this.gridOptions.onRegisterApi = this.set.bind(this, 'api');
  };

  AllexAngularDataTableController.prototype.set_api = function (api) {
    if (this.api === api) return;
    this.api = api;
    if (this._cbmap && this._cbmap.afterEdit) {
      this.api.edit.on.afterCellEdit(this.scope, this._onAfterEdit.bind(this));
    }
  };

  AllexAngularDataTableController.prototype._onAfterEdit = function (rowEntity, colDef, newValue, oldValue) {
    if (oldValue === newValue) return;

    this.call_cb('afterEdit', [{
      newValue : newValue,
      oldValue : oldValue,
      row : rowEntity,
      field : colDef.name
    }]);
  };

  function doReturn (what) { return what; }

  AllexAngularDataTableController.prototype.set_row_count = function (val) {

    var rows = this.getActualData();
    if (!lib.isArray(rows)) return false; ///TODO ...

    var rc = rows.length,
      new_row = null;

    if (val === rc) return false;

    if (val < rc) {
      rows.splice (val, rc-val);
    }else{
      while (rows.length < val) {
        new_row = this.call_cb('appendNewRow', [rows.length]);
        rows.push (new_row);
      }
    }
    return true;
  };

  AllexAngularDataTableController.prototype.getActualData = function (){
    return (lib.isString(this.gridOptions.data)) ? this.scope.$eval(this.gridOptions.data) : this.gridOptions.data;
  };

  AllexAngularDataTableController.prototype.get_row_count = function () {
    return this.getActualData().length;
  };

  angular_module.controller('allexAngularDataTableController', ['$scope', '$parse', 'uiGridConstants', function ($scope, $parse, uiGridConstants) {
    new AllexAngularDataTableController($scope, $parse, uiGridConstants);
  }]);

  angular_module.directive ('allexAngularDataTable', [function () {
    return {
      restrict : 'A',
      scope: true,
      controller: 'allexAngularDataTableController',
      link : function ($scope, $el, $attribs) {
        $scope._ctrl.elementReady ($el);
      }
    };
  }]);


})(ALLEX, ALLEX.WEB_COMPONENTS.allex_web_webappcomponent, ALLEX.WEB_COMPONENTS.allex_applib, angular.module('allex_applib'));
//samo da te vidim
(function (allex, module, applib, angular_module) {
  'use strict';
  var lib = allex.lib,
    BasicAngularElementController = module.elements.BasicAngularElementController,
    BasicAngularElement = module.elements.BasicAngularElement,
    q = lib.q,
    BasicModifier = applib.BasicModifier;

  function AngularNotification (id, options) {
    BasicAngularElement.call(this, id, options);
    this.data = null;
    this._temp_cache = null;
  }
  lib.inherit (AngularNotification, BasicAngularElement);

  AngularNotification.prototype.__cleanUp = function () {
    if (this._temp_cache) this._temp_cache.destroy();
    this._temp_cache = null;
    this.data = null;
    BasicAngularElement.prototype.__cleanUp.call(this);
  };

  AngularNotification.prototype._processToCache = function (regexp, item) {
    var id = $(item).attr('id');
    if (!id.match (regexp) || !this.isDefaultTemplate(id)) return;

    this._addToCache(item, id);
    $(item).remove();
  };

  AngularNotification.prototype._addToCache = function (item, id) {
    if (item.length === 0) throw new Error ('Unable to find item '+id);
    if (!id) {
      id = $(item).attr('id');
    }
    if (!this._temp_cache) this._temp_cache = new lib.Map ();
    this._temp_cache.add(id, $(item).html());
  };

  AngularNotification.prototype.isDefaultTemplate = function (id) {
    var dt = this.getConfigVal ('defaultTemplate');
    if (!dt) return false;
    return (id === dt.error || id === dt.success || id === dt.progress);
  };

  AngularNotification.prototype.initialize = function () {
    BasicAngularElement.prototype.initialize.call(this);
    var regexp = new RegExp ('^'+'angular_notification_'+this.get('id'));
    $('#references').children().toArray().forEach (this._processToCache.bind(this, regexp));
    var default_templates = this.getConfigVal('defaultTemplate');
    if (default_templates) {
      if (default_templates.error) this._addToCache ($('#references #'+default_templates.error));
      if (default_templates.success) this._addToCache ($('#references #'+default_templates.success));
      if (default_templates.progress) this._addToCache ($('#references #'+default_templates.progress));
    }

    this.$element.attr({
      'allex-notification' : ''
    });

    this.$element.find(this.getConfigVal('contentSelector')).attr('data-ng-include', '_ctrl.html');
  };

  AngularNotification.prototype.set_actual = function (val) {
    BasicAngularElement.prototype.set_actual.call(this, val);
    var f = this.getConfigVal('setActual');
    if (!lib.isFunction(f)) return;
    f(this.$element, val);
  };

  AngularNotification.prototype.templateName = function (name) {
    return '#references #angular_notification_'+this.get('id')+'_'+name;
  };


  AngularNotification.prototype.findTemplate = function (name) {
    var ret = $(this.templateName(name));
    return ret.length ? ret : null;
  };

  AngularNotification.prototype.set_data = function (data) {
    if (this.data === data) return false;
    this.data = data;

    var default_template;

    if (!this.data) {
      this._doHide();
      return;
    }

    var template = this.templateName(data.name);

    if (!this.$scopectrl.$templateCache.get(this.templateName(data.name))) {
      template = this.getConfigVal('defaultTemplate') ? this.getConfigVal('defaultTemplate')[data.type] : null;
      if (!template) return;

      template = '#references #'+template; //samo
    }

    this.$scopectrl.html = template;
    this.$scopectrl.notificationClass = data.notificationClass || null;
    this.$scopectrl.title = data.title || null;
    this.$scopectrl.set('data', data.content_data);
    this.set('actual', true);
  };

  AngularNotification.prototype._doHide = function () {
    this.$scopectrl.set('data', null);
    this.set('actual', false);
  };

  AngularNotification.prototype.set_ftion = function (data) {
    if (!data || (!data.data.error && !data.data.progress && !data.data.result)) return; //nothing to be done ...

    var notificationClass = null, 
      fconf = this.getConfigVal ('functionConfigs'),
      title = null,
      name = null,
      content_data = null,
      statusClass = null;

    if (data.data.error) {
      content_data = data.data.error;
      name = data.name+'_error';
      title = this.getConfigVal('defaultErrorTitle');
      statusClass = 'error';
    }
    else if (data.data.result) {
      content_data = data.data.result;
      name = data.name+'_success';
      title = this.getConfigVal ('defaultSuccessTitle');
      statusClass = 'success';
    }
    else if (data.data.progress) {
      content_data = data.data.progress;
      name = data.name+'_progress';
      title = this.getConfigVal('defaultProgressTitle');
      statusClass = 'progress';
      if (!data.data.running) {
        console.log('got progress, but not running', data);
        return;
      }
    }

    if (fconf && fconf[name]){
      notificationClass = fconf.notificationClass;
      title = fconf.title;
    }

    notificationClass = (notificationClass || '')+' '+statusClass;
    this.set('data', {name : name, content_data : content_data, notificationClass : notificationClass, title : title, type : statusClass});
  };

  function _toTemplateCache (anc, item, key) {
    anc.$scopectrl.$templateCache.put ('#references #'+key, item);
  }

  AngularNotification.prototype._onScope = function (ctrl) {
    if (!this._temp_cache) return;
    this._temp_cache.traverse (_toTemplateCache.bind(null, this));
    this._temp_cache.destroy();
    this._temp_cache = null;
  };

  module.elements.AngularNotification = AngularNotification;
  applib.registerElementType ('AngularNotification', AngularNotification);

  function AngularNotificationController ($scope, $templateCache) {
    BasicAngularElementController.call(this,$scope);
    this.$templateCache = $templateCache;
    this.content_container = null;
    this.html = null;
    this.data = null;
    this.title = null;
    this.notificationClass = null;
  }
  lib.inherit(AngularNotificationController, BasicAngularElementController);
  AngularNotificationController.prototype.__cleanUp = function () {
    this.content_container = null;
    this.html = null;
    this.$templateCache = null;
    this.title = null;
    this.notificationClass = null;
    this.data = null;
    BasicAngularElementController.prototype.__cleanUp.call(this);
  };

  AngularNotificationController.prototype.set_content_container = function ($el) {
    this.content_container = $el;
  };

  angular_module.controller ('allexNotificationController', ['$scope', '$templateCache', function ($scope, $templateCache) {
    new AngularNotificationController ($scope, $templateCache);
  }]);

  angular_module.directive ('allexNotification', [function () {
    return {
      restrict : 'A',
      scope : true,
      controller : 'allexNotificationController',
      link : function ($scope, $el) {
        $scope._ctrl.elementReady($el);
      }
    };
  }]);


  function BootstrapModalModifier (options) {
    BasicModifier.call(this, options);
  }
  lib.inherit (BootstrapModalModifier, BasicModifier);

  BootstrapModalModifier.prototype.destroy = function (){
    BasicModifier.prototype.destroy.call(this);
  };

  BootstrapModalModifier.prototype.doProcess = function (name, options, links, logic, resources) {
    if (!options.contentSelector) options.contentSelector = '.modal-body';
    this.hookToArray(options, 'onActual', this._onActual.bind(this));
    this.hookToArray (options,'onInitialized', this._onIntialized.bind(this));
  };

  BootstrapModalModifier.prototype._onActual = function (el, actual) {
    el.$element.modal(actual ? 'show': 'hide');
  };

  BootstrapModalModifier.prototype._onIntialized = function (el){
    el.$element.on ('shown.bs.modal', el.set.bind(el, 'actual', true));
    el.$element.on ('hidden.bs.modal', el.set.bind(el, 'actual', false));
  };

  BootstrapModalModifier.prototype.ALLOWED_ON = ['AngularNotification', 'AngularFormLogic'];
  BootstrapModalModifier.prototype.DEFAULT_CONFIG = function () {return null;};
  applib.registerModifier ('AngularElements.BootstrapModal', BootstrapModalModifier);


})(ALLEX, ALLEX.WEB_COMPONENTS.allex_web_webappcomponent, ALLEX.WEB_COMPONENTS.allex_applib, angular.module('allex_applib'));
//samo da te vidim
(function (allex, module, applib, angular, $) {
  'use strict';

  var lib = allex.lib,
  BasicResourceLoader = applib.BasicResourceLoader,
  q = lib.q;

  function AngularBootstrapper (options, app) {
    BasicResourceLoader.call(this, lib.extend ({}, options, {ispermanent : true}));
    this._dependentElements = new lib.Map ();
    app.onReady(this._onReady.bind(this));
  }
  lib.inherit (AngularBootstrapper, BasicResourceLoader);

  AngularBootstrapper.prototype.__cleanUp = function () {
    this._dependentElements.destroy();
    this._dependentElements = null;
    BasicResourceLoader.prototype.__cleanUp.call(this);
  };

  AngularBootstrapper.prototype.doLoad = function (){
    var defer = q.defer();
    defer.resolve('ok');
    return defer;
  };

  function _appendToDeps (deps, item) {
    var diff = lib.arryOperations.difference (item, deps);
    Array.prototype.push.apply (deps, diff);
  }

  AngularBootstrapper.prototype._onReady = function (defer) {
    var deps = this.getConfigVal('angular_dependencies');
    if (deps) {
      if (deps.indexOf('allex_applib') < 0) deps.push ('allex_applib');
      if (deps.indexOf('allex__web_angularcomponent') < 0) deps.push ('allex__web_angularcomponent');
    }else{
      deps = ['allex_applib'];
    }

    module.ANGULAR_REQUIREMENTS.traverse (_appendToDeps.bind(null, deps));
    angular.module('AllexActiveApp', deps);
    angular.module('AllexActiveApp').run (this._onModuleStarted.bind(this));
    angular.bootstrap(document, ['AllexActiveApp']);
  };

  AngularBootstrapper.prototype._onModuleStarted = function () {
    var f = this.getConfigVal ('onBootstrapped');
    if (lib.isFunction (f)) f();
    f = window.AllexAngularBootstrapped;
    if (lib.isFunction(f)) f();
  };

  AngularBootstrapper.prototype.DEFAULT_CONFIG = function () {
    return {
      angular_dependencies : ['allex_applib']
    };
  };

  AngularBootstrapper.prototype.registerDependentElement = function (el) {
    this._dependentElements.add(el.get('id'));
  };

  AngularBootstrapper.prototype.dependentElementReady = function (el) {
    this._dependentElements.remove(el.get('id'));
    //OVO NIKUD NE VODI ...
  };


  module.resources.AngularBootstrapper = AngularBootstrapper;
  applib.registerResourceType ('AngularBootstrapper', AngularBootstrapper);
})(ALLEX, ALLEX.WEB_COMPONENTS.allex_web_webappcomponent, ALLEX.WEB_COMPONENTS.allex_applib, angular, jQuery);
//samo da te vidim
(function (allex, module, applib, $) {
  'use strict';
  var lib = allex.lib,
    BasicElement = applib.BasicElement,
    BasicModifier = applib.BasicModifier,
    BasicProcessor = applib.BasicProcessor,
    RouterMixIn = module.misc.RouterMixIn,
    cntr = 0,
    misc = applib.misc,
    q = lib.q;


    function Notificator () {
      BasicProcessor.call(this);
    }
    lib.inherit (Notificator, BasicProcessor);

    Notificator.prototype.process = function (desc) {
      for (var element_name in this.config) {
        this.createNotificationElement (element_name, this.config[element_name], desc);
      }
    };

    function notificationFilter (ftion, data) {
      return {
        name : ftion,
        data : data
      };
    }

    Notificator.prototype.createNotificationElement = function (name, config, desc) {
      var ftion;

      for (var i = 0; i<config.length; i++) {
        ftion = config[i];
        desc.links.push ({
          source : '.>'+ftion,
          target : name+':ftion',
          filter : notificationFilter.bind(null, ftion)
        });
      }
    };

    applib.registerPreprocessor('Notificator', Notificator);

})(ALLEX, ALLEX.WEB_COMPONENTS.allex_web_webappcomponent, ALLEX.WEB_COMPONENTS.allex_applib, jQuery);
//samo da te vidim
(function (allex, module, applib, $) {
  'use strict';

  var lib = allex.lib,
    BasicModifier = applib.BasicModifier,
    AngularDataTable = module.elements.AngularDataTable;


  function RowManipulator (modifier) {
    this.modifier = modifier;
  }

  RowManipulator.prototype.destroy = function () {
    this.modifier = null;
  };

  RowManipulator.prototype.isEmpty = function (entity) {
    return modifier.isEmpty(entity);
  };

  function AngularDataTableAutoAppendRow (options) {
    BasicModifier.call(this, options);
  }
  lib.inherit (AngularDataTableAutoAppendRow, BasicModifier);
  AngularDataTableAutoAppendRow.prototype.destroy = function () {
    BasicModifier.prototype.destroy.call(this);
  };

  AngularDataTableAutoAppendRow.prototype.ALLOWED_ON = function () {
    return 'AngularDataTable';
  };

  AngularDataTableAutoAppendRow.prototype.DEFAULT_CONFIG = function () {
    return {
      eventName : 'removeRow',
      isEmpty : function (obj) {
        for (var i in obj) {
          if (lib.isVal(obj[i])) return false;
        }

        return true;
      },
      isFull : function (obj) {
        for (var i in obj) {
          if (!lib.isVal(obj[i])) return false;
        }
        return true;
      }
    };
  };

  AngularDataTableAutoAppendRow.prototype._addNewRow = function (options) {
    var ret = {
    }, item, key;

    for (var i in options.grid.columnDefs) {
      item = options.grid.columnDefs[i];
      key = item.field || item.name;

      if (AngularDataTable.isSpecialColumnName(key)) continue;
      ret[key] = null;
    }

    return ret;
  };

  AngularDataTableAutoAppendRow.prototype.doProcess = function (name, options, links, logic, resources) {
    var eventName = this.getConfigVal('eventName');

    if (!this.getConfigVal('newRow')) {
      this.setConfigVal ('newRow', this._addNewRow.bind(this, options), true);
    }

    if (!lib.isFunction (this.getConfigVal('newRow'))) throw new Error('newRow is not a function');
    if (!lib.isFunction (this.getConfigVal('isEmpty'))) throw new Error('isEmptyRow must be a function');
    if (!lib.isFunction (this.getConfigVal('isFull'))) throw new Error('isFull must be a function');

    options.appendNewRow = this.getConfigVal ('newRow');
    if (!options.helperObj) {
      options.helperObj = {};
    }
    options.helperObj.autoappend = new RowManipulator(this);

    var ret = [{
      triggers : '.!afterEdit',
      references : '.',
      handler : this._onAfterEdit.bind(this, this.getConfigVal('isEmpty'), this.getConfigVal('isFull'))
    },
    {
      triggers : '.$element!'+eventName,
      references : '.',
      handler : this._onRemoveRequested.bind(this)
    },{
      triggers : '.:data',
      references : '.',
      handler : this._onData.bind(this, this.getConfigVal('isEmpty'), this.getConfigVal('isFull'))
    }];

    Array.prototype.push.apply (logic, ret);
  };

  AngularDataTableAutoAppendRow.prototype._onData = function (isEmpty, isFull, Table, data) {
    ///TODO: here is a potential problem : once data is null this wouldn't append special row ... might be a problem ...
    if (lib.isNull(data)) return;
    this._doAppend (isEmpty, isFull, Table);
  };

  AngularDataTableAutoAppendRow.prototype.isEmptyRow = function (entity, isEmpty) {
    return isEmpty(entity);
  };

  AngularDataTableAutoAppendRow.prototype._doAppend = function (isEmpty, isFull, table) {
    var data = table.getTableData(),
      last = data[data.length-1];

    if (data.length === 0) {
      table.set('row_count', 1);
      return;
    }
    if (isEmpty (last) || !isFull(last)) return;
    table.set('row_count', table.get('row_count')+1);
  };

  AngularDataTableAutoAppendRow.prototype._onAfterEdit = function (isEmpty, isFull, table,  obj) {
    if (!obj.row || !isFull(obj.row)) return; //nothing to be done ....
    this._doAppend (isEmpty, isFull, table);
  };

  AngularDataTableAutoAppendRow.prototype._onRemoveRequested = function (table, evnt, obj) {
    table.removeRow (obj);
  };

  applib.registerModifier ('AngularDataTableAutoAppendRow', AngularDataTableAutoAppendRow);

  return AngularDataTableAutoAppendRow;



})(ALLEX, ALLEX.WEB_COMPONENTS.allex_web_webappcomponent, ALLEX.WEB_COMPONENTS.allex_applib, jQuery);
//samo da te vidim
(function (allex, module, applib, $) {
  'use strict';
  var lib = allex.lib,
    BasicModifier = applib.BasicModifier,
    misc = applib.misc;


  function TimeInterval (options) {
    BasicModifier.call(this, options);
  }
  lib.inherit (TimeInterval, BasicModifier);
  TimeInterval.prototype.ALLOWED_ON = function () {
    return 'AngularFormLogic';
  };

  TimeInterval.prototype.DEFAULT_CONFIG = function () {
    return null;
  };

  TimeInterval.prototype.doProcess = function (name, options, links, logic, resources) {
    misc.addHook (options, 'onInitialized', this._onInitialized.bind(this, this.config));
  };

  TimeInterval.prototype._onInitialized = function (config, el) {
    var $element = el.$element,
      $from = $element.find (config.from),
      $to = $element.find(config.to),
      from_options = lib.extend({}, config.options),
      to_options = lib.extend({}, config.options);

    from_options.maxDate = moment();
    to_options.maxDate = moment();


    if (config.maxDateOffset) {
      from_options.maxDate.add.apply(from_options.maxDate, config.maxDateOffset);
      to_options.maxDate.add.apply(to_options.maxDate, config.maxDateOffset);
    }

    $from.datetimepicker(from_options);
    $to.datetimepicker(to_options);

    $from.on('dp.change', this._onFromChanged.bind(this, config, el, $to, $from));
    $to.on ('dp.change', this._onToChanged.bind(this, config, el, $to, $from));
  };

  TimeInterval.prototype._onToChanged = function (config, el, $to, $from, evnt) {
    var date = evnt.date ? evnt.date.format(config.options.format) : null;
    el.updateHashField ($to.attr('name'), date);
    $from.data('DateTimePicker').maxDate(date ? moment(date, config.options.format) : moment());
  };

  TimeInterval.prototype._onFromChanged = function (config, el, $to, $from, evnt) {
    el.updateHashField ($from.attr('name'), evnt.date ? evnt.date.format(config.options.format) : null);
  };

  applib.registerModifier ('TimeInterval', TimeInterval);

  function TimeIntervalReset (options) {
    BasicModifier.call(this, options);
  }
  lib.inherit (TimeIntervalReset, BasicModifier);
  TimeIntervalReset.prototype.DEFAULT_CONFIG = function () {
    return null;
  };
  TimeIntervalReset.prototype.ALLOWED_ON = function () {
    return 'AngularFormLogic';
  };

  TimeIntervalReset.prototype.doProcess = function (name, options, links, logic, resources) {
    logic.push ({
      triggers : '.'+this.getConfigVal('trigger')+'.$element!click',
      references : '.',
      handler : this._onResetRequested.bind(this, this.config)
    });
  };

  TimeIntervalReset.prototype._onResetRequested = function (config, el) {
    config.elements.forEach (this._resetOnField.bind(this, el));
  };

  TimeIntervalReset.prototype._resetOnField = function (el, id) {
    var $el = el.$element.find(id),
      name = $el.attr('name');

    el.updateHashField(name, null);
    $el.datetimepicker('clear');
  };

  applib.registerModifier ('TimeIntervalReset', TimeIntervalReset);
})(ALLEX, ALLEX.WEB_COMPONENTS.allex_web_webappcomponent, ALLEX.WEB_COMPONENTS.allex_applib, jQuery);
