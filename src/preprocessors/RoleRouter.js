(function (allex, module, applib, $) {
  'use strict';
  var lib = allex.lib,
    BasicElement = applib.BasicElement,
    BasicModifier = applib.BasicModifier,
    BasicProcessor = applib.BasicProcessor,
    cntr = 0,
    misc = applib.misc,
    q = lib.q;

  function RoleRouterElement (id, options) {
    BasicElement.call(this, id, options);
    this.role_router = new module.misc.RoleRouter();
    this.path_prefix = null;
    this.path = null;
  }
  lib.inherit (RoleRouterElement, BasicElement);
  RoleRouterElement.prototype.__cleanUp = function () {
    this.path_prefix = null;
    this.path = null;
    this.role_router.destroy ();
    this.role_router = null;
    BasicElement.prototype.__cleanUp.call(this);
  };

  RoleRouterElement.prototype.gotoPage = function (page) {
    this.role_router.setPageInRole (page);
    this.set('path', page);
  };

  RoleRouterElement.prototype.gotoUniversalRolePage = function (page) {
    this.role_router.gotoUniversalRolePage.apply (this.role_router, arguments);
    this.set('path_prefix', page);
    this.set('path', this.role_router.active_router.default_page);
  };

  RoleRouterElement.prototype.resetToRole = function () {
    this.role_router.resetToRole.apply (this.role_router, arguments);
    this.set('path_prefix', null);
    this.set('path', this.role_router.active_router.default_page);
  };

  RoleRouterElement.prototype.set_path = function (path) {
    this.path = path;
  };

  RoleRouterElement.prototype._checkInitialPath = function () {
    if (this.role_router.role && this.role_router.online) {
      this.set('path', this.role_router.active_router.default_page);
    }
  };

  applib.registerElementType ('RoleRouterElement', RoleRouterElement);

  function onSttusChanged (router, sttus) {
    router.role_router._onStatusChanged (sttus);
    router._checkInitialPath();
  }

  function onRoleChanged (router, role) {
    router.role_router.setRole (role);
    router._checkInitialPath();
  }

  function prepareRole (role, data, pageslist, router, container) {
    var len = pageslist.length,
      pages = Array.prototype.slice.call (arguments, 5, 5+len),
      rr = new module.misc.Router(container);

    for (var i in pageslist) {
      rr.addPage (data.pages[pageslist[i]], pages[i]);
    }
    rr.default_page = data.default_page;
    router.role_router.addRolePage(role, container, null, null, rr);
  }

  function RoleRouter () {
    BasicProcessor.call(this);
  }
  lib.inherit (RoleRouter, BasicProcessor);
  RoleRouter.prototype.destroy = function () {
    BasicProcessor.prototype.destroy.call(this);
  };

  RoleRouter.prototype.processRoleRouter = function (rr_name, rr_data, desc) {
    if (!rr_data.sttusSource) throw new Error("Missing sttusSource");
    if (!rr_data.roleSource) throw new Error('Missing roleSource');
    var name = rr_name+'_router';
    desc.elements.push ({
      name : name,
      type : 'RoleRouterElement'
    });

    desc.logic.push ({
      triggers : rr_data.sttusSource,
      references : 'element.'+name,
      handler : onSttusChanged
    },{
      triggers : rr_data.roleSource,
      references : 'element.'+name,
      handler : onRoleChanged
    });

    if (rr_data.roles) lib.traverseShallow (rr_data.roles, this.processRole.bind(this, desc.logic, 'element.'+name));
    if (rr_data.anyRole) lib.traverseShallow (rr_data.anyRole, this.processAnyRole.bind(this, desc.logic, 'element.'+name));
  };

  RoleRouter.prototype.processAnyRole = function (logic, element_name, data, name) {
    if (!data) return;

    var list = Object.keys (data.pages);

    logic.push({
      triggers : '.!ready',
      references : ([element_name, data.container].concat(list)).join (','),
      handler : suiteUpAnyRole.bind(null, data, list, name)
    });
  };

  function suiteUpAnyRole (data, list, name, router, container) {
    var refs = Array.prototype.slice.call (arguments, 5, 5+list.length);
    var rr = new module.misc.Router(container);

    for (var i = 0; i < list.length; i++) {
      rr.addPage(data.pages[list[i]], refs[i]);
    }

    rr.default_page = data.default_page;
    router.role_router.addUniversalRolePage (name, container, null, null, rr);
  }

  RoleRouter.prototype.processRole = function (logic, element_name, data, role) {
    if (!data.pages) {
      console.warn ('No page for role ',role);
      return;
    }
    var refs = [element_name, data.container], pageslist = Object.keys (data.pages);
    Array.prototype.push.apply (refs, pageslist);

    logic.push ({
      triggers : '.!ready',
      references : refs.join(','),
      handler : prepareRole.bind(null, role, data, pageslist)
    });
  };

  RoleRouter.prototype.process = function (desc) {
    for (var rr_name in this.config) {
      this.processRoleRouter(rr_name, this.config[rr_name], desc);
    }
  };

  applib.registerPreprocessor ('RoleRouter', RoleRouter);

})(ALLEX, ALLEX.WEB_COMPONENTS.allex_web_webappcomponent, ALLEX.WEB_COMPONENTS.allex_applib, jQuery);
