(function (allex, module, applib, $) {
  'use strict';
  var lib = allex.lib,
    BasicModifier = applib.BasicModifier,
    misc = applib.misc;


  function TimeInterval (options) {
    BasicModifier.call(this, options);
  }
  lib.inherit (TimeInterval, BasicModifier);
  TimeInterval.prototype.ALLOWED_ON = function () {
    return 'AngularFormLogic';
  };

  TimeInterval.prototype.DEFAULT_CONFIG = function () {
    return null;
  };

  TimeInterval.prototype.doProcess = function (name, options, links, logic, resources) {
    misc.addHook (options, 'onInitialized', this._onInitialized.bind(this, this.config));
  };

  TimeInterval.prototype._onInitialized = function (config, el) {
    var $element = el.$element,
      $from = $element.find (config.from),
      $to = $element.find(config.to),
      from_options = lib.extend({}, config.options),
      to_options = lib.extend({}, config.options);

    from_options.maxDate = moment();
    to_options.maxDate = moment();


    if (config.maxDateOffset) {
      from_options.maxDate.add.apply(from_options.maxDate, config.maxDateOffset);
      to_options.maxDate.add.apply(to_options.maxDate, config.maxDateOffset);
    }

    $from.datetimepicker(from_options);
    $to.datetimepicker(to_options);

    $from.on('dp.change', this._onFromChanged.bind(this, config, el, $to, $from));
    $to.on ('dp.change', this._onToChanged.bind(this, config, el, $to, $from));
  };

  TimeInterval.prototype._onToChanged = function (config, el, $to, $from, evnt) {
    var date = evnt.date ? evnt.date.format(config.options.format) : null;
    el.updateHashField ($to.attr('name'), date);
    $from.data('DateTimePicker').maxDate(date ? moment(date, config.options.format) : moment());
  };

  TimeInterval.prototype._onFromChanged = function (config, el, $to, $from, evnt) {
    el.updateHashField ($from.attr('name'), evnt.date ? evnt.date.format(config.options.format) : null);
  };

  applib.registerModifier ('TimeInterval', TimeInterval);

  function TimeIntervalReset (options) {
    BasicModifier.call(this, options);
  }
  lib.inherit (TimeIntervalReset, BasicModifier);
  TimeIntervalReset.prototype.DEFAULT_CONFIG = function () {
    return null;
  };
  TimeIntervalReset.prototype.ALLOWED_ON = function () {
    return 'AngularFormLogic';
  };

  TimeIntervalReset.prototype.doProcess = function (name, options, links, logic, resources) {
    logic.push ({
      triggers : '.'+this.getConfigVal('trigger')+'.$element!click',
      references : '.',
      handler : this._onResetRequested.bind(this, this.config)
    });
  };

  TimeIntervalReset.prototype._onResetRequested = function (config, el) {
    config.elements.forEach (this._resetOnField.bind(this, el));
  };

  TimeIntervalReset.prototype._resetOnField = function (el, id) {
    var $el = el.$element.find(id),
      name = $el.attr('name');

    el.updateHashField(name, null);
    $el.datetimepicker('clear');
  };

  applib.registerModifier ('TimeIntervalReset', TimeIntervalReset);
})(ALLEX, ALLEX.WEB_COMPONENTS.allex_web_webappcomponent, ALLEX.WEB_COMPONENTS.allex_applib, jQuery);
