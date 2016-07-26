(function (allex, module, applib, vektr, $) {
  'use strict';

  var lib = allex.lib,
    WebElement = module.elements.WebElement,
    BasicElement = applib.BasicElement,
    ctrl = vektr.ctrl,
    q = lib.q;

  var CANVAS_SCHEMA = {
    type : "object",
    properties : {
      svg: {
        type : "string"
      },
      autoresize : { type : "boolean" },
      debug : { type : "boolean" },
      ctor : {type : "string"},
      resources : WebElement.ResourcesSchema,
      klass : { type : "string" },
      elements : {type: "array" },
    },
    additionalProperties : false,
    required : ['debug', 'autoresize','svg']
  };


  function Integrator (svgurl, controller, path) {
    ctrl.SVGInstantiator.call(this, svgurl, controller, path);
  }
  lib.inherit(Integrator, ctrl.SVGInstantiator);
  Integrator.prototype.__cleanUp = function () {
    ctrl.SVGInstantiator.prototype.__cleanUp.call(this);
  };

  Integrator.prototype.runOn = function (elid, vektrCanvasObj) {
    if (vektrCanvasObj.isOldSchool()){
      ctrl.SVGInstantiator.prototype.runOn.call(this, elid);
    }else{
      ///TODO !!!
    }
  };

  function VektrCanvas (id, options) {
    WebElement.call(this, id, options);
    this.scene = null;
    this.renderer = null;
    this.vektrEvent = new lib.HookCollection ();
    this.data = null;
  }
  lib.inherit (VektrCanvas, WebElement);
  VektrCanvas.prototype.__cleanUp = function () {
    this.vektrEvent.destroy();
    this.vektrEvent = null;
    this.data = null;
    ///TODO ...
    WebElement.prototype.__cleanUp.call(this);
  };


  function _onVektrLoaded (vcanvas, defer, svg) {
    if (!svg) return defer.reject(new Error('failed to load svg'));
    vcanvas.renderer = svg;
    defer.resolve(svg);
  }

  VektrCanvas.prototype._loadSVG = function (svg_path, ctor) {
    var d = q.defer();
    vektr.load (svg_path, ctor, _onVektrLoaded.bind(null, this, d));
    return d.promise;
  };

  VektrCanvas.prototype.load = function () {
    return WebElement.prototype.load.call(this).then(this._onLoaded.bind(this));
  };

  VektrCanvas.prototype._onLoaded = function () {
    this.scene = new vektr.compositing.Scene(this.get('id'), this.config);
    var svg = this.getConfigVal ('svg'),
      pctor = this.getConfigVal('ctor'),
      ctor = pctor ? eval(pctor) : Integrator,// jshint ignore:line
      p;

    if (!lib.isFunction (ctor)) return q.reject(new Error('Failed to instantiate SVG, ctor is not a function'));
    p = this._loadSVG(svg, ctor);

    if (lib.isString(svg)) {
    }else{
      p = q.all([this._loadSVG(svg.horizontal, ctor), this._loadSVG(svg.vertical, ctor)]);
    }

    return p.then (this._runRenderers.bind(this));
  };

  VektrCanvas.prototype.unload = function () {
    this.$element.empty();
  };

  VektrCanvas.prototype._runRenderers = function () {
    this.renderer.runOn(this.get('id'), this);
    return q.resolve(true);
  };

  VektrCanvas.prototype.CONFIG_SCHEMA = function () {
    return CANVAS_SCHEMA;
  };

  VektrCanvas.prototype.DEFAULT_CONFIG = function () {
    return {
      debug : true,
      autoresize: true
    };
  };

  VektrCanvas.prototype.set_actual = function (val) {
    WebElement.prototype.set_actual.call(this, val);
    window.onresize();
  };

  VektrCanvas.prototype.createElement = function (desc) {
    if (this.getConfigVal('ctor')) {
      return BasicElement.prototype.createElement.call(this, desc);
    }
    console.log('============>>>', this.renderer);
  };

  VektrCanvas.prototype.isOldSchool = function () {
    return !!this.getConfigVal ('ctor') ;
  };

  module.elements.VektrCanvas = VektrCanvas;
  applib.registerElementType ('VektrCanvas', VektrCanvas);
})(ALLEX, ALLEX.WEB_COMPONENTS.allex_web_webappcomponent, ALLEX.WEB_COMPONENTS.allex_applib, vektr, jQuery);
