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

    function TabViewElement (id, options) {
      BasicElement.call(this, id, options);
      RouterMixIn.call(this);
    }
    lib.inherit (TabViewElement, BasicElement);
    RouterMixIn.addMethods (TabViewElement);

    TabViewElement.prototype.__cleanUp = function () {
      RouterMixIn.prototype.__cleanUp.call(this);
      BasicElement.prototype.__cleanUp.call(this);
    };

    TabViewElement.prototype._doInitializeView = function (tablist, tabs, tabsmap, default_tab){
      this.default_page = default_tab;
      for (var i = 0; i < tablist.length; i++) {
        this.addPage (tabsmap[tablist[i]], tabs[i]);
      }
      this.reset();
    };

    TabViewElement.prototype.getContainer = function () {
      return null;
    };

    applib.registerElementType ('TabViewElement', TabViewElement);


    function TabViewProcessor () {
      BasicProcessor.call(this);
    }
    lib.inherit (TabViewProcessor, BasicProcessor);
    TabViewProcessor.prototype.destroy = function () {
      BasicProcessor.prototype.destroy.call(this);
    };

    TabViewProcessor.prototype.process = function (desc){
      //za sad samo ovako ....
      for (var tv_name in this.config) {
        this.createTabView (tv_name, this.config[tv_name], desc);
      }
    };

    TabViewProcessor.prototype.createTabView = function (name, config, desc) {
      if (!config.tabs) throw new Error ('No tabs record in config for tab view ', name);
      var refs = ['element.'+name+'_tab_view'];
      desc.elements.push ({
        name : name+'_tab_view',
        type : 'TabViewElement',
        options : {
          toggle : config.toggle || false
        }
      });

      var tablist = Object.keys (config.tabs);
      Array.prototype.push.apply(refs, tablist);

      desc.logic.push ({
        triggers : '.!ready',
        references : refs.join (','),
        handler : this._initializeElement.bind(this, name, config, tablist)
      });

      if (!config.selector) return; //nothing more to be done ...
      desc.logic.push ({
        triggers : config.selector+'.$element!onSelected',
        references : refs[0],
        handler : this._onSelected.bind(this)
      });
    };

    TabViewProcessor.prototype._initializeElement = function (name, config, tablist, element) {
      var tabs = Array.prototype.slice.call(arguments, 4);
      element._doInitializeView (tablist, tabs, config.tabs, config.default_tab || null);
    };

    TabViewProcessor.prototype._onSelected = function (tabview, evnt, page) {
      if (page === tabview.get('page') && tabview.getConfigVal ('toggle')){
        tabview.clear();
        return;
      }
      tabview.set('page', page);
    };

    applib.registerPreprocessor ('TabView', TabViewProcessor);


})(ALLEX, ALLEX.WEB_COMPONENTS.allex_web_webappcomponent, ALLEX.WEB_COMPONENTS.allex_applib, jQuery);
