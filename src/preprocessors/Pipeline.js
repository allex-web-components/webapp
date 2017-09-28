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
    } /*else{
      this.values = null;
    }*/
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

