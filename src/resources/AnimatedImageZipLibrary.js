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


  AnimatedImageZipLibrary.prototype.doUnload = function () {
    var defer = q.defer();
    this.zl.destroy();
    console.log('SAMO DA VIDIM ...', this.zl);
    this.zl = null;

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
