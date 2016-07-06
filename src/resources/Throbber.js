(function (allex, module, applib, $) {
  'use strict';

  var lib = allex.lib,
    BasicResourceLoader = applib.BasicResourceLoader,
    q = lib.q;


    var CONFIG_SCHEMA = {
      type: 'object',
      properties: {
        'selector': {type:'string'},
        'searchForCurrent' : {type: 'boolean'}
      },
      required : ['selector']
    };

    function Throbber (options){
      BasicResourceLoader.call(this,options);
      this.$element = null;
      this.pending = [];
    }
    lib.inherit (Throbber, BasicResourceLoader);
    Throbber.prototype.__cleanUp = function () {
      this.pending = null;
      this.$element = null;
      BasicResourceLoader.prototype.__cleanUp.call(this);
    };


    Throbber.prototype.CONFIG_SCHEMA = function () { return CONFIG_SCHEMA; };
    Throbber.prototype.DEFAULT_CONFIG = function () { return null; };

    Throbber.prototype.load = function () {
      var d = q.defer();
      $(document).ready(this._go.bind(this, d));
      return d.promise;
    };

    Throbber.prototype._go = function (defer){
      this.$element = $(this.getConfigVal('selector'));
      if (!this.$element || !this.$element.length) return defer.reject(new Error('Unable to find throbber'));
      if (!this.getConfigVal('searchForCurrent')) {
        this.$element.hide();
        defer.resolve('ok');
        return defer.promise;
      }
      applib.traverseResources(this._inspectResource.bind(this));
      this.recheckPendings();
      return defer.resolve('ok');
    };

    Throbber.prototype._inspectResource = function (res, id){
      if (this === res.instance) return;
      this.addPromise (res.promise);
    };

    Throbber.prototype.addPromise = function (promise) {
      this.pending.push (promise);
      promise.done(this._onPromiseDone.bind(this, promise), this._onPromiseDone.bind(this, promise));
      this.recheckPendings();
    };

    Throbber.prototype._onPromiseDone = function (promise) {
      var index = this.pending.indexOf(promise);
      if (index < 0) return; //nothing to be done
      this.pending.splice(index, 1);
      this.recheckPendings();
    };

    Throbber.prototype.recheckPendings = function () {
      if (this.pending.length) {
        this.$element.show();
      }else{
        this.$element.hide();
      }
    };

    module.resources.Throbber = Throbber;
    applib.registerResourceType('Throbber', Throbber);
})(ALLEX, ALLEX.WEB_COMPONENTS.allex_web_webappcomponent, ALLEX.WEB_COMPONENTS.allex_applib, jQuery);
