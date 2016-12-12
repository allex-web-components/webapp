(function (allex, module) {
  'use strict';

  var lib = allex.lib,
    NO_ROLE_PAGE = '#norole#page#',
    CLDestroyable = lib.CLDestroyable;

  function Page (element, onActivated, onDeactivated, router) {
    this.element = element;
    this.onActivated = onActivated;
    this.onDeactivated = onDeactivated;
    this.deactivate();
    this.router = router;
  }

  Page.prototype.destroy = function () {
    this.element = null;
    this.onDeactivated = null;
    this.onActivated = null;
    this.router.destroy(); //I will destroy router since there is no one outside which will destroy it ...
    this.router = null;
  };

  Page.prototype.activate = function () {
    this.element.set('actual', true);
    if (lib.isFunction (this.onActivated)) {
      this.onActivated (this.element);
    }
    if (this.router) {
      this.router.reset();
    }
  };

  Page.prototype.deactivate = function () {
    this.element.set('actual', false);
    if (this.router) {
      this.router.clear();
    }

    if (lib.isFunction(this.onDeactivated)) {
      this.onDeactivated (this.element);
    }

  };

  Page.prototype.gotoSubPage = function (page) {
    if (this.router) {
      if (page) {
        this.router.set('page', page);
      }else{
        this.router.reset();
      }
    }
  };


  function RouterMixIn () {
    this.default_page = null;
    this.pagesmap = new lib.Map();
    this.page = null;
  }
  RouterMixIn.prototype.__cleanUp = function () {
    this.default_page = null;
    this.page = null;
    lib.container.destroyAll (this.pagesmap);
    this.pagesmap.destroy();
    this.pagesmap = null;
  };

  RouterMixIn.prototype.addPage = function (page, allexelement, onActivated, onDeactivated, page_router) {
    this.pagesmap.add(page, new Page (allexelement, onActivated, onDeactivated, page_router));
  };

  RouterMixIn.prototype._doDeactivate = function (page, item, key) {
    if (key === page) return;
    if (item) item.deactivate();
  };

  RouterMixIn.prototype.set_page = function (page) {
    if (this.page === page) return false;
    this.page = page;

    var pp = null, zp = 0, np = null;

    if (page) {
      pp = page.split('/');
      zp = pp.shift();
      np = pp.join('/');
    }

    this.pagesmap.traverse(this._doDeactivate.bind(this, zp));
    var ap = this.pagesmap.get(zp);
    if (!ap) return;
    ap.activate();
    ap.gotoSubPage (np);
    return true;
  };

  RouterMixIn.prototype.reset = function () {
    this.set('page', this.default_page);
  };

  RouterMixIn.prototype.clear = function () {
    this.set('page', null);
    if (this.getContainer()) {
      this.getContainer().set('actual', false);
    }
  };

  RouterMixIn.addMethods = function (chld) {
    lib.inheritMethods(chld, RouterMixIn, 'clear', 'reset', 'set_page', '_doDeactivate', 'addPage'); 
  };


  function Router (container) {
    RouterMixIn.call(this, container);
    this.container = container;
    CLDestroyable.call(this);
  }

  lib.inherit(Router, CLDestroyable);
  RouterMixIn.addMethods (Router);

  Router.prototype.__cleanUp = function () {
    this.container = null;
    RouterMixIn.prototype.__cleanUp.call(this);
    CLDestroyable.prototype.__cleanUp.call(this);
  };

  Router.prototype.getContainer = function () {
    return this.container;
  };

  function getUniversalPageName (name) {
    return '#universal#'+name+'#page';
  }

  function RoleRouter () {
    this.role_router = new Router();
    this.role = null;
    this.active_router = null;
    this.isonline = false;
  }

  lib.inherit (RoleRouter, Router);
  RoleRouter.prototype.destroy = function (){
    this.isonline = null;
    this.active_router = null;
    this.role = null;
    this.role_router.destroy();
    this.role_router = null;
  };

  RoleRouter.prototype.addNoRolePage = function (allexelement, onActivated, onDeactivated, router) {
    this.role_router.addPage (NO_ROLE_PAGE, allexelement, onActivated, onDeactivated, router);
  };

  RoleRouter.prototype.addUniversalRolePage = function (name, allexelement, onActivated, onDeactivated, router) {
    ///THIS_IS_NOT_NO_ROLE_PAGE ... MOVING TO THIS PAGE REQUIRES ROLE TO BE SET ;)
    var n = getUniversalPageName(name);
    this.role_router.addPage(n, allexelement, onActivated, onDeactivated, router);
  };

  RoleRouter.prototype.addRolePage = function (role, allexelement, onActivated, onDeactivated, router) {
    this.role_router.addPage(role, allexelement, onActivated, onDeactivated, router);
  };

  RoleRouter.prototype._prepareActiveRouter = function (name){
    if (this.active_router) {
      this.active_router.clear();
    }

    if (name) {
      var page = this.role_router.pagesmap.get(name);
      this.active_router = page ? page.router : null;
    }else{
      this.active_router = null;
    }

    if (this.active_router) {
      this.active_router.reset();
    }
  };


  RoleRouter.prototype.gotoUniversalRolePage = function (name) {
    if (!this.role) {
      console.warn ('going to universal page ',name,'with no role set ... no can do ...');
      return;
    }
    this._prepareActiveRouter (getUniversalPageName(name));
  };

  RoleRouter.prototype.setRole = function (role) {
    this.role = role;
    if (!this.online) {
      this._prepareActiveRouter(null);
      return;
    }
    this._prepareActiveRouter(role);
    this.role_router.set('page', role ? role : null);
  };

  RoleRouter.prototype.resetToRole = function () {
    this.setRole(this.role);
  };

  RoleRouter.prototype.setPageInRole = function (name) {
    if (!this.active_router) {
      console.warn ('No active router for role '+this.role+'?', 'No can do ...');
      return;
    }
    if (this.active_router) {
      this.active_router.set('page', name);
    }
  };

  RoleRouter.prototype._onStatusChanged = function (sttus) {
    this.online = ('established' === sttus);
    this.setRole ( this.online ? this.role : null);
  };

  module.RouterMixIn = RouterMixIn;
  module.Router = Router;
  module.RoleRouter = RoleRouter;


})(ALLEX, ALLEX.WEB_COMPONENTS.allex_web_webappcomponent.misc);
