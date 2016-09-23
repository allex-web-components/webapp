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
      },
      baseURL : {type : 'string'},
      volume : {type : 'number'},
      ispermanent : {type : 'boolean'}
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


  HowlerResource.prototype.doLoad = function () {
    var defaults = {
      baseURL : this.getConfigVal('baseURL'),
      volume : this.getConfigVal('volume')
    };

    var p = lib.q.all(this.getConfigVal ('sounds').map(this._loadASound.bind(this, defaults)));
    p.done(console.log.bind(console, 'done'), console.log.bind(console, 'failed'));

    var defer = lib.q.defer();
    lib.qlib.promise2defer(p, defer);
    return defer;
  };

  function toURL (baseURL, url) {
    //za sad neka ga ovako ...
    return baseURL+'/'+url;
  }

  HowlerResource.prototype._loadASound = function (defaults, ni) {
    var d = lib.q.defer(),
      item = lib.extend ({}, defaults, ni),
      h =  new Howl ({
      src : item.files.map (toURL.bind(null, item.baseURL)),
      autoplay: false,
      volume : 'volume' in item ? item.volume : 1,
      loop : item.loop || false,
      sprite : item.sprite || undefined,
      preload : true,
      mute : false,
      onload : d.resolve.bind(d, true),
      onloaderror : this._failed.bind(this,d),
      html5: lib.isUndef(item.html5) ? true : item.html5
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

  HowlerResource.prototype.start = function (sound, sprite) {
    ///will resolve promise once ended ...
    var hs = this.getSound(sound);

    if (!hs) return d.reject (new Error('No sound '+sound));

    var d = lib.q.defer(), r = d.resolve.bind(d, true);
    hs.on ('stop', r);
    hs.on ('end', r);

    hs.play(sprite);
    return d.promise.then (_unhookStart.bind(null, hs, r));
  };

  function _unhookStart (hs, r) {
    hs.off('stop', r);
    hs.off('end', r);
    return lib.q.resolve(true);
  }

  //TODO: neka ga ovde za sad ... moze to i pametnije ...
  HowlerResource.prototype.muteAllSounds = Howler.mute.bind(Howler);
  HowlerResource.prototype.stopResourceSounds = function () {
    this.sounds.traverse(lib.doMethod.bind(null, 'stop', null));
  };

  HowlerResource.prototype.CONFIG_SCHEMA = function () { return CONFIG_SCHEMA; };
  HowlerResource.prototype.DEFAULT_CONFIG = function () { return null; };

  HowlerResource.prototype.loopSound = function (name, sprite) {
    var sound = this.getSound(name);
    if (!sound) throw new Error('No sound registered: '+name);
    return new AllexHowlerLooper (sound, sprite);
  };


  function AllexHowlerLooper (sound, sprite) {

    if (sprite && !lib.isString(sprite)) {
      throw new Error('Unable to play sound sprites upon something that is not a string: '+sprite);
    }

    this.sound = sound;
    this.sprite = sprite || undefined;
    this._cnt = null;
    this._onend = this._onEnd.bind(this);
    this.reps = 0;
    this.defer = null;
    this._time = null;
  }

  AllexHowlerLooper.prototype.destroy = function () {
    this.sound = null;
    this.sprite = null;
    this._cnt = null;
    this._onend = null;
    this.reps = null;
    this.defer = null;
    this._time = null;
  };

  AllexHowlerLooper.prototype.stop = function () {
    if (this.defer) {
      this.defer.resolve(true);
    }
    this.sound.off('end', this._onend);
    this.sound.stop();
    this.reps = 0;
  };

  AllexHowlerLooper.prototype.start = function (repetitions, defer) {
    this._time = (new Date()).getTime();
    if (!defer) defer = lib.q.defer();
    this.reps = lib.isNumber(repetitions) && repetitions > 0 ? repetitions : null;
    this.defer = defer;
    this.sound.on('end', this._onend);
    this._onEnd();
    return defer.promise;
  };

  AllexHowlerLooper.prototype._onEnd = function () {
    var old = this._time;
    this._time = (new Date()).getTime();
    //console.log(this._time - old);
    if (!lib.isNull(this.reps)) {
      if (!this.reps) {
        this.stop();
        return;
      }

      this.defer.notify({remaining: this.reps});

      this.reps --;
    }else{
      this.defer.notify({remaining: Infinity});
    }
    this.sound.play(this.sprite);
  };

  module.resources.HowlerResource = HowlerResource;
  applib.registerResourceType ('Howler', HowlerResource);
})(ALLEX, ALLEX.WEB_COMPONENTS.allex_web_webappcomponent, ALLEX.WEB_COMPONENTS.allex_applib);
