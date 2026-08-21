module('Selection containers - Multiple');

var MultipleSelection = require('select2/selection/multiple');
var InlineSearch = require('select2/selection/search');

var $ = require('jquery');
var KEYS = require('select2/keys');
var Options = require('select2/options');
var Utils = require('select2/utils');

var options = new Options({});

test('display uses templateSelection', function (assert) {
  var called = false;

  var templateOptions = new Options({
    templateSelection: function (data) {
      called = true;

      return data.text;
    }
  });

  var selection = new MultipleSelection(
    $('#qunit-fixture .multiple'),
    templateOptions
  );

  var out = selection.display({
    text: 'test'
  });

  assert.ok(called);

  assert.equal(out, 'test');
});

test('templateSelection can addClass', function (assert) {
  var called = false;

  var templateOptions = new Options({
    templateSelection: function (data, container) {
      called = true;
      container.addClass('testclass');
      return data.text;
    }
  });

  var selection = new MultipleSelection(
    $('#qunit-fixture .multiple'),
    templateOptions
  );

  var $container = selection.selectionContainer();

  var out = selection.display({
    text: 'test'
  }, $container);

  assert.ok(called);

  assert.equal(out, 'test');

  assert.ok($container.hasClass('testclass'));
});

test('empty update clears the selection', function (assert) {
  var selection = new MultipleSelection(
    $('#qunit-fixture .multiple'),
    options
  );

  var $selection = selection.render();
  var $rendered = $selection.find('.select2-selection__rendered');

  $rendered.text('testing');

  selection.update([]);

  assert.equal($rendered.text(), '');
});

test('escapeMarkup is being used', function (assert) {
  var selection = new MultipleSelection(
    $('#qunit-fixture .multiple'),
    options
  );

  var $selection = selection.render();
  var $rendered = $selection.find('.select2-selection__rendered');

  var unescapedText = '<script>bad("stuff");</script>';

  selection.update([{
    text: unescapedText
  }]);

  assert.equal(
    $rendered.text().substr(1),
    unescapedText,
    'The text should be escaped by default to prevent injection'
  );
});

test('clear button respects the disabled state', function (assert) {
  var options = new Options({
    disabled: true
  });

  var $select = $('#qunit-fixture .multiple');

  var container = new MockContainer();
  var $container = $('<div></div>');

  var selection = new MultipleSelection(
    $select,
    options
  );

  var $selection = selection.render();
  $container.append($selection);

  selection.bind(container, $container);

  // Select an option
  selection.update([{
    text: 'Test'
  }]);

  var $rendered = $selection.find('.select2-selection__rendered');

  var $pill = $rendered.find('.select2-selection__choice');

  assert.equal($pill.length, 1, 'There should only be one selection');

  var $remove = $pill.find('.select2-selection__choice__remove');

  assert.equal(
    $remove.length,
    1,
    'The remove icon is displayed for the selection'
  );

  // Set up the unselect handler
  selection.on('unselect', function (params) {
    assert.ok(false, 'The unselect handler should not be triggered');
  });

  // Trigger the handler for the remove icon
  $remove.trigger('click');

  var enter = $.Event('keydown', {
    which: KEYS.ENTER
  });
  $remove.trigger(enter);

  var spaceDown = $.Event('keydown', {
    which: KEYS.SPACE
  });
  $remove.trigger(spaceDown);

  var spaceUp = $.Event('keyup', {
    which: KEYS.SPACE
  });
  $remove.trigger(spaceUp);
});

test('clicking remove unselects without toggling', function (assert) {
  var $select = $('#qunit-fixture .multiple');
  var $container = $('#qunit-fixture .event-container');
  var container = new MockContainer();
  var selection = new MultipleSelection($select, options);
  var $selection = selection.render();

  $container.append($selection);
  selection.bind(container, $container);
  selection.update([{
    id: '1',
    text: 'One'
  }]);

  var unselectCount = 0;
  var toggleCount = 0;
  var bubbledClickCount = 0;

  selection.on('unselect', function () {
    unselectCount++;
  });
  selection.on('toggle', function () {
    toggleCount++;
  });
  $container.on('click', function () {
    bubbledClickCount++;
  });

  $selection.find('.select2-selection__choice__remove').trigger('click');

  assert.equal(unselectCount, 1, 'The choice is unselected once');
  assert.equal(toggleCount, 0, 'The dropdown is not toggled');
  assert.equal(bubbledClickCount, 1, 'The click continues to bubble');
});

test('Enter removes a choice and focuses the next choice', function (assert) {
  var done = assert.async();
  var data = [
    { id: '1', text: 'One' },
    { id: '2', text: 'Two' },
    { id: '3', text: 'Three' }
  ];
  var $container = $('#qunit-fixture .event-container');
  var container = new MockContainer();
  var selection = new MultipleSelection(
    $('#qunit-fixture .multiple'),
    options
  );
  var $selection = selection.render();

  $container.append($selection);
  selection.bind(container, $container);
  selection.update(data);

  var unselected;
  var toggleCount = 0;
  var keypressCount = 0;
  var bubbledKeydownCount = 0;

  selection.on('unselect', function (params) {
    unselected = params.data;
    selection.update([data[0], data[2]]);
  });
  selection.on('toggle', function () {
    toggleCount++;
  });
  selection.on('keypress', function () {
    keypressCount++;
  });
  $container.on('keydown', function () {
    bubbledKeydownCount++;
  });

  var $remove = $selection.find('.select2-selection__choice__remove').eq(1);
  var enter = $.Event('keydown', {
    which: KEYS.ENTER
  });

  $remove.focus();
  $remove.trigger(enter);

  assert.equal(unselected.text, 'Two', 'Enter unselects the focused choice');
  assert.ok(enter.isDefaultPrevented(), 'Enter prevents its default action');
  assert.equal(toggleCount, 0, 'Enter does not toggle the dropdown');
  assert.equal(keypressCount, 0, 'Enter does not reach the combobox handler');
  assert.equal(bubbledKeydownCount, 1, 'Enter continues to bubble');

  window.setTimeout(function () {
    var $remaining = $selection.find(
      '.select2-selection__choice__remove'
    );

    assert.equal(
      document.activeElement,
      $remaining.eq(1)[0],
      'Focus moves to the next choice'
    );

    done();
  }, 10);
});

test('removing the last choice focuses the previous choice', function (assert) {
  var done = assert.async();
  var data = [
    { id: '1', text: 'One' },
    { id: '2', text: 'Two' },
    { id: '3', text: 'Three' }
  ];
  var $container = $('#qunit-fixture .event-container');
  var container = new MockContainer();
  var selection = new MultipleSelection(
    $('#qunit-fixture .multiple'),
    options
  );
  var $selection = selection.render();

  $container.append($selection);
  selection.bind(container, $container);
  selection.update(data);

  selection.on('unselect', function () {
    selection.update([data[0], data[1]]);
  });

  var $remove = $selection.find('.select2-selection__choice__remove').eq(2);
  var enter = $.Event('keydown', {
    which: KEYS.ENTER
  });

  $remove.focus();
  $remove.trigger(enter);

  window.setTimeout(function () {
    var $remaining = $selection.find(
      '.select2-selection__choice__remove'
    );

    assert.equal(
      document.activeElement,
      $remaining.eq(1)[0],
      'Focus moves to the previous choice'
    );

    done();
  }, 10);
});

test('Space removes on keyup and focuses search when empty', function (assert) {
  var done = assert.async();
  var $container = $('#qunit-fixture .event-container');
  var container = new MockContainer();
  var CustomSelection = Utils.Decorate(MultipleSelection, InlineSearch);
  var selection = new CustomSelection(
    $('#qunit-fixture .multiple'),
    options
  );
  var $selection = selection.render();

  $container.append($selection);
  selection.bind(container, $container);
  selection.update([{
    id: '1',
    text: 'One'
  }]);

  var unselectCount = 0;
  selection.on('unselect', function () {
    unselectCount++;
    selection.update([]);
  });

  var $remove = $selection.find('.select2-selection__choice__remove');
  var spaceDown = $.Event('keydown', {
    which: KEYS.SPACE
  });
  var spaceUp = $.Event('keyup', {
    which: KEYS.SPACE
  });

  $remove.focus();
  $remove.trigger(spaceDown);

  assert.equal(unselectCount, 0, 'Space does not activate on keydown');
  assert.ok(spaceDown.isDefaultPrevented(), 'Space prevents page scrolling');

  $remove.trigger(spaceUp);

  assert.equal(unselectCount, 1, 'Space activates once on keyup');
  assert.ok(spaceUp.isDefaultPrevented(), 'Space keyup is handled');

  window.setTimeout(function () {
    assert.equal(
      document.activeElement,
      $selection.find('.select2-search__field')[0],
      'Focus moves to search when no choices remain'
    );

    done();
  }, 10);
});

test('cancelled keyboard removal keeps focus on the choice', function (assert) {
  var done = assert.async();
  var $container = $('#qunit-fixture .event-container');
  var container = new MockContainer();
  var selection = new MultipleSelection(
    $('#qunit-fixture .multiple'),
    options
  );
  var $selection = selection.render();

  $container.append($selection);
  selection.bind(container, $container);
  selection.update([{
    id: '1',
    text: 'One'
  }]);

  var $remove = $selection.find('.select2-selection__choice__remove');
  var enter = $.Event('keydown', {
    which: KEYS.ENTER
  });

  $remove.focus();
  $remove.trigger(enter);

  window.setTimeout(function () {
    assert.equal(
      document.activeElement,
      $remove[0],
      'Focus remains when the choice is not removed'
    );

    done();
  }, 10);
});

test('other keys do not activate remove or reach combobox', function (assert) {
  var $container = $('#qunit-fixture .event-container');
  var container = new MockContainer();
  var selection = new MultipleSelection(
    $('#qunit-fixture .multiple'),
    options
  );
  var $selection = selection.render();

  selection.bind(container, $container);
  selection.update([{
    id: '1',
    text: 'One'
  }]);

  var unselectCount = 0;
  var keypressCount = 0;

  selection.on('unselect', function () {
    unselectCount++;
  });
  selection.on('keypress', function () {
    keypressCount++;
  });

  var letter = $.Event('keydown', {
    which: 65
  });

  $selection.find('.select2-selection__choice__remove').trigger(letter);

  assert.equal(unselectCount, 0, 'Other keys do not unselect the choice');
  assert.equal(keypressCount, 0, 'Other keys do not reach the combobox');
});
