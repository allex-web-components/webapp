(function (allex, module, applib) {
  'use strict';

  jQuery().ready (function () {
    module.APP = applib.createApp(ALLEX_CONFIGURATION.APP, module.abstractions.WebPage);
  });

})(ALLEX, ALLEX.WEB_COMPONENTS.allex_web_webappcomponent, ALLEX.WEB_COMPONENTS.allex_applib);
