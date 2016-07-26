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
    _ctrl.set('raise', this.$element.trigger.bind(this.$element));
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

  AngularDataTable.prototype.set_actual = function (val) {
    var ret = BasicAngularElement.prototype.set_actual.call(this, val),
      $window = $(window);
    lib.runNext ($window.resize.bind($window), 300); //crappy approach. but chceck if ui-grid does requires it, maybe you can fix it ;) ...
    return ret;
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
    this.data = null;
    this.gridOptions = null;
    this.raise = null;
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
    this.raise = null;
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

  AllexAngularDataTableController.prototype.raiseEvent = function (name, val){
    this.raise(name, val);
  };

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