(function (allex, module, applib, $) {
  'use strict';

  var lib = allex.lib,
    BasicElement = applib.BasicElement,
    BasicProcessor = applib.BasicProcessor;

  function bindEvents (selector, hook, val, key) {
    $(selector).jkey (key, hook.fire.bind (hook, {key : key, value : val}));
  }

  function KeyboardInputElement (id, options) {
    BasicElement.call(this, id, options);
    this.onUp = new lib.HookCollection();
    lib.traverseShallow (options.events.up, bindEvents.bind(null, options.selector || document, this.onUp));
  }
  lib.inherit (KeyboardInputElement, BasicElement);

  KeyboardInputElement.prototype.__cleanUp = function () {
    this.onUp.destroy();
    this.onUp = null;
    BasicElement.prototype.__cleanUp.call(this);
  };

  KeyboardInputElement.prototype.initialize = function () {
    BasicElement.prototype.initialize.call(this);
  };

  applib.registerElementType ('KeyboardInputElement', KeyboardInputElement);

  function KeyboardProcessor () {
    BasicProcessor.call(this);
  }
  lib.inherit (KeyboardProcessor, BasicProcessor);

  KeyboardProcessor.prototype.process = function (desc) {
    if (!this.config) return; //pa sto me uopste zoves ....
    if (!this.config.element_name) throw new Error ('No element input');
    if (!this.config.events) throw new Error ('No events listed');
    desc.elements.push ({
      name : this.config.element_name,
      type : 'KeyboardInputElement',
      options : {
        events : this.config.events
      }
    });
  };

  applib.registerPreprocessor ('KeyboardController', KeyboardProcessor);
})(ALLEX, ALLEX.WEB_COMPONENTS.allex_web_webappcomponent, ALLEX.WEB_COMPONENTS.allex_applib, jQuery);
