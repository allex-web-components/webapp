(function (allex, applib) {
  'use strict';
  allex.WEB_COMPONENTS.allex_web_webappcomponent = {
    abstractions : {},
    resources : {},
    APP : null,
    elements: {}
  };
})(ALLEX, ALLEX.WEB_COMPONENTS.allex_applib);

//samo da te vidim
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
    return q.all(resources.map (resourceFactory));
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
//samo da te vidim
(function (allex, module, applib, $) {
  'use strict';

  var lib = allex.lib,
    WebElement = module.abstractions.WebElement,
    BasicElement = applib.BasicElement,
    q = lib.q;

  function WebPage (id, options){
    WebElement.call(this, id, options);
  }
  lib.inherit (WebPage, WebElement);
  WebPage.prototype.__cleanUp = function () {
    WebElement.prototype.__cleanUp.call(this);
  };

  WebPage.prototype.initialize = function () {
    this.$element = $('body #'+this.get('id'));
    if (!this.$element.length) throw new Error('Unable to find page element '+this.get('id')+' as body child');
    BasicElement.prototype.initialize.call(this);
  };

  WebPage.prototype.createElements = function (elements) {
    return WebElement.prototype.createElements.call(this, elements);
  };

  module.abstractions.WebPage = WebPage;
})(ALLEX, ALLEX.WEB_COMPONENTS.allex_web_webappcomponent, ALLEX.WEB_COMPONENTS.allex_applib, jQuery);

//samo da te vidim
(function (allex, module, applib) {
  'use strict';

  var lib = allex.lib,
    BasicResourceLoader = applib.BasicResourceLoader,
    ZipLoader = ALLEX.WEB_COMPONENTS['allex_vektr.imageanimations'].ZipLoader;


  var CONFIG_SCHEMA = {
    type : 'object',
    properties : {
      url : { type : 'string' },
      extractor : {type : 'string'}
    },
    required : ['url']
  };

  function AnimatedImageZipLibrary (options) {
    BasicResourceLoader.call(this, options);
    this.zl = null;
  }
  lib.inherit (AnimatedImageZipLibrary, BasicResourceLoader);
  AnimatedImageZipLibrary.prototype.__cleanUp = function () {
    ///TODO
    BasicResourceLoader.prototype.__cleanUp.call(this);
  };

  AnimatedImageZipLibrary.prototype.load = function () {
    var extractor = this.getConfigVal('extractor');
    this.zl = new ZipLoader(extractor ? new RegExp(extractor) : null);
    var p = this.zl.load(this.getConfigVal('url'));

    p.done (console.log.bind(console, 'gotovo'), console.log.bind(console, 'puklo'));

    return p;
  };

  AnimatedImageZipLibrary.prototype.CONFIG_SCHEMA = function () { return CONFIG_SCHEMA; };
  AnimatedImageZipLibrary.prototype.DEFAULT_CONFIG = function () { return null; };

  AnimatedImageZipLibrary.prototype.get = function (id) {
    return this.zl ? this.zl.result.get(id) : null;
  };

  module.resources.AnimatedImageZipLibrary = AnimatedImageZipLibrary;
  applib.registerResourceType ('AnimatedImageZipLibrary', AnimatedImageZipLibrary);
})(ALLEX, ALLEX.WEB_COMPONENTS.allex_web_webappcomponent, ALLEX.WEB_COMPONENTS.allex_applib);
