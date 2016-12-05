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
    this.afterEdit = new lib.HookCollection();
    if (!this.config.grid.data) this.config.grid.data = '_ctrl.data';
  }
  lib.inherit(AngularDataTable, BasicAngularElement);

  AngularDataTable.prototype.__cleanUp = function () {
    this.afterEdit.destroy();
    this.afterEdit = null;
    BasicAngularElement.prototype.__cleanUp.call(this);
  };

  function checkIfEditable (item) {
    checkIfPropIsTrue ('enableCellEdit', item);
  }

  function checkIfResizable (item) {
    checkIfPropIsTrue ('enableColumnResizing', item);
  }

  function checkIfPropIsTrue (prop, item) {
    if (item[prop]) return true;
  }

  AngularDataTable.prototype._replaceCellTemplate = function (item, index, arr) {
    if (!item.cellTemplate || item.cellTemplate.charAt(0) !== '#') return;
    item.cellTemplate = jQuery('#references > '+item.cellTemplate).html();
  };

  AngularDataTable.prototype.initialize = function () {
    BasicAngularElement.prototype.initialize.call(this);

    var editable = this.config.grid.enableCellEdit || lib.traverseConditionally (this.getColumnDefs(), checkIfEditable);
    var resizable = this.config.grid.enableColumnResizing || lib.traverseConditionally (this.getColumnDefs(), checkIfResizable);
    var noDataContent = this.getConfigVal('noDataContent');
    var dataString = this.getConfigVal('grid.data');
    this.getColumnDefs().forEach (this._replaceCellTemplate.bind(this));

    var $container = $('<div class="table_container" ng-show="'+dataString+'.length"></div>');
    var $noDataContainer = $('<div class="no_data_container" ng-show = "'+dataString+ ' && !'+dataString+'.length"></div>');

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
      this.config.grid.columnDefs.unshift (lib.extend ({}, actions, {field : '-'}));
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
    _ctrl.set('gridOptions', this.config.grid);
  };

  AngularDataTable.prototype.set_data = function (data) {
    var ret = BasicAngularElement.prototype.set_data.call(this, data);
    if (false === ret) return;

    this.executeOnScopeIfReady ('set', ['data', data]);
    this.executeOnScopeIfReady ('api.core.refresh');
  };

  AngularDataTable.prototype.appendNewRow = function (current_length) {
    var row = {};

    if (this.getConfigVal('config.bSetNewRowProps')) {
      ///TODO: uzmi iz grid options columnDefs i popuni row sa null ...
    }

    var f = this.getConfigVal('config.fAppendNewRow');
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
    if (this.isScopeReady()){
      var column = this.getApi().grid.getColumn (name);
      return column ? column.colDef : null;
    }
    return lib.arryOperations.findElementWithProperty (this.getColumnDefs(), 'name', name);
  };

  AngularDataTable.prototype.refreshGrid = function () {
    this.executeOnScopeIfReady ('api.grid.refresh');
  };

  module.elements.AngularDataTable = AngularDataTable;
  applib.registerElementType('AngularDataTable', AngularDataTable);
  module.ANGULAR_REQUIREMENTS.add ('AngularDataTable', ['ui.grid','ui.grid.edit', 'ui.grid.autoResize', 'ui.grid.resizeColumns']);

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
        //console.log('will append new row ...', new_row);
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
