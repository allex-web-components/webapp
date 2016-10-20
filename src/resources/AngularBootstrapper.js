(function (allex, module, applib, angular, $) {
  'use strict';

  var lib = allex.lib,
  BasicResourceLoader = applib.BasicResourceLoader,
  q = lib.q;

  function AngularBootstrapper (options, app) {
    BasicResourceLoader.call(this, lib.extend ({}, options, {ispermanent : true}));
    this._dependentElements = new lib.Map ();
    app.ready(this._onReady.bind(this));
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

  AngularBootstrapper.prototype._onReady = function (defer) {
    var deps = this.getConfigVal('angular_dependencies');
    if (deps) {
      if (deps.indexOf('allex_applib') < 0) deps.push ('allex_applib');
      if (deps.indexOf('allex__web_angularcomponent') < 0) deps.push ('allex__web_angularcomponent');
    }else{
      deps = ['allex_applib'];
    }
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
