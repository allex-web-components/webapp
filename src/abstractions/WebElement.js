(function (allex, module, applib, $) {
  'use strict';

  var lib = allex.lib,
    BasicElement = applib.BasicElement,
    resourceFactory = applib.resourceFactory,
    q = lib.q;

  function WebElement (id, options)  {
    BasicElement.call(this, id, options);
    this.$element = null;
    this.loaded = null;
    this.in_progress = null;
  }
  lib.inherit (WebElement, BasicElement);

  WebElement.prototype.__cleanUp = function () {
    if (this.in_progress) this.in_progress.reject (new Error('Going down...'));
    this.in_progress = null;
    this.loaded = null;
    this.$element = null;
    BasicElement.prototype.__cleanUp.call(this);
  };

  WebElement.prototype.initialize = function () {
    BasicElement.prototype.initialize.call(this);
    this.$element = this.__parent.$element.find('#'+this.get('id'));
    if (!this.$element || !this.$element.length) throw new Error('Unable to find DOM element '+this.get('id'));
    this.set_actual(this.get('actual'));
  };

  WebElement.prototype.set_actual = function (val) {
    BasicElement.prototype.set_actual.call(this, val);
    if (!this.$element) return;
    if (val) {
      if (this.loaded) {
        this.show();
      }else{
        var p = this.load();
        p.done(this.set.bind(this, 'loaded', true));
        p.done(this.show.bind(this));
        this.set('in_progress', p);
      }
    }else{
      this.hide();
      this.unload();
      this.set('loaded', false);
    }
  };

  WebElement.prototype.load = function () {
    var resources = this.getConfigVal('resources');
    if (!resources || !resources.length) return q.resolve('ok');
    var promise = q.all(resources.map (resourceFactory));

    var throbber = applib.getResource('MainThrobber');
    if (throbber){
      throbber.addPromise(promise);
    }
    return promise;
  };


  WebElement.prototype.unload = function () {
    throw new Error('Unload not implemented');
  };

  WebElement.prototype.show = function () {
    this.$element.show();
  };

  WebElement.prototype.hide = function () {
    this.$element.hide();
  };

  WebElement.ResourcesSchema = {
    type : "array",
    items: {
      type: "object",
      properties : {
        type : { type : 'string' },
        name : { type : 'string' },
        options : {type : 'object'}
      },
      additionalProperties: false,
      required : ['type', 'name']
    }
  };

  module.abstractions.WebElement = WebElement;

})(ALLEX, ALLEX.WEB_COMPONENTS.allex_web_webappcomponent, ALLEX.WEB_COMPONENTS.allex_applib, jQuery);
