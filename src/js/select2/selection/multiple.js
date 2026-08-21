define([
  'jquery',
  './base',
  '../utils',
  '../keys'
], function ($, BaseSelection, Utils, KEYS) {
  function MultipleSelection ($element, options) {
    MultipleSelection.__super__.constructor.apply(this, arguments);
  }

  Utils.Extend(MultipleSelection, BaseSelection);

  MultipleSelection.prototype.render = function () {
    var $selection = MultipleSelection.__super__.render.call(this);

    $selection.addClass('select2-selection--multiple');

    $selection.html(
      '<ul class="select2-selection__rendered" aria-live="polite" aria-relevant="additions removals" aria-atomic="true"></ul>'
    );

    return $selection;
  };

  MultipleSelection.prototype.bind = function (container, $container) {
    var self = this;

    MultipleSelection.__super__.bind.apply(this, arguments);

    this.$selection.on('click', function (evt) {
      if (Utils.isRemoveChoiceEvent(evt)) {
        return;
      }

      self.trigger('toggle', {
        originalEvent: evt
      });
    });

    this.$selection.on(
      'click',
      '.select2-selection__choice__remove',
      function (evt) {
        // Ignore the event if it is disabled
        if (self.options.get('disabled')) {
          return;
        }

        var $remove = $(this);
        var $selection = $remove.parent();

        var data = $selection.data('data');

        self.trigger('unselect', {
          originalEvent: evt,
          data: data
        });
      }
    );

    this.$selection.on(
      'keydown',
      '.select2-selection__choice__remove',
      function (evt) {
        if (self.options.get('disabled')) {
          return;
        }

        var $remove = $(this);

        if (evt.which === KEYS.ENTER) {
          evt.preventDefault();

          self._removeChoiceFromKeyboard($remove);
        } else if (evt.which === KEYS.SPACE) {
          evt.preventDefault();

          $remove.data('select2-space-pressed', true);
        }
      }
    );

    this.$selection.on(
      'keyup',
      '.select2-selection__choice__remove',
      function (evt) {
        var $remove = $(this);

        if (
          evt.which !== KEYS.SPACE ||
          !$remove.data('select2-space-pressed')
        ) {
          return;
        }

        evt.preventDefault();
        $remove.removeData('select2-space-pressed');

        if (self.options.get('disabled')) {
          return;
        }

        self._removeChoiceFromKeyboard($remove);
      }
    );

    this.$selection.on(
      'focusout',
      '.select2-selection__choice__remove',
      function () {
        $(this).removeData('select2-space-pressed');
      }
    );

    this.$selection.on('keydown', function (evt) {
      if (Utils.isRemoveChoiceEvent(evt)) {
        return;
      }

      // If user starts typing an alphanumeric key on the keyboard, open if not opened.
      if (!container.isOpen() && evt.which >= 48 && evt.which <= 90) {
        container.open();
      }
    });

    // Focus on the search field when the container is focused instead of the main container.
    container.on( 'focus', function(){
      self.focusOnSearch();
    });
  };

  MultipleSelection.prototype.clear = function () {
    this.$selection.find('.select2-selection__rendered').empty();
  };

  MultipleSelection.prototype.display = function (data, container) {
    var template = this.options.get('templateSelection');
    var escapeMarkup = this.options.get('escapeMarkup');

    return escapeMarkup(template(data, container));
  };

  MultipleSelection.prototype.selectionContainer = function () {
    var $container = $(
      '<li class="select2-selection__choice">' +
        '<span class="select2-selection__choice__remove" role="button" tabindex="0">' +
          '&times;' +
        '</span>' +
      '</li>'
    );

    return $container;
  };

  MultipleSelection.prototype._removeChoiceFromKeyboard = function ($remove) {
    var self = this;
    var removeIndex = this.$selection
      .find('.select2-selection__choice__remove')
      .index($remove);

    $remove.trigger('click');

    window.setTimeout(function () {
      var $removeChoices = self.$selection.find(
        '.select2-selection__choice__remove'
      );

      if ($removeChoices.length > 0) {
        var focusIndex = Math.min(removeIndex, $removeChoices.length - 1);

        $removeChoices.eq(focusIndex).focus();
      } else if ('undefined' !== typeof self.$search) {
        self.focusOnSearch();
      } else {
        self.$selection.focus();
      }
    }, 1);
  };

  /**
   * Focus on the search field instead of the main multiselect container.
   */
  MultipleSelection.prototype.focusOnSearch = function() {
    var self = this;

    if ('undefined' !== typeof self.$search) {
      // Needs 1 ms delay because of other 1 ms setTimeouts when rendering.
      setTimeout(function(){
        // Prevent the dropdown opening again when focused from this.
        // This gets reset automatically when focus is triggered.
        self._keyUpPrevented = true;

        self.$search.focus();
      }, 1);
    }
  }

  MultipleSelection.prototype.update = function (data) {
    this.clear();

    if (data.length === 0) {
      return;
    }

    var $selections = [];

    for (var d = 0; d < data.length; d++) {
      var selection = data[d];

      var $selection = this.selectionContainer();
      var removeItemTag = $selection.html();
      var formatted = this.display(selection, $selection);
      if ('string' === typeof formatted) {
        formatted = Utils.entityDecode(formatted.trim());
      }

      $selection.text(formatted);
      $selection.prepend(removeItemTag);
      $selection.prop('title', selection.title || selection.text);

      var removeItem = this.options.get('translations').get('removeItem');

      $selection.find('.select2-selection__choice__remove').attr(
        'aria-label',
        removeItem(selection)
      );

      $selection.data('data', selection);

      $selections.push($selection);
    }

    var $rendered = this.$selection.find('.select2-selection__rendered');

    Utils.appendMany($rendered, $selections);
  };

  return MultipleSelection;
});
