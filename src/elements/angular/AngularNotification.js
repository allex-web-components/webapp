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
