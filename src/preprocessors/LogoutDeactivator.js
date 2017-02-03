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
    }

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
