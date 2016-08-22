angular.module ('allex_applib', []);

//samo da te vidim
angular.module('allex_applib', []);

(function (allex, module, applib, angular_module) {
  'use strict';

  var lib = allex.lib, 
    BasicAngularController = lib.BasicAngularController;


  function BasicAngularElementController ($scope) {
    BasicAngularController.call(this, $scope);
    this.raise = null;
  }
  lib.inherit (BasicAngularElementController, BasicAngularController);
  BasicAngularElementController.prototype.__cleanUp = function () {
    this.raise = null;
    BasicAngularController.prototype.__cleanUp.call(this);
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
    q = lib.q;

    function BasicAngularElement (id, options) {
      WebElement.call(this, id, options);
      this.$scopectrl = null;
    }
    lib.inherit (BasicAngularElement, WebElement);
    BasicAngularElement.prototype.__cleanUp = function () {
      this.$scopectrl = null;
      WebElement.prototype.__cleanUp.call(this);
    };

    BasicAngularElement.prototype.set_$scopectrl = function (val) {
      this.$scopectrl = val;
      this._onScope(val);
      this._setRaise();
    };

    BasicAngularElement.prototype._setRaise = function () {
      this.$scopectrl.set('raise', this.$element.trigger.bind(this.$element));
    };

    BasicAngularElement.prototype.getMeAsElement = function () {
      return this.$element;
    };

    BasicAngularElement.prototype.initialize = function () {
      WebElement.prototype.initialize.call(this);
      this.$element.data('allex_element', this);
    };

    BasicAngularElement.prototype._onScope = lib.dummyFunc;
    module.elements.BasicAngularElement = BasicAngularElement;

})(ALLEX, ALLEX.WEB_COMPONENTS.allex_web_webappcomponent, ALLEX.WEB_COMPONENTS.allex_applib, angular.module('allex_applib'));
//samo da te vidim
(function (allex, module, applib, angular_module) {
  'use strict';

  var lib = allex.lib,
    AngularDataAwareController = module.elements.AngularDataAwareController,
    DataElementMixIn = module.mixins.DataElementMixIn,
    BasicAngularElement = module.elements.BasicAngularElement,
    q = lib.q;


    ///This is allexApp part of code ....
    function AngularElement (id, options) {
      BasicAngularElement.call(this, id, options);
      DataElementMixIn.call(this);
    }
    lib.inherit (AngularElement, BasicAngularElement);

    AngularElement.prototype.__cleanUp = function () {
      DataElementMixIn.prototype.__cleanUp.call(this);
      BasicAngularElement.prototype.__cleanUp.call(this);
    };

    AngularElement.prototype.initialize = function () {
      BasicAngularElement.prototype.initialize.call(this);
      this.$element.attr('data-allex-angular-element', '');
    };

    AngularElement.prototype.set_data = function (val) {
      var ret = DataElementMixIn.prototype.set_data.call(this, val);

      if (DataElementMixIn.prototype.hasDataChanged.call(this, ret)){
        this.$scopectrl.set('data', this.data);
      }
      return ret;
    };

    module.elements.AngularElement = AngularElement;
    applib.registerElementType('AngularElement', AngularElement);

  
    //This is angular part of code ...
    function AllexAngularElementController($scope) {
      AngularDataAwareController.call(this, $scope);
      this.data = null;
    }
    lib.inherit (AllexAngularElementController, AngularDataAwareController);
    AllexAngularElementController.prototype.__cleanUp = function () {
      this.data = null;
      AngularDataAwareController.prototype.__cleanUp.call(this);
    };

    angular_module.controller('allexAngularElementController', ['$scope', function ($scope) {
      new AllexAngularElementController($scope);
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
})(ALLEX, ALLEX.WEB_COMPONENTS.allex_web_webappcomponent, ALLEX.WEB_COMPONENTS.allex_applib, angular.module('allex_applib'));
//samo da te vidim
(function (allex, module, applib, angular_module) {
  'use strict';

  ///MIND THE FACT that form name should not contain - in their name ... for example form-bla will not work ... inspect that ...

  var lib = allex.lib,
    BasicAngularElementController = module.elements.BasicAngularElementController,
    BasicAngularElement = module.elements.BasicAngularElement,
    q = lib.q;


  function AngularFormLogic(id, options) {
    BasicAngularElement.call(this, id, options);
    this.$form = null;
    this.submit = new lib.HookCollection();
    this.valid = null;
    this._valid_l = null;
    this.validfields = {}; 
    this._validfields_l = {};

    this._default_values = {};
  }

  lib.inherit (AngularFormLogic, BasicAngularElement);
  AngularFormLogic.prototype.__cleanUp = function () {
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

  AngularFormLogic.prototype._unlisten = function (f) {
    if (lib.isFunction (f)) f();
  };

  AngularFormLogic.prototype.set_actual = function (val) {
    BasicAngularElement.prototype.set_actual.call(this, val);
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
      name = $el.attr('name');
    ///tanko ti ovo, prijatelju ... form format dozvoljava i hash-ove i nizove ... ovim to nisi pokrio ....
    $el.attr('data-allex-angular-validate' , '_ctrl.validation.'+name);

    if (!$el.attr('data-ng-model') && !$el.attr('ng-model')) {
      $el.attr('data-ng-model', '_ctrl.data.'+name);
    }

    this._validfields_l[name] = null;
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

  AngularFormLogic.prototype.fireSubmit = function () {
    this.submit.fire(this.$scopectrl.data);
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
    return this.$scopectrl.get('data');
  };

  AngularFormLogic.prototype._onScope = function (ctrl) {
    this._valid_l = ctrl.attachListener('valid', this.set.bind(this, 'valid'));
    ctrl.set('validation', this.getConfigVal('validation'));
    lib.traverseShallow (this._validfields_l, this._watchForValid.bind(this, ctrl.scope, this.$form.attr('name')));
  };

  AngularFormLogic.prototype._watchForValid = function (scope, formname, val, key) {
    this._validfields_l[key] = scope.$watch('_ctrl.data.'+key, this._updateError.bind(this, scope, formname, key));
  };
  AngularFormLogic.prototype._updateError = function (scope, formname, key) {
    var s = lib.extend({}, this.validfields);
    s[key] = !Object.keys(scope[formname][key].$error).length;
    this.set('validfields', s);
  };

  AngularFormLogic.prototype.set_valid = function (val) {
    if (this.valid === val) return false;
    console.log('AngularFormLogic ',this.id,' will say valid', val);
    this.valid = val;
    return true;
  };

  AngularFormLogic.prototype.empty = function () {
    this.set('data', {});
  };

  module.elements.AngularFormLogic = AngularFormLogic;
  applib.registerElementType ('AngularFormLogic', AngularFormLogic);

  function AllexAngularFormLogicController ($scope) {
    BasicAngularElementController.call(this, $scope);
    this.data = {};
    this.valid = false;
    this._watcher = null;
    this.validation = null;
  }
  lib.inherit(AllexAngularFormLogicController, BasicAngularElementController);
  AllexAngularFormLogicController.prototype.__cleanUp = function () {
    this.validation = null;
    if (this._watcher) this._watcher();
    this._watcher = null;
    this.data = null;
    this.valid = null;
    BasicAngularElementController.prototype.__cleanUp.call(this);
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
    return this.validateFunction (validation[name].custom);
  };


  AllexAngularFormLogicController.prototype.validateJSON = function (schema, value) {
    if (!schema) return true;
    var result = lib.jsonschema.validate(value, schema);
    return !result.errors.length;
  };

  AllexAngularFormLogicController.prototype.validateFunction = function (f, value) {
    if (!lib.isFunction (f)) return true;
    return f(value);
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

  function AngularDataTable (id, options) {
    BasicAngularElement.call(this, id, options);
    DataElementMixIn.call(this);
    this.afterEdit = new lib.HookCollection();
    if (!this.config.grid.data) this.config.grid.data = '_ctrl.data';
  }
  lib.inherit(AngularDataTable, BasicAngularElement);
  DataElementMixIn.addMethods(AngularDataTable);

  AngularDataTable.prototype.__cleanUp = function () {
    this.afterEdit.destroy();
    this.afterEdit = null;
    DataElementMixIn.prototype.__cleanUp.call(this);
    BasicAngularElement.prototype.__cleanUp.call(this);
  };

  function checkIfEditable (item) {
    if (item.enableCellEdit) return true;
  }

  AngularDataTable.prototype.initialize = function () {
    BasicAngularElement.prototype.initialize.call(this);

    var editable = lib.traverseConditionally (this.getConfigVal('grid.columnDefs'), checkIfEditable);
    var $container = $('<div class="table_container"></div>');
    $container.attr('ui-grid', '_ctrl.gridOptions');
    $container.attr('ui-grid-auto-resize', '');

    if (editable) {
      $container.attr('ui-grid-edit','');
    }
    $container.addClass('grid');

    this.$element.attr({'data-allex-angular-data-table': ''});
    this.$element.append($container);
    var $actions = this.findDomReference('actions');

    if ($actions.length === 0) {
      return;
    }
    this.config.grid.columnDefs.unshift ({ displayName: $actions.attr('data-title') || 'Actions', cellTemplate: $actions.html(), field: '-'});
  };

  AngularDataTable.prototype._onScope = function (_ctrl) {
    var _cbmap = {
      appendNewRow : this.appendNewRow.bind(this)
    };

    if (this.$element.find('.grid.table_container').attr('ui-grid-edit') === '') {
      _cbmap.afterEdit = this.afterEdit.fire.bind(this.afterEdit);
    }


    _ctrl.set('_cbmap', _cbmap);
    _ctrl.set('gridOptions', this.config.grid);
  };

  AngularDataTable.prototype.set_data = function (data) {
    var ret = DataElementMixIn.prototype.set_data.call(this,data);
    if (this.hasDataChanged(ret)) this.$scopectrl.set('data', data);
  };

  AngularDataTable.prototype.appendNewRow = function (current_length) {
    var row = {};

    if (this.getConfigVal('config.bSetNewRowProps')) {
      ///TODO: uzmi iz grid options columnDefs i popuni row sa null ...
    }

    var f = this.getConfigVal('config.fAppendNewRow');
    return f ? f(current_length, row) : row;
  };

  AngularDataTable.prototype.get_rows = function () {
    return this.$scopectrl.api ? this.$scopectrl.api.grid.rows : null;
  };

  AngularDataTable.prototype.getElement = function (path) {
    if ('$element' === path) return this.$element;
    return BasicAngularElement.prototype.getElement.call(this, path);
  };


  AngularDataTable.prototype.set_row_count = function (rc) {
    ///TODO: proveri samo da li ce da okine event ...
    return this.$scopectrl.set('row_count', rc);
  };

  AngularDataTable.prototype.get_row_count = function () {
    return this.$scopectrl.get('row_count');
  };

  module.elements.AngularDataTable = AngularDataTable;
  applib.registerElementType('AngularDataTable', AngularDataTable);

  //This is angular part of code ... //and what about this ... raise ....
  function AllexAngularDataTableController ($scope, $parse) {
    AngularDataAwareController.call(this, $scope);
    CBMapable.call(this);
    this.data = [];
    this.gridOptions = null;
    this.api = null;

    this._parse = $parse;
    this._getActualData = null;
    this._listenToEditEvents = false;
  }
  lib.inherit (AllexAngularDataTableController, AngularDataAwareController);
  CBMapable.addMethods (AllexAngularDataTableController);


  AllexAngularDataTableController.prototype.__cleanUp = function () {
    this._getActualData = null;
    this._parse = null;
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
    if (lib.isString(this.gridOptions.data)) {
      this._getActualData = this._parse (this.gridOptions.data).bind(null, this.scope);
    }else{
      this._getActualData = doReturn.bind(null, this.gridOptions.data);
    }
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
    if (!this._getActualData) return false; ///TODO ...

    var rows = this._getActualData();
    if (!lib.isArray(rows)) return false; ///TODO ...

    var rc = rows.length,
      new_row = null;

    if (val === rc) return false;

    if (val < rc) {
      rows.splice (val, rc-val);
    }else{
      while (rows.length < val) {
        new_row = this.call_cb('appendNewRow', [rows.length]);
        console.log('will append new row ...', new_row);
        rows.push (new_row);
      }
    }
    return true;
  };

  AllexAngularDataTableController.prototype.get_row_count = function () {
    if (!this._getActualData) return null;
    var d = this._getActualData();
    return lib.isArray(d) ? d.length : null;
  };

  angular_module.controller('allexAngularDataTableController', ['$scope', '$parse', function ($scope, $parse) {
    new AllexAngularDataTableController($scope, $parse);
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
(function (allex, module, applib, angular, $) {
  'use strict';

  var lib = allex.lib,
  BasicResourceLoader = applib.BasicResourceLoader,
  q = lib.q;

  function AngularBootstrapper (options, app) {
    BasicResourceLoader.call(this, options);
    this._dependentElements = new lib.Map ();
    app.ready(this._onReady.bind(this));
  }
  lib.inherit (AngularBootstrapper, BasicResourceLoader);

  AngularBootstrapper.prototype.__cleanUp = function () {
    this._dependentElements.destroy();
    this._dependentElements = null;
    BasicResourceLoader.prototype.__cleanUp.call(this);
  };

  AngularBootstrapper.prototype.load = function (){
    return q.resolve('ok');
  };

  AngularBootstrapper.prototype._onReady = function (defer) {
    var deps = this.getConfigVal('angular_dependencies');
    if (deps) {
      if (deps.indexOf('allex_applib') < 0) deps.push ('allex_applib');
      if (deps.indexOf('allex__web_angularcomponent') < 0) deps.push ('allex__web_angularcomponent');
    }else{
      deps = ['allex_applib'];
    }
    angular.module('AllexActiveApp', deps);
    angular.bootstrap(document, ['AllexActiveApp']);
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
