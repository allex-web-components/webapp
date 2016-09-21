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
    console.log(this.carrier, this.method, this.prop, val);
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
