(function (allex, module, applib, $) {
  'use strict';
  var lib = allex.lib,
    BasicElement = applib.BasicElement,
    BasicModifier = applib.BasicModifier,
    BasicProcessor = applib.BasicProcessor,
    RouterMixIn = module.misc.RouterMixIn,
    cntr = 0,
    misc = applib.misc,
    q = lib.q;


    function Notificator () {
      BasicProcessor.call(this);
    }
    lib.inherit (Notificator, BasicProcessor);

    Notificator.prototype.process = function (desc) {
      for (var element_name in this.config) {
        this.createNotificationElement (element_name, this.config[element_name], desc);
      }
    };

    function notificationFilter (ftion, data) {
      return {
        name : ftion,
        data : data
      };
    }

    Notificator.prototype.createNotificationElement = function (name, config, desc) {
      var ftion;

      for (var i = 0; i<config.length; i++) {
        ftion = config[i];
        desc.links.push ({
          source : '.>'+ftion,
          target : name+':ftion',
          filter : notificationFilter.bind(null, ftion)
        });
      }
    };

    applib.registerPreprocessor('Notificator', Notificator);

})(ALLEX, ALLEX.WEB_COMPONENTS.allex_web_webappcomponent, ALLEX.WEB_COMPONENTS.allex_applib, jQuery);
