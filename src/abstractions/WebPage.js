(function (allex, module, applib, $) {
  'use strict';

  var lib = allex.lib,
    WebElement = module.abstractions.WebElement,
    q = lib.q;

  function WebPage (id, options){
    WebElement.call(this, id, options);
  }
  lib.inherit (WebPage, WebElement);
  WebPage.prototype.__cleanUp = function () {
    WebElement.prototype.__cleanUp.call(this);
  };

  WebPage.prototype.doInitialize = function () {
    this.$element = $('body #'+this.get('id'));
    if (!this.$element.length) throw new Error('Unable to find page element '+this.get('id')+' as body child');
    this.set_actual(this.get('actual'));
  };

  WebPage.prototype.createElements = function (elements) {
    return WebElement.prototype.createElements.call(this, elements);
  };

  module.abstractions.WebPage = WebPage;
})(ALLEX, ALLEX.WEB_COMPONENTS.allex_web_webappcomponent, ALLEX.WEB_COMPONENTS.allex_applib, jQuery);

