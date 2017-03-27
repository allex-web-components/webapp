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

  DataViewProcessor.prototype._applyRowEventLogic  = function (desc, path, event_descriptor, event_name) {
    applib.misc.initLogic(desc);
    if (!event_descriptor.handler) {
      throw new Error('DataView '+path+'has no event handler for event '+event_name);
    }

    if (!event_descriptor.references) {
      throw new Error('DataView '+path+'has no references for event '+event_name);
    }
    desc.logic.push ({
      triggers : 'element.'+path+'.$element!'+event_name,
      references : event_descriptor.references,
      handler : event_descriptor.handler
    });

  };

  DataViewProcessor.prototype._applyRowEventLink = function (desc, path, event_descriptor, event_name) {
    applib.misc.initLinks (desc);
    desc.links.push ({
      source : 'element.'+path+'.$element!'+event_name,
      target : event_descriptor.target,
      filter : event_descriptor.filter
    });
  };

  DataViewProcessor.prototype._processRowEvent = function (desc, path, event_descriptor, event_name) {
    if (event_descriptor.handler && event_descriptor.references) return this._applyRowEventLogic (desc, path, event_descriptor, event_name);
    if (event_descriptor.target) return this._applyRowEventLink (desc, path, event_descriptor, event_name);
    throw new Error('Unknow event handler for _processRowEvent: '+event_name+' in '+path);
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

    if (view.rowEvents) {
      lib.traverseShallow (view.rowEvents, this._processRowEvent.bind(this, desc, path));
    }
  };

  applib.registerPreprocessor ('DataView', DataViewProcessor);
})(ALLEX, ALLEX.WEB_COMPONENTS.allex_web_webappcomponent, ALLEX.WEB_COMPONENTS.allex_applib, jQuery);
