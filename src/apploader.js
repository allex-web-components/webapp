(function (allex, module, applib) {
  'use strict';

  if (!ALLEX_CONFIGURATION.DESCRIPTION_HANDLERS) {
    ALLEX_CONFIGURATION.DESCRIPTION_HANDLERS = {};
  }
  jQuery().ready (applib.bootstrap.bind(applib, ALLEX_CONFIGURATION.CONFIGURATIONS, ALLEX_CONFIGURATION.DESCRIPTION_HANDLERS));


})(ALLEX, ALLEX.WEB_COMPONENTS.allex_web_webappcomponent, ALLEX.WEB_COMPONENTS.allex_applib);
