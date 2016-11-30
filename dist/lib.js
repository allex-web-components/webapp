(function (allex, applib, linkinglib) {
  'use strict';

  var lib = allex.lib,
    EventEmitterHandler = linkinglib.eventEmitterHandlingRegistry.EventEmitterHandler,
    PropertyTargetHandler = linkinglib.propertyTargetHandlingRegistry.PropertyTargetHandler;
  
  function JQueryChangeEventEmitterHandler (eventemitter, eventname) {
    EventEmitterHandler.call(this, eventemitter, eventname); 
    this.name = eventname;
    this.listener = null;
  }
  lib.inherit(JQueryChangeEventEmitterHandler, EventEmitterHandler);
  JQueryChangeEventEmitterHandler.prototype.destroy = function () {
    if (this.listener) { 
      this.emitter.off(this.name, this.listener);
    }
    this.listener = null;
    this.name = null;
    EventEmitterHandler.prototype.destroy.call(this);
  };
  JQueryChangeEventEmitterHandler.prototype.raiseEvent = function () {
    this.emitter.trigger.call(this.emitter, this.name, Array.prototype.slice.call(arguments));
  };    
  JQueryChangeEventEmitterHandler.prototype.listenToEvent = function (cb) {
    if (!this.listener) {
      this.listener = cb;
      if (this.name === 'change') {
        this.emitter.on(this.name, this._handleChange.bind(this, cb));
      }else{
        this.emitter.on(this.name, cb);
      }
      return this;
    } 
  };
  JQueryChangeEventEmitterHandler.prototype._handleChange = function (cb, evnt) {
    cb(jQuery(evnt.target).val());
  };

  JQueryChangeEventEmitterHandler.recognizer = function (emitterwithname) {
    if (emitterwithname &&
      emitterwithname.emitter &&
      emitterwithname.emitter.is &&
      (emitterwithname.emitter.is('input')) &&
      lib.isFunction(emitterwithname.emitter.on) &&
      lib.isFunction(emitterwithname.emitter.off) &&
      lib.isFunction(emitterwithname.emitter.bind) &&
      lib.isFunction(emitterwithname.emitter.unbind) &&
      lib.isFunction(emitterwithname.emitter.trigger)) {
      return JQueryChangeEventEmitterHandler;
    }
  };
  linkinglib.eventEmitterHandlingRegistry.register(JQueryChangeEventEmitterHandler.recognizer);

 
  function JQueryEventEmitterHandler (eventemitter, eventname) {
    EventEmitterHandler.call(this, eventemitter, eventname); 
    this.name = eventname;
    this.listener = null;
  }
  lib.inherit(JQueryEventEmitterHandler, EventEmitterHandler);
  JQueryEventEmitterHandler.prototype.destroy = function () {
    if (this.listener) { 
      this.emitter.off(this.name, this.listener);
    }
    this.listener = null;
    this.name = null;
    EventEmitterHandler.prototype.destroy.call(this);
  };
  JQueryEventEmitterHandler.prototype.raiseEvent = function () {
    this.emitter.trigger.call(this.emitter, this.name, Array.prototype.slice.call(arguments));
  };    
  JQueryEventEmitterHandler.prototype.listenToEvent = function (cb) {
    if (!this.listener) {
      this.listener = cb;
      //console.log('subscribing ...', this.name, this.emitter.attr('id'));
      this.emitter.on(this.name, cb);
      return this;
    } 
  };    
  JQueryEventEmitterHandler.recognizer = function (emitterwithname) {
    if (emitterwithname &&
      emitterwithname.emitter &&
      lib.isFunction(emitterwithname.emitter.on) &&
      lib.isFunction(emitterwithname.emitter.off) &&
      lib.isFunction(emitterwithname.emitter.bind) &&
      lib.isFunction(emitterwithname.emitter.unbind) &&
      lib.isFunction(emitterwithname.emitter.trigger)) {

      return JQueryEventEmitterHandler;
    }
  };
  linkinglib.eventEmitterHandlingRegistry.register(JQueryEventEmitterHandler.recognizer);

 
  function JQueryPropertyTargetHandler (propertycarrier, propertyname) {
    PropertyTargetHandler.call(this, propertycarrier, propertyname); 
    var sp = propertyname.split('.');
    this.method = sp[0] === 'class' ? 'addClass' : sp[0];
    this.removeMethod = this._chooseRemover();
    this.prop = sp[1];
  }

  lib.inherit(JQueryPropertyTargetHandler, PropertyTargetHandler);
  JQueryPropertyTargetHandler.prototype.destroy = function () {
    this.removeMethod = null;
    this.method = null;
    this.prop = null;
    this.method = null;
    PropertyTargetHandler.prototype.destroy.call(this);
  };

  JQueryPropertyTargetHandler.prototype._chooseRemover = function () {
    switch (this.method) {
      case 'attr': return 'removeAttr';
      case 'class':return 'removeClass';
      case 'prop': return 'removeProp';
      case 'css' : return 'css';
    }
  };

  JQueryPropertyTargetHandler.prototype.handle = function (val) {
    //console.log(this.carrier, this.method, this.prop, val);
    this.carrier[lib.isUndef(val) ? this.removeMethod : this.method](this.prop, val);
  };
  
  JQueryPropertyTargetHandler.recognizer = function (carrierwithname) {
    var sp = carrierwithname.name.split('.');
    if (!(sp[0] === 'attr' || sp[0] === 'css' || sp[0] === 'prop' || sp[0] === 'class')) return;

    if (carrierwithname &&
      carrierwithname.carrier &&
      lib.isFunction(carrierwithname.carrier.on) &&
      lib.isFunction(carrierwithname.carrier.off) &&
      lib.isFunction(carrierwithname.carrier.bind) &&
      lib.isFunction(carrierwithname.carrier.unbind) &&
      lib.isFunction(carrierwithname.carrier.trigger)) {
      return JQueryPropertyTargetHandler;
    }
  };
  linkinglib.propertyTargetHandlingRegistry.register(JQueryPropertyTargetHandler.recognizer);

  function JQueryDefinedPropertyTargetHandler (propertycarrier) {
    PropertyTargetHandler.call(this, propertycarrier, this.propertyName);
  }
  lib.inherit(JQueryDefinedPropertyTargetHandler, PropertyTargetHandler);
  JQueryDefinedPropertyTargetHandler.prototype.handle = function (val) {
    this.carrier[this.propertyName](val);
  };

  function JQueryValTargetHandler (propertycarrier) {
    JQueryDefinedPropertyTargetHandler.call(this, propertycarrier);
  }
  lib.inherit(JQueryValTargetHandler, JQueryDefinedPropertyTargetHandler);
  JQueryValTargetHandler.prototype.propertyName = 'val';
  JQueryValTargetHandler.recognizer = function (carrierwithname) {
    if (carrierwithname.name !== 'val') return;
    return JQueryValTargetHandler;
  };
  linkinglib.propertyTargetHandlingRegistry.register(JQueryValTargetHandler.recognizer);

  function JQueryTextTargetHandler (propertycarrier) {
    JQueryDefinedPropertyTargetHandler.call(this, propertycarrier);
  }
  lib.inherit(JQueryTextTargetHandler, JQueryDefinedPropertyTargetHandler);
  JQueryTextTargetHandler.prototype.propertyName = 'text';
  JQueryTextTargetHandler.recognizer = function (carrierwithname) {
    if (carrierwithname.name !== 'text') return;
    return JQueryTextTargetHandler;
  };
  linkinglib.propertyTargetHandlingRegistry.register(JQueryTextTargetHandler.recognizer);

  function JQueryHtmlTargetHandler (propertycarrier) {
    JQueryDefinedPropertyTargetHandler.call(this, propertycarrier);
  }
  lib.inherit(JQueryHtmlTargetHandler, JQueryDefinedPropertyTargetHandler);
  JQueryHtmlTargetHandler.prototype.propertyName = 'html';
  JQueryHtmlTargetHandler.recognizer = function (carrierwithname) {
    if (carrierwithname.name !== 'html') return;
    return JQueryHtmlTargetHandler;
  };
  linkinglib.propertyTargetHandlingRegistry.register(JQueryHtmlTargetHandler.recognizer);
})(ALLEX, ALLEX.WEB_COMPONENTS.allex_applib, ALLEX.WEB_COMPONENTS.allex_applinkinglib);
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
    this._addHook ('onShown');
    this._addHook ('onHidden');
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
    this.fireInitializationDone();
    this.attachHook ('onShown', this.getConfigVal('onShown'));
    this.attachHook ('onHidden', this.getConfigVal('onHidden'));
    this.set_actual(!!this.get('actual'));
  };

  WebElement.prototype.set_actual = function (val) {
    if (!this.$element) {
      this.actual = val;
    }
    return BasicElement.prototype.set_actual.call(this, val);
  };

  WebElement.prototype.onUnloaded = function () {
    this.hide();
  };

  WebElement.prototype.onLoaded = function () {
    if (this.get('actual')) {
      this.show();
    }
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

  WebElement.prototype.resetElement = function (ext) {
    var resetf = this.getConfigVal('reset');
    if (lib.isFunction(resetf)) resetf(this, ext);
  };

  WebElement.prototype.show = function () {
    if (!this.$element) return;
    var visible_class = this.getConfigVal('visible_class'),
      show_jq_function = this.getConfigVal('show_jq_function');

    if (visible_class) {
      this.$element.addClass(visible_class);
    }

    if (show_jq_function) {
      if (lib.isString(show_jq_function)){
        this.$element[show_jq_function]();
      }

      if (lib.isArray(show_jq_function)){
        var name = show_jq_function[0];
        this.$element[name].apply(this.$element, show_jq_function.slice(1));
      }
    }else{
      this.$element.show();
    }
    this.fireHook ('onShown');
  };

  WebElement.prototype.hide = function () {
    if (!this.$element) return;
     var visible_class = this.getConfigVal('visible_class'),
      hide_jq_function = this.getConfigVal('hide_jq_function');

    if (visible_class) {
      this.$element.removeClass(visible_class);
    }

    if (hide_jq_function) {
      if (lib.isString(hide_jq_function)){
        this.$element[hide_jq_function]();
      }

      if (lib.isArray(hide_jq_function)){
        var name = hide_jq_function[0];
        this.$element[name].apply(this.$element, hide_jq_function.slice(1));
      }
    }else{
      this.$element.hide();
    }

    this.fireHook('onHidden');
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
//samo da te vidim
(function (allex, module, applib) {
  'use strict';

  var lib = allex.lib,
    qlib = lib.qlib,
    q = lib.q,
    BasicResourceLoader = applib.BasicResourceLoader;

  var CONFIG_SCHEMA = {
    type : 'object',
    properties : {
      url : { type : 'string' },
      extractor : {type : 'string'},
      ispermanent : {type : 'boolean'}
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

  AnimatedImageZipLibrary.prototype.doLoad = function () {
    var defer = q.defer();
    var extractor = this.getConfigVal('extractor');
    var ZipLoader = ALLEX.WEB_COMPONENTS['allex_vektr.imageanimations'].ZipLoader;
    this.zl = new ZipLoader(extractor ? new RegExp(extractor) : null);
    var p = this.zl.load(this.getConfigVal('url'));

    p.done (console.log.bind(console, 'Zip '+this.getConfigVal('url')+' has been unpacked successfully'), console.log.bind(console, 'Failed to unpack '+this.getConfigVal('url')));
    qlib.promise2defer(p, defer);
    return defer;
  };

  AnimatedImageZipLibrary.prototype.CONFIG_SCHEMA = function () { return CONFIG_SCHEMA; };
  AnimatedImageZipLibrary.prototype.DEFAULT_CONFIG = function () { return null; };

  AnimatedImageZipLibrary.prototype.get = function (id) {
    return this.zl ? this.zl.result.get(id) : null;
  };

  AnimatedImageZipLibrary.prototype.loadOnDemand = function () { return true; };

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
      },
      ispermanent : {type : 'boolean'}
    }
  };

  function FontLoader (options) {
    BasicResourceLoader.call(this, lib.extend ({} , options, {ispermanent : true}));
    if (!window.WebFont) throw new Error('No WebFont component loaded, unable to load resource');
  }
  lib.inherit(FontLoader, BasicResourceLoader);
  FontLoader.prototype.__cleanUp = function () {
    BasicResourceLoader.prototype.__cleanUp.call(this);
  };

  FontLoader.prototype.CONFIG_SCHEMA = function () { return CONFIG_SCHEMA; };
  FontLoader.prototype.DEFAULT_CONFIG = function () { return null; };

  FontLoader.prototype.doLoad = function () {
    var d = q.defer();
    $(document).ready(this._go.bind(this, d));
    return d;
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
(function (allex, module, applib) {
  var lib = allex.lib,
  BasicResourceLoader = applib.BasicResourceLoader,
  q = lib.q,
  CONFIG_SCHEMA = {
    type : 'object',
    properties : {
      url : {type : 'string'}
    },
    required : ['url']
  };

  function URLGenerator (options) {
    BasicResourceLoader.call(this, options);
  }
  lib.inherit (URLGenerator, BasicResourceLoader);
  URLGenerator.prototype.__cleanUp = function () {
    BasicResourceLoader.prototype.__cleanUp.call(this);
  };

  URLGenerator.prototype.doLoad = function () {
    var ret = q.defer();
    ret.resolve(true);
    return ret;
  };

  URLGenerator.prototype.DEFAULT_CONFIG = function () {return null;};
  URLGenerator.prototype.CONFIG_SCHEMA = function () {return CONFIG_SCHEMA;};
  URLGenerator.prototype.getFullUrl = function (path, query) {
    var url = this.getConfigVal ('url');
    url = url.charAt(url.length) === '/' ? url+path : url+'/'+path;
    ///TODO: fali query ...
    return url;
  };


  applib.registerResourceType('URLGenerator', URLGenerator);

})(ALLEX, ALLEX.WEB_COMPONENTS.allex_web_webappcomponent, ALLEX.WEB_COMPONENTS.allex_applib);
//samo da te vidim
(function (allex, module, applib) {
  'use strict';

  var lib = allex.lib,
    BasicAngularController = lib.BasicAngularController,
    q = lib.q;

    function DataElementMixIn () {
      this.data = null;
    }

    DataElementMixIn.prototype.__cleanUp = function () {
      this.data = null;
    };

    DataElementMixIn.prototype.set_data = function (data) {
      var f = this.getConfigVal('dataHandler');
      if (lib.isFunction(f)) return f(this.$element, data);

      if (this.data === data) return false;
      this.data = data;
      return true;
    };

    DataElementMixIn.prototype.hasDataChanged = function (ret) {
      return lib.isUndef(ret) || ret === true;
    };

    DataElementMixIn.addMethods = function (chld) {
      lib.inheritMethods (chld, DataElementMixIn, 'set_data', 'hasDataChanged');
    };

    module.mixins.DataElementMixIn = DataElementMixIn;

})(ALLEX, ALLEX.WEB_COMPONENTS.allex_web_webappcomponent, ALLEX.WEB_COMPONENTS.allex_applib);
//samo da te vidim
(function (allex, module, applib) {
  'use strict';

  var lib = allex.lib,
    WebElement = module.elements.WebElement,
    DataElementMixIn = module.mixins.DataElementMixIn;

  function DataAwareElement (id, options) {
    WebElement.call(this, id, options);
    DataElementMixIn.call(this);
  }
  lib.inherit (DataAwareElement, WebElement);
  DataElementMixIn.addMethods (DataAwareElement);

  DataAwareElement.prototype.__cleanUp = function () {
    DataElementMixIn.prototype.__cleanUp.call(this);
    WebElement.prototype.__cleanUp.call(this);
  };

  module.elements.DataAwareElement = DataAwareElement;
  applib.registerElementType ('DataAwareElement',DataAwareElement);

})(ALLEX, ALLEX.WEB_COMPONENTS.allex_web_webappcomponent, ALLEX.WEB_COMPONENTS.allex_applib);
//samo da te vidim
(function (allex, module) {
  'use strict';

  var lib = allex.lib,
    NO_ROLE_PAGE = '#norole#page#',
    CLDestroyable = lib.CLDestroyable;

  function Page (element, onActivated, onDeactivated, router) {
    this.element = element;
    this.onActivated = onActivated;
    this.onDeactivated = onDeactivated;
    this.deactivate();
    this.router = router;
  }

  Page.prototype.destroy = function () {
    this.element = null;
    this.onDeactivated = null;
    this.onActivated = null;
    this.router.destroy(); //I will destroy router since there is no one outside which will destroy it ...
    this.router = null;
  };

  Page.prototype.activate = function () {
    this.element.set('actual', true);
    if (lib.isFunction (this.onActivated)) {
      this.onActivated (this.element);
    }
    if (this.router) {
      this.router.reset();
    }
  };

  Page.prototype.deactivate = function () {
    this.element.set('actual', false);
    if (this.router) {
      this.router.clear();
    }

    if (lib.isFunction(this.onDeactivated)) {
      this.onDeactivated (this.element);
    }

  };

  Page.prototype.gotoSubPage = function (page) {
    if (this.router) {
      if (page) {
        this.router.set('page', page);
      }else{
        this.router.reset();
      }
    }
  };

  function Router (container) {
    this.default_page = null;
    this.pagesmap = new lib.Map();
    this.page = null;
    this.container = container;
    CLDestroyable.call(this);
  }

  lib.inherit(Router, CLDestroyable);

  Router.prototype.__cleanUp = function () {
    this.container = null;
    this.default_page = null;
    this.page = null;
    lib.container.destroyAll (this.pagesmap);
    this.pagesmap.destroy();
    this.pagesmap = null;
    CLDestroyable.prototype.__cleanUp.call(this);
  };

  Router.prototype.addPage = function (page, allexelement, onActivated, onDeactivated, page_router) {
    this.pagesmap.add(page, new Page (allexelement, onActivated, onDeactivated, page_router));
  };

  Router.prototype._doDeactivate = function (page, item, key) {
    if (key === page) return;
    if (item) item.deactivate();
  };

  Router.prototype.set_page = function (page) {
    if (this.page === page) return false;
    this.page = page;

    var pp = null, zp = 0, np = null;

    if (page) {
      pp = page.split('/');
      zp = pp.shift();
      np = pp.join('/');
    }

    this.pagesmap.traverse(this._doDeactivate.bind(this, zp));
    var ap = this.pagesmap.get(zp);
    if (!ap) return;
    ap.activate();
    ap.gotoSubPage (np);
    return true;
  };

  Router.prototype.reset = function () {
    this.set('page', this.default_page);
  };

  Router.prototype.clear = function () {
    this.set('page', null);
    if (this.container) {
      this.container.set('actual', false);
    }
  };

  function getUniversalPageName (name) {
    return '#universal#'+name+'#page';
  }

  function RoleRouter () {
    this.role_router = new Router();
    this.role = null;
    this.active_router = null;
    this._role_monitor = null;
    this._user_state_monitor = null;
    this.role_datasource = null;
  }

  lib.inherit (RoleRouter, Router);
  RoleRouter.prototype.destroy = function (){
    if (this._user_state_monitor){
      this._user_state_monitor.destroy();
    }
    this._user_state_monitor = null;

    if (this._role_monitor) {
      this._role_monitor.destroy();
    }
    this.role_datasource = null;
    this.active_router = null;
    this.role = null;
    this.role_router.destroy();
    this.role_router = null;
  };

  RoleRouter.prototype.addNoRolePage = function (allexelement, onActivated, onDeactivated, router) {
    this.role_router.addPage (NO_ROLE_PAGE, allexelement, onActivated, onDeactivated, router);
  };

  RoleRouter.prototype.addUniversalRolePage = function (name, allexelement, onActivated, onDeactivated, router) {
    ///THIS_IS_NOT_NO_ROLE_PAGE ... MOVING TO THIS PAGE REQUIRES ROLE TO BE SET ;)
    var n = getUniversalPageName(name);
    this.role_router.addPage(n, allexelement, onActivated, onDeactivated, router);
  };

  RoleRouter.prototype.addRolePage = function (role, allexelement, onActivated, onDeactivated, router) {
    this.role_router.addPage(role, allexelement, onActivated, onDeactivated, router);
  };

  RoleRouter.prototype._prepareActiveRouter = function (name){
    if (this.active_router) {
      this.active_router.clear();
    }

    if (name) {
      var page = this.role_router.pagesmap.get(name);
      this.active_router = page ? page.router : null;
    }else{
      this.active_router = null;
    }

    if (this.active_router) {
      this.active_router.reset();
    }
  };


  RoleRouter.prototype.gotoUniversalRolePage = function (name) {
    if (!this.role) {
      console.warn ('going to universal page ',name,'with no role set ... no can do ...');
      return;
    }
    this._prepareActiveRouter (getUniversalPageName(name));
  };

  RoleRouter.prototype.setRole = function (role) {
    this.role = role;
    this._prepareActiveRouter(role);
    this.role_router.set('page', role ? role : null);
  };

  RoleRouter.prototype.resetToRole = function () {
    this.setRole(this.role);
  };

  RoleRouter.prototype.setPageInRole = function (name) {
    if (!this.active_router) {
      console.warn ('No active router for role '+this.role+'?', 'No can do ...');
      return;
    }
    if (this.active_router) {
      this.active_router.set('page', name);
    }
  };

  RoleRouter.prototype._listenRole = function () {
    if (this._role_monitor) this._role_monitor.destroy();
    this._role_monitor = this.role_datasource.attachListener ('data', this.setRole.bind(this));
  };

  RoleRouter.prototype.setRoleMonitor = function (datasource) {
    this.role_datasource = datasource;
  };

  RoleRouter.prototype.setApp = function (app, name){
    app.environments.listenFor(name, this._onEnv.bind(this));
  };

  RoleRouter.prototype._onEnv = function (env) {
    if (!env) {
      if (this._role_monitor){
        this._role_monitor.destroy();
      }
      this._role_monitor = null;

      if (this._user_state_monitor){
        this._user_state_monitor.destroy();
      }
      this._user_state_monitor = null;
      this.setRole(null);
      return;
    }
    //TODO: nije iskljuceno da odavde mozes da izvuces i monitor za rolu ...
    this._user_state_monitor = env.attachListener('state', this._onStatusChanged.bind(this));
  };

  RoleRouter.prototype._onStatusChanged = function (sttus) {
    if ('established' === sttus){
      this._listenRole();
      return;
    }
    if (this._role_monitor) this._role_monitor.destroy();
    this._role_monitor = null;
    if (this.role !== null) this.setRole(null);
  };

  module.Router = Router;
  module.RoleRouter = new RoleRouter();


})(ALLEX, ALLEX.WEB_COMPONENTS.allex_web_webappcomponent.misc);
