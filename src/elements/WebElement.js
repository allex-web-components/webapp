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
    this.$element = $('#'+this.get('id'));
    if (!this.$element || !this.$element.length) throw new Error('Unable to find DOM element '+this.get('id'));
    this.set_actual(this.get('actual'));
  };

  WebElement.prototype.set_actual = function (val) {
    var ret = BasicElement.prototype.set_actual.call(this, val);
    if (!this.$element) return ret;
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
      this.set('loaded', false);
    }
    return ret;
  };

  WebElement.prototype.set_loaded = function (val) {
    if (this.loaded == val) return false;
    var prev = this.loaded;
    this.loaded = val;
    if (!val && prev) {
      this.unload();
    }

    return true;
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


  WebElement.prototype.unload = lib.dummyFunc;

  WebElement.prototype.show = function () {
    this.$element.show();
  };

  WebElement.prototype.hide = function () {
    this.$element.hide();
  };

  WebElement.prototype.getElement = function (path) {
    //e, aj vidi u cemu je ovde fora ... jel .$element ili je $element ili sta je koji moj ... i gledaj samo pocetak sa replace ....
    if (path.indexOf('$element.') === 0){
      return this.$element.find('#'+path.replace('$element.', ''));
    }
    if (path.indexOf('.$element.') === 0) {
      return this.$element.find('#'+path.replace('.$element.', ''));
    }

    path = path.replace (/^\./, '');

    if (path === '$element')  {
      return this.$element;
    }

    if (path === '.') {
      return this.getMeAsElement();
    }

    return this.childAtPath(path);
  };

  WebElement.prototype.findById = function (id) {
    if ('$element' === id) return this.$element;
    return BasicElement.prototype.findById.call(this,id);
  };

  WebElement.prototype.getMeAsElement = function () {
    //return this.$element;
    return this;
  };

  WebElement.prototype.findDomReference = function (type){
    if (!type) throw new Error('No type given');
    var id = this.id;
    return jQuery('#references #references_'+id+' #references_'+id+'_'+type);
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

  module.elements.WebElement = WebElement;
  applib.registerElementType ('WebElement',WebElement);

})(ALLEX, ALLEX.WEB_COMPONENTS.allex_web_webappcomponent, ALLEX.WEB_COMPONENTS.allex_applib, jQuery);
