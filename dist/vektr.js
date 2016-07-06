(function (allex, module, applib, vektr, $) {
  'use strict';

  var lib = allex.lib,
    WebElement = module.abstractions.WebElement,
    BasicElement = applib.BasicElement,
    q = lib.q;

  var CANVAS_SCHEMA = {
    type : "object",
    properties : {
      svg: {
        anyOf : [
          {
            type : "object",
            properties : {
              horizontal : { type : "string" },
              vertical : { type : "string" }
            },
            additionalProperties : false,
            required : ['horizontal']
          },
          {
            type : "string"
          }
        ]
      },
      autoresize : { type : "boolean" },
      debug : { type : "boolean" },
      mindOrientation : {type : "boolean" },
      ctor : {type : "string"},
      resources : WebElement.ResourcesSchema,
      klass : { type : "string" }
    },
    additionalProperties : false,
    required : ['debug', 'autoresize', 'mindOrientation', 'svg', 'ctor']
  };

  function VektrCanvas (id, options) {
    WebElement.call(this, id, options);
    this.scene = null;
    this.renderers = null;
  }
  lib.inherit (VektrCanvas, WebElement);
  VektrCanvas.prototype.__cleanUp = function () {
    ///TODO ...
    WebElement.prototype.__cleanUp.call(this);
  };


  function _onVektrLoaded (vcanvas, defer, svg) {
    if (!svg) return defer.reject(new Error('failed to load svg'));
    vcanvas.renderers.push (svg);
    defer.resolve(svg);
  }

  VektrCanvas.prototype._loadSVG = function (svg_path, ctor) {
    var d = q.defer();
    vektr.load (svg_path, ctor, _onVektrLoaded.bind(null, this, d));
    return d.promise;
  };

  VektrCanvas.prototype.initialize = function () {
    BasicElement.prototype.initialize.call(this);
    this.$element = this.__parent.$element.find('#'+this.get('id'));
    if (!(this.$element && this.$element.length)){
      this.$element = $('<div>').attr('id',this.get('id'));
      this.$element.addClass(this.getConfigVal('klass'));
      this.__parent.$element.append(this.$element);
    }
  };


  VektrCanvas.prototype.load = function () {
    return WebElement.prototype.load.call(this).then(this._onLoaded.bind(this));
  };

  VektrCanvas.prototype._onLoaded = function () {
    this.scene = new vektr.compositing.Scene(this.get('id'), this.config);
    var svg = this.getConfigVal ('svg'),
      ctor = eval(this.getConfigVal('ctor')),// jshint ignore:line
      p;  

    if (!lib.isFunction (ctor)) return q.reject(new Error('Failed to instantiate SVG, ctor is not a function'));
    this.renderers = [];

    if (lib.isString(svg)) {
      p = this._loadSVG(svg, ctor);
    }else{
      p = q.all([this._loadSVG(svg.horizontal, ctor), this._loadSVG(svg.vertical, ctor)]);
    }

    return p.then (this._runRenderers.bind(this));
  };

  VektrCanvas.prototype.unload = function () {
    this.$element.empty();
  };

  VektrCanvas.prototype._runRenderers = function () {
    console.log('ABOUT TO RUN RENDERERS ...');
    this.renderers.forEach (lib.doMethod.bind(null, 'runOn', [this.get('id')]));
    return q.resolve(true);
  };

  VektrCanvas.prototype.CONFIG_SCHEMA = function () {
    return CANVAS_SCHEMA;
  };

  VektrCanvas.prototype.DEFAULT_CONFIG = function () {
    return {
      debug : true,
      autoresize: true,
      mindOrientation : false
    };
  };

  VektrCanvas.prototype.set_actual = function (val) {
    WebElement.prototype.set_actual.call(this, val);
    window.onresize();
  };

  module.elements.VektrCanvas = VektrCanvas;
  applib.registerElementType ('VektrCanvas', VektrCanvas);
})(ALLEX, ALLEX.WEB_COMPONENTS.allex_web_webappcomponent, ALLEX.WEB_COMPONENTS.allex_applib, vektr, jQuery);
