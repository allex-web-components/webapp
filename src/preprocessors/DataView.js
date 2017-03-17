(function (allex, module, applib, $) {
  'use strict';

  var lib = allex.lib,
    BasicProcessor = applib.BasicProcessor;

  function DataViewProcessor () {
    BasicProcessor.call(this);
  }
  lib.inherit (DataViewProcessor, BasicProcessor);

  DataViewProcessor.prototype.process = function (desc) {
    if (!this.config || !this.config.views) return;
    lib.traverseShallow (this.config.views, this._processView.bind(this, desc));
  };

  DataViewProcessor.prototype._processView = function (desc, view, path) {
    var pspl = path.split('.'),
      view_name = pspl.pop(),
      p_arent = applib.misc.findElement (desc, pspl.join('.')),
      view_type = view.type || this.config.defaults.view_type;

    if (applib.misc.findElement (p_arent, view_name)) {
      throw new Error('Element on path '+path+' already exists');
    }

    applib.misc.initElements (p_arent);
    p_arent.options.elements.push ({
      name : view_name,
      type : view_type,
      options : lib.extend({}, this.config.defaults[view_type], view.config)
    });
  };

  applib.registerPreprocessor ('DataView', DataViewProcessor);
})(ALLEX, ALLEX.WEB_COMPONENTS.allex_web_webappcomponent, ALLEX.WEB_COMPONENTS.allex_applib, jQuery);
