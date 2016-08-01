(function (allex, module, applib) {
  'use strict';

  var lib = allex.lib,
    BasicResourceLoader = applib.BasicResourceLoader;


  ///TODO: there is a mechanism to monitor all started sounds and stop them all ... but at this moment I don't think we need it at the moment ....


  var CONFIG_SCHEMA = {
    type: 'object',
    properties : {
      sounds : {
        type : 'array',
        items : {
          type : 'object',
          properties: {
            name : { type : 'string' },
            baseURL : { type : 'string' },
            files : {
              type : 'array', 
              items : {type: 'string'},
              volume : {
                type : 'number',
                min : 0,
                max : 1
              },
              minItems: 1
            },
            sprite : {
              type: 'object',
              //key : [offset, duration, (loop)]
            }
          },
          required : ['files', 'name']
        },
        minItems : 1
      }
    },
    additionalProperties  : false
  };


  function HowlerResource (options){
    BasicResourceLoader.call(this, options);
    this.sounds = new lib.Map();
  }
  lib.inherit(HowlerResource, BasicResourceLoader);
  HowlerResource.prototype.__cleanUp = function () {
    this.sounds.destroy();
    this.sounds = null;
    BasicResourceLoader.prototype.__cleanUp.call(this);
  };


  HowlerResource.prototype.load = function () {
    var p = lib.q.all(this.getConfigVal ('sounds').map(this._loadASound.bind(this)));
    p.done(console.log.bind(console, 'done'), console.log.bind(console, 'failed'));
    return p;
  };

  function toURL (baseURL, url) {
    //za sad neka ga ovako ...
    return baseURL+'/'+url;
  }

  HowlerResource.prototype._loadASound = function (item) {
    var d = lib.q.defer();
    var h =  new Howl ({
      src : item.files.map (toURL.bind(null, item.baseURL)),
      autoplay: false,
      volume : 'volume' in item ? item.volume : 1,
      loop : false,
      preload : true,
      mute : false,
      onload : d.resolve.bind(d, true),
      onloaderror : this._failed.bind(this,d)
    });

    this.sounds.add (item.name, h);
    return d.promise;
  };

  HowlerResource.prototype._failed = function (d) {
    console.log('failed to load', arguments);
    d.reject(new Error('failed'));
  };

  HowlerResource.prototype.getSound = function (sound) {
    return this.sounds.get(sound); 
  };

  //TODO: neka ga ovde za sad ... moze to i pametnije ...
  HowlerResource.prototype.muteAllSounds = Howler.mute.bind(Howler);

  HowlerResource.prototype.CONFIG_SCHEMA = function () { return CONFIG_SCHEMA; };
  HowlerResource.prototype.DEFAULT_CONFIG = function () { return null; };

  module.resources.HowlerResource = HowlerResource;
  applib.registerResourceType ('Howler', HowlerResource);
})(ALLEX, ALLEX.WEB_COMPONENTS.allex_web_webappcomponent, ALLEX.WEB_COMPONENTS.allex_applib);
