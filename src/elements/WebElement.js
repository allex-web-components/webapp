(function (allex, module, applib, $) {
  'use strict';

  var lib = allex.lib,
    BasicElement = applib.BasicElement,
    resourceFactory = applib.resourceFactory,
    q = lib.q;

  function WebElement (id, options)  {
    BasicElement.call(this, id, options);
    this.$element = null;
  }
  lib.inherit (WebElement, BasicElement);

  WebElement.prototype.__cleanUp = function () {
    this.$element = null;
    BasicElement.prototype.__cleanUp.call(this);
  };

  WebElement.prototype.initialize = function () {
    BasicElement.prototype.initialize.call(this);
    this.$element = $('#'+this.get('id'));
    if (!this.$element || !this.$element.length) throw new Error('Unable to find DOM element '+this.get('id'));
    this.set_actual(this.get('actual'));
    if (lib.isFunction (this.getConfigVal ('onInitialized'))){
      this.getConfigVal('onInitialized')(this);
    }
  };

  WebElement.prototype.set_actual = function (val) {
    if (!this.$element) return false;
    if (this.get('id') === 'backoffice_layout'){
      console.log('will set actual to', val);
    }
    return BasicElement.prototype.set_actual.call(this, val);
  };

  WebElement.prototype.onUnloaded = function () {
    this.hide();
  };

  WebElement.prototype.onLoaded = function () {
    if (this.get('actual')) this.show();
  };

  WebElement.prototype.onLoadFailed = function () {
    //TODO
  };

  WebElement.prototype.onLoadProgress = function () {
    //TODO
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

  WebElement.prototype.show = function () {
    //console.log('will show ', this.get('id'));
    this.$element.show();
  };

  WebElement.prototype.hide = function () {
    //console.log('will hide',this.get('id'));
    this.$element.hide();
  };

  WebElement.prototype.getElement = function (path) {
    //e, aj vidi u cemu je ovde fora ... jel .$element ili je $element ili sta je koji moj ... i gledaj samo pocetak sa replace ....
    var ret, elempath;
    if (path.indexOf('$element.') === 0){
      elempath = '#'+path.replace('$element.', '');
      ret = this.$element.find(elempath);
    }
    if (path.indexOf('.$element.') === 0) {
      elempath = '#'+path.replace('.$element.', '');
      ret = this.$element.find(elempath);
    }
    if (ret) {
      if (ret.length===0) {
        throw new lib.Error('JQUERY_FIND_FAILED', 'jQuery could not find '+elempath);
      }
      return ret;
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
