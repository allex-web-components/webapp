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

    function AngularFormElement(id, options) {
      BasicAngularElement.call(this, id, options);
    }
    lib.inherit(AngularFormElement, BasicAngularElement);
    AngularFormElement.prototype.set_data = function (val) {
      var ret = DataElementMixIn.prototype.set_data.call(this, val),
        parentscopectrl, myname;

      if (DataElementMixIn.prototype.hasDataChanged.call(this, ret)){
        parentscopectrl = this.__parent.$scopectrl;
        myname = this.$element.attr('name');
        if (parentscopectrl && myname) {
          parentscopectrl.data[myname] = val;
        }
      }
      return ret;
    };
    module.elements.AngularFormElement = AngularFormElement;
    applib.registerElementType('AngularFormElement', AngularFormElement);


  
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
