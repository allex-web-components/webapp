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
