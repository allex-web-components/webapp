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
    this._addHook ('onPreShow');
    this._addHook ('onPreHide');
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
    this.attachHook ('onPreShow', this.getConfigVal('onPreShow'));
    this.attachHook ('onPreHide', this.getConfigVal('onPreHide'));
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
    this.fireHook ('onPreShow', [this]);
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
    this.fireHook ('onShown', [this]);
  };

  WebElement.prototype.hide = function () {
    if (!this.$element) return;
    this.fireHook ('onPreHide', [this]);
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
      elempath = path.replace('$element.', '');
    }
    if (path.indexOf('.$element.') === 0) {
      elempath = path.replace('.$element.', '');
    }

    if (elempath) {
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

  WebElement.prototype.raiseEvent = function () {
    this.$element.trigger.apply(this.$element, arguments);
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
      this.busy = false;
    }

    DataElementMixIn.prototype.__cleanUp = function () {
      this.data = null;
      this.busy = null;
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

    DataElementMixIn.prototype.set_busy = function (val) {
      this.busy = val;
      console.log(this.get('id'), 'reported busy', val);
    };

    DataElementMixIn.addMethods = function (chld) {
      lib.inheritMethods (chld, DataElementMixIn, 'set_data', 'hasDataChanged', 'set_busy');
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
(function (allex, module, applib, $) {
  'use strict';
  var lib = allex.lib,
    BasicElement = applib.BasicElement,
    BasicModifier = applib.BasicModifier,
    BasicProcessor = applib.BasicProcessor,
    cntr = 0,
    misc = applib.misc,
    q = lib.q;

  function PItem (container, desc) {
    this.container = container;
    this.desc = desc;
    this.prepareData = desc.prepareData || null;
    this.defer = null;
  }

  PItem.prototype.destroy = function () {
    this.prepareData = null;
    this.desc = null;
    this.container = null;
    this.defer = null;
  };

  PItem.prototype.isExpecting = function () {
    return !!this.defer;
  };

  PItem.prototype._actualStart = function (data) {
    var ret = this._doStart(data);
    ret.done (this.doOnSuccess.bind(this), this.doOnError.bind(this));
    return ret;
  };

  PItem.prototype._onPrepareDataFunction = function (promise_provider) {
    return promise_provider().then (this._actualStart.bind(this));
  };

  PItem.prototype._onPrepareDataPromise = function (promise) {
    return promise.then (this._actualStart.bind(this));
  };

  PItem.prototype.start = function (data, index, all_data){
    var data_prepared = (lib.isFunction (this.prepareData)) ? this.prepareData(data, index, all_data) : data;

    if (lib.isFunction(data_prepared)) {
      return this._onPrepareDataFunction (data_prepared);
    }

    if (lib.isFunction(data_prepared.then)) {//this is a promise ...
      return this._onPrepareDataPromise(data_prepared);
    }

    return this._actualStart(data_prepared);
  };

  PItem.prototype.doOnSuccess = function (result) {
    this.container._reportDone(result);
    if (lib.isFunction(this.desc.onSuccess)) this.desc.onSuccess.apply(null, this.getSuccessArgs(result));
  };

  PItem.prototype.doOnError = function (result){
    this.container._reportFailed(result);
    if (lib.isFunction(this.desc.onError)) this.desc.onError.apply(null, this.getErrorArgs(result));
  };

  PItem.prototype.getErrorArgs = function (result) {
    return [result, this.container.values];
  };

  PItem.prototype.getSuccessArgs = function (result) {
    return [result, this.container.values];
  };

  PItem.prototype._doStart = lib.dummyFunc;

  function FunctionPItem (container, ftion, desc) {
    PItem.call(this, container, desc);
    this.ftion = ftion;
    if (!lib.isFunction(this.prepareData)) this.prepareData = this._defaultDataPrepare.bind(this);
  }
  lib.inherit (FunctionPItem, PItem);
  FunctionPItem.prototype.destroy = function () {
    this.ftion = null;
    PItem.prototype.destroy.call(this);
  };

  FunctionPItem.prototype._doStart = function (args) {
    return this.ftion.apply (null, args);
  };

  FunctionPItem.prototype._defaultDataPrepare = function (data, index, all_data) {
    return [data];
  };

  function ObjectPItem (container, element, desc) {
    PItem.call(this, container, desc);
    this.element = element;
  }
  lib.inherit (ObjectPItem, PItem);

  ObjectPItem.prototype.destroy = function () {
    this.element = null;
    PItem.prototype.destroy.call(this);
  };

  ObjectPItem.prototype.getErrorArgs = function (result) {
    return [this.element, result, this.container.values];
  };

  ObjectPItem.prototype.getSuccessArgs = function (result) {
    return [this.element, result, this.container.values];
  };

  ObjectPItem.prototype.start = function (data, index, all_data){
    if (lib.isFunction(this.desc.onStart)) this.desc.onStart(this.element, data, all_data);
    return PItem.prototype.start.apply(this, arguments);
  };

  ObjectPItem.prototype._doStart = function () {
    this.defer = q.defer();
    return this.defer.promise;
  };


  ObjectPItem.prototype.onFailed = function (result) {
    if (!this.defer) throw new Error('Not expecting resolution');
    var d = this.defer;
    this.defer = null;
    d.reject (result);
    d = null;
  };

  ObjectPItem.prototype.onSuccess = function (result) {
    if (!this.defer) throw new Error('Not expecting resolution');
    var d = this.defer;
    this.defer = null;
    d.resolve(result);
    d = null;
  };

  function Pipeline (id, options) {
    BasicElement.call(this, id, options);
    this.items = null;
    this.values = null;
    this.index = null;
  }
  lib.inherit (Pipeline, BasicElement);
  Pipeline.prototype.__cleanUp = function () {
    this.index = null;
    this.values = null;
    this.forceStop();
    lib.arryDestroyAll(this.items);
    this.items = null;
    BasicElement.prototype.__cleanUp.call(this);
  };

  Pipeline.prototype.init = function (pipeline_desc) {
    this.items = new Array(pipeline_desc.length);
  };

  Pipeline.prototype.getCurrent = function () {
    return this.items[this.get('index')];
  };

  Pipeline.prototype.stop= function () {
    this.set('actual', false);
  };

  Pipeline.prototype._assignIndex = function (index, desc, element) {
    if (lib.isFunction (element)) {
      this.items[index] = new FunctionPItem (this, element, desc);
    }else{
      this.items[index] = new ObjectPItem (this, element, desc);
    }
  };

  Pipeline.prototype.set_actual = function (val) {
    var bl = !!val;
    if (bl === this.actual) return false;
    BasicElement.prototype.set_actual.call(this, !!val);

    if (val) {
      this.values = [val];
      this.next();
    }else{
      this.values = null;
    }
  };

  Pipeline.prototype.next = function () {
    if (!this.values) return; //zaustavljeno, bato, nema se ovde sta raditi ...
    var index = this.values.length-1;
    this.set('index', index);
    var item = this.getCurrent();

    if (!item) {
      this.stop();
      return;
    }
    item.start(this.values[index],this.get('index'), this.values).done (this.next.bind(this), this.stop.bind(this));
  };

  Pipeline.prototype._reportDone = function (result) {
    this.values.push(result);
  };

  Pipeline.prototype._reportFailed = function (result) {
    this.values.push (result);
  };

  Pipeline.prototype.onDone = function (result){
    this.getCurrent().onSuccess(result);
  };

  Pipeline.prototype.onFailed = function (result){
    this.getCurrent().onFailed(result);
  };

  module.elements.Pipeline = Pipeline;
  applib.registerElementType ('Pipeline', Pipeline);

  function PipelineModifier (options){
    BasicModifier.call(this, options);
  }
  lib.inherit (PipelineModifier, BasicModifier);

  PipelineModifier.prototype.__cleanUp = function () {
    BasicModifier.prototype.__cleanUp.call(this);
  };

  PipelineModifier.prototype.doProcess = function (name, options, links, logic, resources) {
    var element_name = this.getConfigVal ('element_name'),
      pipeline = this.getConfigVal ('pipeline'),
      pipe_element_path = (name ? '' : 'element')+'.'+element_name,
      temp, is_object;

    var lp = [
    ];

    lp.push ({
      triggers : '.!ready',
      references : pipe_element_path,
      handler : this._initialize.bind(this, pipeline)
    });

    for (var i = 0; i < pipeline.length; i++) {
      temp = pipeline[i];
      lp.push ({
        name : 'test_ready',
        triggers : '.!ready',
        references : [temp.element, pipe_element_path].join(','),
        handler : this._onParentReady.bind(this, temp, i)
      });

      is_object = temp.element.indexOf('>') < 0;

      if (is_object  && !(temp.success && temp.error)){
        throw new Error('For object config we need success and error triggers');
      }

      if (!is_object) continue;

      lp.push ({
        triggers : temp.element+temp.success,
        references : [temp.element, pipe_element_path].join (','),
        handler : this._onElementSuccess.bind(this, i, temp.successCheck)
      },{
        triggers : temp.element+temp.error,
        references : [temp.element, pipe_element_path].join (','),
        handler : this._onElementError.bind(this, i, temp.errorCheck)
      });
    }

    Array.prototype.push.apply (logic, lp);
  };

  PipelineModifier.prototype._onElementError = function (elindex, errorCheck, elementInstance, pipelineInstance) {
    if (pipelineInstance.get('index') !== elindex) return;
    if (!pipelineInstance.getCurrent().isExpecting()) return;
    var args = Array.prototype.slice.call(arguments, 4);

    if (lib.isFunction(errorCheck)) {
      if (!errorCheck.apply(null, args)) return;
    }
    pipelineInstance.onFailed(args);
  };

  PipelineModifier.prototype._onElementSuccess = function (elindex, successCheck, elementInstance, pipelineInstance){
    if (pipelineInstance.get('index') !== elindex) return; ///simply ignore this one ....
    if (!pipelineInstance.getCurrent().isExpecting()) return;
    var args = Array.prototype.slice.call(arguments, 4);

    if (lib.isFunction(successCheck)){
      if (!successCheck(args)) return;
    }
    pipelineInstance.onDone(args);
  };

  PipelineModifier.prototype._initialize = function (pipeline, pipelineInstance){
    pipelineInstance.init(pipeline);
  };

  PipelineModifier.prototype._onParentReady = function (item, index, elementInstance, pipelineInstance) {
    pipelineInstance._assignIndex (index, item, elementInstance);
  };

  PipelineModifier.prototype.DEFAULT_CONFIG = function () {
    return null;
  };


  function PipelineSearcher (){
    BasicProcessor.call(this);
  }
  lib.inherit (PipelineSearcher, BasicProcessor);

  PipelineSearcher.prototype.destroy = function () {
    BasicProcessor.prototype.destroy.call(this);
  };

  PipelineSearcher.prototype.process = function (desc) {
    misc.traverseElements (desc, this._processElement.bind(this));
  };

  PipelineSearcher.prototype._processElement = function (desc) {
    if (!desc.modifiers) return;
    var pps = misc.findModifier (desc, 'Pipeline');
    if (!pps) return;
    misc.initAll (desc);

    var ne, elements_arr = misc.getElementsArr(desc);
    for (var i = 0; i < pps.length; i++) {
      ne = {
        name : pps[i].options.element_name ? pps[i].options.element_name : desc.name ? desc.name+'_pipeline_'+i : '_pipeline_'+i,
        type : 'Pipeline'
      };
      pps[i].options.element_name = ne.name;
      elements_arr.push (ne);
    }
  };

  applib.registerModifier ('Pipeline', PipelineModifier);
  applib.registerPreprocessor ('Pipeline', PipelineSearcher);

})(ALLEX, ALLEX.WEB_COMPONENTS.allex_web_webappcomponent, ALLEX.WEB_COMPONENTS.allex_applib, jQuery);

//samo da te vidim
(function (allex, module, applib, $) {
  'use strict';

  var lib = allex.lib,
    BasicModifier = applib.BasicModifier;

  function Selector (options) {
    BasicModifier.call(this, options);
  }
  lib.inherit (Selector, BasicModifier);
  Selector.prototype.destroy = function () {
    BasicModifier.prototype.destroy.call(this);
  };

  Selector.prototype.ALLOWED_ON = function() { return null; };

  Selector.prototype.DEFAULT_CONFIG = function () {
    return {
      attributeVal : null,
      evntValProcessor : null
    };
  };

  Selector.prototype.doProcess = function (name, options, links, logic, resources){
    var selector = this.getConfigVal ('selector');
    var ret = [{
      triggers : '.$element.'+selector+'!click',
      references : '.',
      handler : this._onClicked.bind(this, this.getConfigVal ('attributeVal'), this.getConfigVal ('evntValProcessor'))
    }];
    Array.prototype.push.apply (logic, ret);
  };

  Selector.prototype._onClicked = function (attributeVal, evntValProcessor, selector, evnt) {
    var raiseValue =  this.getRaiseValue($(evnt.currentTarget), attributeVal, evntValProcessor);
    if ('undefined' === typeof(raiseValue)) return;
    selector.raiseEvent ('onSelected',raiseValue);
  };

  Selector.prototype.getRaiseValue = function ($target, attributeVal, evntValProcessor) {
    if (attributeVal) {
      return $target.attr(attributeVal);
    }

    if (evntValProcessor) {
      return evntValProcessor($target);
    }

    return $target;
  };

  applib.registerModifier ('Selector', Selector);

  function RouteController (options) {
    lib.extend (options || {}, {
      attributeVal : 'data-route'
    });
    Selector.call(this,options);
  }
  lib.inherit (RouteController, Selector);
  RouteController.prototype.__cleanUp = function () {
    Selector.prototype.__cleanUp.call(this);
  };

  applib.registerModifier ('RouteController', RouteController);

  module.modifiers.Selector = Selector;
})(ALLEX, ALLEX.WEB_COMPONENTS.allex_web_webappcomponent, ALLEX.WEB_COMPONENTS.allex_applib, jQuery);
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


  function RouterMixIn () {
    this.default_page = null;
    this.pagesmap = new lib.Map();
    this.page = null;
  }
  RouterMixIn.prototype.__cleanUp = function () {
    this.default_page = null;
    this.page = null;
    lib.container.destroyAll (this.pagesmap);
    this.pagesmap.destroy();
    this.pagesmap = null;
  };

  RouterMixIn.prototype.addPage = function (page, allexelement, onActivated, onDeactivated, page_router) {
    this.pagesmap.add(page, new Page (allexelement, onActivated, onDeactivated, page_router));
  };

  RouterMixIn.prototype._doDeactivate = function (page, item, key) {
    if (key === page) return;
    if (item) item.deactivate();
  };

  RouterMixIn.prototype.set_page = function (page) {
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

  RouterMixIn.prototype.reset = function () {
    this.set('page', this.default_page);
  };

  RouterMixIn.prototype.clear = function () {
    this.set('page', null);
    if (this.getContainer()) {
      this.getContainer().set('actual', false);
    }
  };

  RouterMixIn.addMethods = function (chld) {
    lib.inheritMethods(chld, RouterMixIn, 'clear', 'reset', 'set_page', '_doDeactivate', 'addPage'); 
  };


  function Router (container) {
    RouterMixIn.call(this, container);
    this.container = container;
    CLDestroyable.call(this);
  }

  lib.inherit(Router, CLDestroyable);
  RouterMixIn.addMethods (Router);

  Router.prototype.__cleanUp = function () {
    this.container = null;
    RouterMixIn.prototype.__cleanUp.call(this);
    CLDestroyable.prototype.__cleanUp.call(this);
  };

  Router.prototype.getContainer = function () {
    return this.container;
  };

  function getUniversalPageName (name) {
    return '#universal#'+name+'#page';
  }

  function RoleRouter () {
    this.role_router = new Router();
    this.role = null;
    this.active_router = null;
    this.isonline = false;
  }

  lib.inherit (RoleRouter, Router);
  RoleRouter.prototype.destroy = function (){
    this.isonline = null;
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
    if (!this.online) {
      this._prepareActiveRouter(null);
      return;
    }
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

  RoleRouter.prototype._onStatusChanged = function (sttus) {
    this.online = ('established' === sttus);
    this.setRole ( this.online ? this.role : null);
  };

  module.RouterMixIn = RouterMixIn;
  module.Router = Router;
  module.RoleRouter = RoleRouter;


})(ALLEX, ALLEX.WEB_COMPONENTS.allex_web_webappcomponent.misc);
//samo da te vidim
(function (allex, module, applib, $) {
  'use strict';
  var lib = allex.lib,
    BasicElement = applib.BasicElement,
    BasicModifier = applib.BasicModifier,
    BasicProcessor = applib.BasicProcessor,
    cntr = 0,
    misc = applib.misc,
    q = lib.q;

  function RoleRouterElement (id, options) {
    BasicElement.call(this, id, options);
    this.role_router = new module.misc.RoleRouter();
    this.path_prefix = null;
    this.path = null;
  }
  lib.inherit (RoleRouterElement, BasicElement);
  RoleRouterElement.prototype.__cleanUp = function () {
    this.path_prefix = null;
    this.path = null;
    this.role_router.destroy ();
    this.role_router = null;
    BasicElement.prototype.__cleanUp.call(this);
  };

  RoleRouterElement.prototype.gotoPage = function (page) {
    this.role_router.setPageInRole (page);
    this.set('path', page);
  };

  RoleRouterElement.prototype.gotoUniversalRolePage = function (page) {
    this.role_router.gotoUniversalRolePage.apply (this.role_router, arguments);
    this.set('path_prefix', page);
    this.set('path', this.role_router.active_router.default_page);
  };

  RoleRouterElement.prototype.resetToRole = function () {
    this.role_router.resetToRole.apply (this.role_router, arguments);
    this.set('path_prefix', null);
    this.set('path', this.role_router.active_router.default_page);
  };

  RoleRouterElement.prototype.set_path = function (path) {
    this.path = path;
  };

  RoleRouterElement.prototype._checkInitialPath = function () {
    if (this.role_router.role && this.role_router.online) {
      this.set('path', this.role_router.active_router.default_page);
    }
  };

  applib.registerElementType ('RoleRouterElement', RoleRouterElement);

  function validateRoleChange (router, role, sttus) {
    router.role_router._onStatusChanged (sttus);

    if ('established' === sttus) {
      router.role_router.setRole(role);
    }else{
      router.role_router.setRole(null);
    }
    router._checkInitialPath();
  }

  function prepareRole (role, data, pageslist, router, container) {
    var len = pageslist.length,
      pages = Array.prototype.slice.call (arguments, 5, 5+len),
      rr = new module.misc.Router(container);

    for (var i in pageslist) {
      rr.addPage (data.pages[pageslist[i]], pages[i]);
    }
    rr.default_page = data.default_page;
    router.role_router.addRolePage(role, container, null, null, rr);
  }

  function RoleRouter () {
    BasicProcessor.call(this);
  }
  lib.inherit (RoleRouter, BasicProcessor);
  RoleRouter.prototype.destroy = function () {
    BasicProcessor.prototype.destroy.call(this);
  };

  RoleRouter.prototype.processRoleRouter = function (rr_name, rr_data, desc) {
    if (!rr_data.sttusSource) throw new Error("Missing sttusSource");
    if (!rr_data.roleSource) throw new Error('Missing roleSource');
    var name = rr_name+'_router';
    desc.elements.push ({
      name : name,
      type : 'RoleRouterElement'
    });

    desc.logic.push ({
      triggers : rr_data.roleSource+','+rr_data.sttusSource,
      references : 'element.'+name,
      handler : validateRoleChange
    });

    if (rr_data.roles) lib.traverseShallow (rr_data.roles, this.processRole.bind(this, desc.logic, 'element.'+name));
    if (rr_data.anyRole) lib.traverseShallow (rr_data.anyRole, this.processAnyRole.bind(this, desc.logic, 'element.'+name));
  };

  RoleRouter.prototype.processAnyRole = function (logic, element_name, data, name) {
    if (!data) return;

    var list = Object.keys (data.pages);

    logic.push({
      triggers : '.!ready',
      references : ([element_name, data.container].concat(list)).join (','),
      handler : suiteUpAnyRole.bind(null, data, list, name)
    });
  };

  function suiteUpAnyRole (data, list, name, router, container) {
    var refs = Array.prototype.slice.call (arguments, 5, 5+list.length);
    var rr = new module.misc.Router(container);

    for (var i = 0; i < list.length; i++) {
      rr.addPage(data.pages[list[i]], refs[i]);
    }

    rr.default_page = data.default_page;
    router.role_router.addUniversalRolePage (name, container, null, null, rr);
  }

  RoleRouter.prototype.processRole = function (logic, element_name, data, role) {
    if (!data.pages) {
      console.warn ('No page for role ',role);
      return;
    }
    var refs = [element_name, data.container], pageslist = Object.keys (data.pages);
    Array.prototype.push.apply (refs, pageslist);

    logic.push ({
      triggers : '.!ready',
      references : refs.join(','),
      handler : prepareRole.bind(null, role, data, pageslist)
    });
  };

  RoleRouter.prototype.process = function (desc) {
    for (var rr_name in this.config) {
      this.processRoleRouter(rr_name, this.config[rr_name], desc);
    }
  };

  applib.registerPreprocessor ('RoleRouter', RoleRouter);

})(ALLEX, ALLEX.WEB_COMPONENTS.allex_web_webappcomponent, ALLEX.WEB_COMPONENTS.allex_applib, jQuery);
//samo da te vidim
(function (allex, module, applib, $) {
  'use strict';
  var lib = allex.lib,
    BasicElement = applib.BasicElement,
    BasicModifier = applib.BasicModifier,
    BasicProcessor = applib.BasicProcessor,
    RouterMixIn = module.misc.RouterMixIn,
    cntr = 0,
    misc = applib.misc,
    q = lib.q;

    function TabViewElement (id, options) {
      BasicElement.call(this, id, options);
      RouterMixIn.call(this);
    }
    lib.inherit (TabViewElement, BasicElement);
    RouterMixIn.addMethods (TabViewElement);

    TabViewElement.prototype.__cleanUp = function () {
      RouterMixIn.prototype.__cleanUp.call(this);
      BasicElement.prototype.__cleanUp.call(this);
    };

    TabViewElement.prototype._doInitializeView = function (tablist, tabs, tabsmap, default_tab){
      this.default_page = default_tab;
      for (var i = 0; i < tablist.length; i++) {
        this.addPage (tabsmap[tablist[i]], tabs[i]);
      }
      this.reset();
    };

    TabViewElement.prototype.getContainer = function () {
      return null;
    };

    applib.registerElementType ('TabViewElement', TabViewElement);


    function TabViewProcessor () {
      BasicProcessor.call(this);
    }
    lib.inherit (TabViewProcessor, BasicProcessor);
    TabViewProcessor.prototype.destroy = function () {
      BasicProcessor.prototype.destroy.call(this);
    };

    TabViewProcessor.prototype.process = function (desc){
      //za sad samo ovako ....
      for (var tv_name in this.config) {
        this.createTabView (tv_name, this.config[tv_name], desc);
      }
    };

    TabViewProcessor.prototype.createTabView = function (name, config, desc) {
      if (!config.tabs) throw new Error ('No tabs record in config for tab view ', name);
      var refs = ['element.'+name+'_tab_view'];
      desc.elements.push ({
        name : name+'_tab_view',
        type : 'TabViewElement',
        options : {
          toggle : config.toggle || false
        }
      });

      var tablist = Object.keys (config.tabs);
      Array.prototype.push.apply(refs, tablist);

      desc.logic.push ({
        triggers : '.!ready',
        references : refs.join (','),
        handler : this._initializeElement.bind(this, name, config, tablist)
      });

      if (!config.selector) return; //nothing more to be done ...
      desc.logic.push ({
        triggers : config.selector+'.$element!onSelected',
        references : refs[0],
        handler : this._onSelected.bind(this)
      });
    };

    TabViewProcessor.prototype._initializeElement = function (name, config, tablist, element) {
      var tabs = Array.prototype.slice.call(arguments, 4);
      element._doInitializeView (tablist, tabs, config.tabs, config.default_tab || null);
    };

    TabViewProcessor.prototype._onSelected = function (tabview, evnt, page) {
      if (page === tabview.get('page') && tabview.getConfigVal ('toggle')){
        tabview.clear();
        return;
      }
      tabview.set('page', page);
    };

    applib.registerPreprocessor ('TabView', TabViewProcessor);


})(ALLEX, ALLEX.WEB_COMPONENTS.allex_web_webappcomponent, ALLEX.WEB_COMPONENTS.allex_applib, jQuery);
//samo da te vidim
(function (allex, module, applib, $) {
  'use strict';
  var lib = allex.lib,
    BasicProcessor = applib.BasicProcessor,
    misc = applib.misc,
    q = lib.q;

    function LogoutDeactivator () {
      BasicProcessor.call(this);
      this.elements = [];
    }

    lib.inherit (LogoutDeactivator, BasicProcessor);

    LogoutDeactivator.prototype.destroy = function () {
      this.elements = null;
      BasicProcessor.prototype.destroy.call(this);
    };

    LogoutDeactivator.prototype.configure = function (config) {
      BasicProcessor.prototype.configure.call(this, config);
    };

    /*
     * possible item for elements : 
     *        - string -> direct path to element
     *        - {type : type} -> find all elements of a given type
     *        - {type : type, modifiers : modifiers} -> find all elements of a given type with given modifiers ...
     *
     */

    LogoutDeactivator.prototype.process = function (desc) {
      if (!this.config) return;
      if (!this.config.state) throw new Error('No state field in config');
      if (!this.config.elements) throw new Error('No elements field in config');

      misc.traverseElements (desc, this._onElement.bind(this), ['element']);
      desc.logic.push ({
        triggers : this.config.state,
        references : this.elements.join (','),
        handler : _processState.bind(this)
      });
    };

    function _processState () {
      var d = Array.prototype.slice.call(arguments),
        state = d.pop();

      if ('established' !== state) {
        d.forEach (lib.doMethod.bind(null, 'set', ['actual', false]));
      }
      d = null;
    };

    LogoutDeactivator.prototype._onElement = function (element, path){
      var m = path.join('.');
      if (this._match (element, m)) this.elements.push (m);
    };

    LogoutDeactivator.prototype._match = function (element, path){
      var el = null;
      for (var i = 0; i < this.config.elements.length; i++) {
        el = this.config.elements[i];
        if (lib.isString(el)) {
          if (path === el) return true;
        }
        if (el.type !== element.type) {
          continue;
        }
        if (!el.modifiers) return true;
        if (!element.modifiers) continue;
        if (lib.arryOperations.intersect(el.modifiers, element.modifiers.map(stringify)).filter(lib.isString).length) return true;
      }

      return false;
    };

    function stringify (rec) {
      return lib.isString (rec) ? rec : rec.name;
    }

    applib.registerPreprocessor('LogoutDeactivator', LogoutDeactivator);
})(ALLEX, ALLEX.WEB_COMPONENTS.allex_web_webappcomponent, ALLEX.WEB_COMPONENTS.allex_applib, jQuery);
