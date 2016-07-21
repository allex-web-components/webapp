(function (allex, module, applib, angular_module) {
  'use strict';

  var lib = allex.lib,
    AngularDataAwareController = module.elements.AngularDataAwareController,
    DataElementMixIn = module.mixins.DataElementMixIn,
    BasicAngularElement = module.elements.BasicAngularElement,
    q = lib.q;


    ///This is allexApp part of code ....
    function ActiveDOM (id, options) {
      BasicAngularElement.call(this, id, options);
      DataElementMixIn.call(this);
    }
    lib.inherit (ActiveDOM, BasicAngularElement);
    DataElementMixIn.addMethods(ActiveDOM);

    ActiveDOM.prototype.__cleanUp = function () {
      DataElementMixIn.prototype.__cleanUp.call(this);
      BasicAngularElement.prototype.__cleanUp.call(this);
    };

    ActiveDOM.prototype.initialize = function () {
      BasicAngularElement.prototype.initialize.call(this);
      this.$element.attr('data-allex-active-dom', '');
    };

    module.elements.ActiveDOM = ActiveDOM;
    applib.registerElementType('ActiveDOM', ActiveDOM);

  
    //This is angular part of code ...
    function AllexActiveDomController ($scope) {
      AngularDataAwareController.call(this, $scope);
      this.data = null;
    }
    lib.inherit (AllexActiveDomController, AngularDataAwareController);
    AllexActiveDomController.prototype.__cleanUp = function () {
      this.data = null;
      AngularDataAwareController.prototype.__cleanUp.call(this);
    };

    angular_module.controller('allexActiveDomController', ['$scope', function ($scope) {
      new AllexActiveDomController($scope);
    }]);

    angular_module.directive ('allexActiveDom', [function () {
      return {
        restrict : 'A',
        scope: true,
        controller: 'allexActiveDomController',
        link : function ($scope, $el, $attribs) {
          $scope._ctrl.elementReady ($el);
        }
      };
    }]);

})(ALLEX, ALLEX.WEB_COMPONENTS.allex_web_webappcomponent, ALLEX.WEB_COMPONENTS.allex_applib, angular.module('allex_applib'));
