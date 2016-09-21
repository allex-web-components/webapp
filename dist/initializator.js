(function (allex, global) {
  var ss = new allex.lib.Map();
  allex.WEB_COMPONENTS.allex_web_webappcomponent = {
    resources : {},
    APP : null,
    elements: {},
    mixins : {},
    SlugStorage : ss
  };

  global.AllexWebAppSlugStorage = ss;
})(ALLEX, window);
