(function (allex, module, applib, angular_module) {
  'use strict';

  var lib = allex.lib,
    BasicElement = applib.BasicElement,
    q = lib.q;

  function PipelineItem (){
  }

  PipelineItem.prototype.destroy = function () {
  };

  PipelineItem.prototype.start = function (data) {
    return this._doStart (this.filter(data));
  }

  PipelineItem.prototype.filter = function (data) {
    return data;
  };

  PipelineItem.createPilelineItem = function (ref, index) {
    if (lib.isFunction(ref.executor)) {
      return new FPiplineItem (ref);
    }else{
      return new OPipelineItem(ref);
    }
  };

  function FPiplineItem (ref){
    this.ftion = ref.executor;
    PipelineItem.call(this);
  }
  lib.inherit (FPiplineItem, PipelineItem);
  FPiplineItem.prototype.destroy = function () {
    this.ftion = null;
    PipelineItem.prototype.destroy.call(this);
  };

  FPiplineItem.prototype._doStart = function (data) {
    return this.ftion (data);
  };

  function OPipelineItem (ref) {
    this.obj = ref.instance;
    this.evnt = ref.event;
    this.propname = ref.propname;
    PipelineItem.call(this);
  }
  lib.inherit (OPipelineItem, PipelineItem);
  OPipelineItem.prototype.destroy = function () {
    this.obj = null;
    this.evnt = null;
    this.propname = null;
    PipelineItem.prototype.destroy.call(this);
  };

  OPipelineItem.prototype._doStart = function (data) {
    this._defer = q.defer();
    this.obj.set(this.propname, data);

    this.obj.attachListener(this.evnt, this._isdone.bind(this));
    return this._defer.promise;
  };

  OPipelineItem.prototype._isdone = function (data) {
    console.log('SAAAAAAAAAAAAAMO DA TE VIDIM ...');
    this._defer.resolve (data);
    this._defer = null;
  };

  function Pipeline (id, options) {
    BasicElement.call(this, id, options);
    this.done = new HookCollection();
    this.data = null;
    this.items = null;
  }
  lib.inherit (Pipeline, BasicElement);
  Pipeline.prototype.__cleanUp = function () {
    this.done.destroy();
    this.done = null;
    this.data = null;

    lib.containerDestroyAll(this.items);
    this.items = null;
    BasicElement.prototype.__cleanUp.call(this);
  };

  Pipeline.prototype.setReferences = function (refs) {
    var item, r;
    this.stopListening();
    lib.containerDestroyAll(this.items);
    this.items = null;

    if (!refs || !refs.length) return;
    this.items = refs.map (PipelineItem.createPilelineItem);
  };

  Pipeline.prototype.set_actual = function (val) {
    BasicElement.prototype.set_actual.call(this, val);
    if (val) {
      this.startListening();
    }else{
      this.stopListening();
    }
  };


  Pipeline.prototype.startListening = function () {
    if (!this.items || !this.items.length) {
      //nothing to be done here ...
      lib.runNext (this.set.bind(this, 'actual', false));
      return;
    }
  };

  Pipeline.prototype.stopListening = function () {
    this.items.forEach (lib.runMethod.bind(null, 'detach', null));
  };

  module.elements.Pipeline = Pipeline;
  applib.registerElementType ('Pipeline', Pipeline);

})(ALLEX, ALLEX.WEB_COMPONENTS.allex_web_webappcomponent, ALLEX.WEB_COMPONENTS.allex_applib, angular.module('allex_applib'));

