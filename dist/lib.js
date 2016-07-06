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
//samo da te vidim
(function (allex, module, applib, $) {
  'use strict';

  var lib = allex.lib,
    BasicResourceLoader = applib.BasicResourceLoader,
    q = lib.q;

  var CONFIG_SCHEMA = {
    type : 'object',
    properties: {
      urls : {
        type: 'array',
        items: {type: 'string'}
      },
      families : {
        type : 'array',
        items: {type: 'string'}
      }
    }
  };

  function FontLoader (options) {
    BasicResourceLoader.call(this, options);
    if (!window.WebFont) throw new Error('No WebFont component loaded, unable to load resource');
  }
  lib.inherit(FontLoader, BasicResourceLoader);
  FontLoader.prototype.__cleanUp = function () {
    BasicResourceLoader.prototype.__cleanUp.call(this);
  };

  FontLoader.prototype.CONFIG_SCHEMA = function () { return CONFIG_SCHEMA; };
  FontLoader.prototype.DEFAULT_CONFIG = function () { return null; };

  FontLoader.prototype.load = function () {
    var d = q.defer();
    $(document).ready(this._go.bind(this, d));
    return d.promise;
  };

  FontLoader.prototype._go = function (defer) {
    WebFont.load({
      custom : {
        families: this.getConfigVal('families'),
        urls : this.getConfigVal('urls')
      },
      active: defer.resolve.bind(defer, 'ok')
    });
  };

  module.resources.FontLoader = FontLoader;
  applib.registerResourceType('FontLoader', FontLoader);

})(ALLEX, ALLEX.WEB_COMPONENTS.allex_web_webappcomponent, ALLEX.WEB_COMPONENTS.allex_applib, jQuery);
//samo da te vidim
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
        console.log('nema vise nista ..');
        this.$element.hide();
      }
    };

    module.resources.Throbber = Throbber;
    applib.registerResourceType('Throbber', Throbber);
})(ALLEX, ALLEX.WEB_COMPONENTS.allex_web_webappcomponent, ALLEX.WEB_COMPONENTS.allex_applib, jQuery);
