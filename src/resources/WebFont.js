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
