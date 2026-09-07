// Restore the require/define
var require = $.fn.select2.amd.require;
var define = $.fn.select2.amd.define;

// This compatibility adapter is a temporary workaround that lets the modern
// grunt-contrib-qunit runner use the legacy QUnit 1 suite without upgrading
// QUnit and rewriting the tests as part of this change.
if (typeof QUnit.on !== 'function') {
  QUnit.on = function (eventName, callback) {
    if (eventName === 'testStart') {
      QUnit.testStart(function (details) {
        callback({
          fullName: [details.module, details.name],
          moduleName: details.module,
          name: details.name
        });
      });
    } else if (eventName === 'testEnd') {
      QUnit.testDone(function (details) {
        var errors = details.assertions.filter(function (assertion) {
          return !assertion.result;
        });

        callback({
          errors: errors,
          fullName: [details.module, details.name],
          moduleName: details.module,
          name: details.name,
          runtime: details.runtime,
          status: details.skipped ? 'skipped' :
            (details.failed ? 'failed' : 'passed')
        });
      });
    } else if (eventName === 'runEnd') {
      QUnit.done(function (details) {
        callback({
          runtime: details.runtime,
          status: details.failed ? 'failed' : 'passed',
          testCounts: {
            failed: details.failed,
            passed: details.passed,
            skipped: 0,
            todo: 0,
            total: details.total
          }
        });
      });
    }
  };
}

define('qunit', [], function () {
  return QUnit;
});

// Disable jQuery's binding to $
jQuery.noConflict();

var Utils = require('select2/utils');

function MockContainer () {
  MockContainer.__super__.constructor.call(this);
}

Utils.Extend(MockContainer, Utils.Observable);

MockContainer.prototype.isOpen = function () {
  return this.isOpen;
};

var log = [];
var testName;

QUnit.done(function (test_results) {
  var tests = [];
  for(var i = 0, len = log.length; i < len; i++) {
    var details = log[i];
    tests.push({
      name: details.name,
      result: details.result,
      expected: details.expected,
      actual: details.actual,
      source: details.source
    });
  }
  test_results.tests = tests;

  window.global_test_results = test_results;
});
QUnit.testStart(function(testDetails){
  QUnit.log(function(details){
    if (!details.result) {
      details.name = testDetails.name;
      log.push(details);
    }
  });
});
