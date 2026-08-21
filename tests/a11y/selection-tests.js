module('Accessibility - All');

var BaseSelection = require('select2/selection/base');
var SingleSelection = require('select2/selection/single');
var MultipleSelection = require('select2/selection/multiple');

var $ = require('jquery');

var Options = require('select2/options');
var options = new Options({});

test('title is carried over from original element', function (assert) {
  var $select = $('#qunit-fixture .single');

  var selection = new BaseSelection($select, options);
  var $selection = selection.render();

  assert.equal(
    $selection.attr('title'),
    $select.attr('title'),
    'The title should have been copied over from the original element'
  );
});

test('aria-expanded reflects the state of the container', function (assert) {
  var $select = $('#qunit-fixture .single');

  var selection = new BaseSelection($select, options);
  var $selection = selection.render();

  var container = new MockContainer();

  selection.bind(container, $('<span></span>'));

  assert.equal(
    $selection.attr('aria-expanded'),
    'false',
    'The container should not be expanded when it is closed'
  );

  container.trigger('open');

  assert.equal(
    $selection.attr('aria-expanded'),
    'true',
    'The container should be expanded when it is opened'
  );
});

test('static aria attributes are present', function (assert) {
  var $select = $('#qunit-fixture .single');

  var selection = new BaseSelection($select, options);
  var $selection = selection.render();

  assert.equal(
    $selection.attr('role'),
    'combobox',
    'The container should identify as a combobox'
  );

  assert.equal(
    $selection.attr('aria-haspopup'),
    'true',
    'The dropdown is considered a popup of the container'
  );
});

test('the container should be in the tab order', function (assert) {
  var $select = $('#qunit-fixture .single');

  var selection = new BaseSelection($select, options);
  var $selection = selection.render();

  var container = new MockContainer();
  selection.bind(container, $('<span></span>'));

  assert.equal(
    $selection.attr('tabindex'),
    '0',
    'The tab index should allow it to fit in the natural tab order'
  );

  container.trigger('disable');

  assert.equal(
    $selection.attr('tabindex'),
    '-1',
    'The selection should be dropped out of the tab order when disabled'
  );

  container.trigger('enable');

  assert.equal(
    $selection.attr('tabindex'),
    '0',
    'The tab index should be restored when re-enabled'
  );
});

test('a custom tabindex is copied', function (assert) {
  var $select = $('#qunit-fixture .single');
  $select.attr('tabindex', '999');

  var selection = new BaseSelection($select, options);
  var $selection = selection.render();

  var container = new MockContainer();
  selection.bind(container, $('<span></span>'));

  assert.equal(
    $selection.attr('tabindex'),
    '999',
    'The tab index should match the original tab index'
  );

  container.trigger('disable');

  assert.equal(
    $selection.attr('tabindex'),
    '-1',
    'The selection should be dropped out of the tab order when disabled'
  );

  container.trigger('enable');

  assert.equal(
    $selection.attr('tabindex'),
    '999',
    'The tab index should be restored when re-enabled'
  );
});

module('Accessibility - Single');

test('aria-labelledby should match the rendered container', function (assert) {
  var $select = $('#qunit-fixture .single');

  var selection = new SingleSelection($select, options);
  var $selection = selection.render();

  var container = new MockContainer();
  selection.bind(container, $('<span></span>'));

  var $rendered = $selection.find('.select2-selection__rendered');

  assert.equal(
    $selection.attr('aria-labelledby'),
    $rendered.attr('id'),
    'The rendered selection should label the container'
  );
});

module('Accessibility - Multiple');

test('remove controls are accessible buttons', function (assert) {
  var $select = $('#qunit-fixture .multiple');

  var selection = new MultipleSelection($select, options);
  var $selection = selection.render();

  selection.update([{
    id: 'af',
    text: 'Afghanistan'
  }]);

  var $remove = $selection.find('.select2-selection__choice__remove');

  assert.equal(
    $remove.prop('tagName'),
    'SPAN',
    'The element type is unchanged'
  );
  assert.equal(
    $remove.attr('role'),
    'button',
    'The control has button semantics'
  );
  assert.equal($remove.attr('tabindex'), '0', 'The control is tabbable');
  assert.equal(
    $remove.attr('aria-label'),
    'Remove Afghanistan',
    'The control is labelled with the item text'
  );
  assert.ok(
    $remove.attr('aria-hidden') == null,
    'The control is exposed to assistive technology'
  );
});

test('translated remove labels support special characters', function (assert) {
  var translationOptions = new Options({
    language: {
      removeItem: function (item) {
        return 'Delete ' + item.text;
      }
    }
  });

  var selection = new MultipleSelection(
    $('#qunit-fixture .multiple'),
    translationOptions
  );
  var $selection = selection.render();

  selection.update([{
    id: 'special',
    text: 'A <place> & "region"'
  }]);

  var $remove = $selection.find('.select2-selection__choice__remove');

  assert.equal(
    $remove.attr('aria-label'),
    'Delete A <place> & "region"',
    'The translated label safely preserves the item text'
  );
});
