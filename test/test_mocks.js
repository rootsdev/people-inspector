chrome = {};
chrome.tabs = {};
chrome.tabs.query = function() {}
chrome.windows = { WINDOW_ID_CURRENT: -2 };

var JSUNIT_UNDEFINED_VALUE;

function out(msg) {
  document.body.innerHTML = document.body.innerHTML + msg;
}

function outln(msg) {
  out(msg + "<br>");
}

var _trueTypeOf = function(something) {
  var result = typeof something;
  try {
    switch (result) {
      case 'string':
        break;
      case 'boolean':
        break;
      case 'number':
        break;
      case 'object':
        if (something == null) {
          result = 'null';
          break;
        }
      case 'function':
        switch (something.constructor) {
          case new String('').constructor:
            result = 'String';
            break;
          case new Boolean(true).constructor:
            result = 'Boolean';
            break;
          case new Number(0).constructor:
            result = 'Number';
            break;
          case new Array().constructor:
            result = 'Array';
            break;
          case new RegExp().constructor:
            result = 'RegExp';
            break;
          case new Date().constructor:
            result = 'Date';
            break;
          case Function:
            result = 'Function';
            break;
          default:
            var m = something.constructor.toString().match(
                /function\s*([^( ]+)\(/);
            if (m) {
              result = m[1];
            } else {
              break;
            }
        }
        break;
    }
  } catch (e) {

  } finally {
    result = result.substr(0, 1).toUpperCase() + result.substr(1);
  }
  return result;
};

var _displayStringForValue = function(aVar) {
  var result;
  try {
    result = '<' + String(aVar) + '>';
  } catch (ex) {
    result = '<toString failed: ' + ex.message + '>';
    // toString does not work on this object :-(
  }
  if (!(aVar === null || aVar === JSUNIT_UNDEFINED_VALUE)) {
    result += ' (' + _trueTypeOf(aVar) + ')';
  }
  return result;
};

/**
 * @param {*} expected The expected value.
 * @param {*} actual The actual value.
 * @return {string} A failure message of the values don't match.
 * @private
 */
getDefaultErrorMsg_ = function(expected, actual) {
  var msg = 'Expected ' + _displayStringForValue(expected) + ' but was ' +
      _displayStringForValue(actual);
  if ((typeof expected == 'string') && (typeof actual == 'string')) {
    // Try to find a human-readable difference.
    var limit = Math.min(expected.length, actual.length);
    var commonPrefix = 0;
    while (commonPrefix < limit &&
        expected.charAt(commonPrefix) == actual.charAt(commonPrefix)) {
      commonPrefix++;
    }

    var commonSuffix = 0;
    while (commonSuffix < limit &&
        expected.charAt(expected.length - commonSuffix - 1) ==
            actual.charAt(actual.length - commonSuffix - 1)) {
      commonSuffix++;
    }

    if (commonPrefix + commonSuffix > limit) {
      commonSuffix = 0;
    }

    if (commonPrefix > 2 || commonSuffix > 2) {
      var printString = function(str) {
        var startIndex = Math.max(0, commonPrefix - 2);
        var endIndex = Math.min(str.length, str.length - (commonSuffix - 2));
        return (startIndex > 0 ? '...' : '') +
            str.substring(startIndex, endIndex) +
            (endIndex < str.length ? '...' : '');
      };

      msg += '\nDifference was at position ' + commonPrefix +
          '. Expected [' + printString(expected) +
          '] vs. actual [' + printString(actual) + ']';
    }
  }
  return msg;
};


var argumentsIncludeComments = function(expectedNumberOfNonCommentArgs, args) {
  return args.length == expectedNumberOfNonCommentArgs + 1;
};

var commentArg = function(expectedNumberOfNonCommentArgs, args) {
  if (argumentsIncludeComments(expectedNumberOfNonCommentArgs, args)) {
    return args[0];
  }

  return null;
};

var nonCommentArg = function(desiredNonCommentArgIndex,
    expectedNumberOfNonCommentArgs, args) {
  return argumentsIncludeComments(expectedNumberOfNonCommentArgs, args) ?
      args[desiredNonCommentArgIndex] :
      args[desiredNonCommentArgIndex - 1];
};

/**
 * Returns true if the specified value is a boolean
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is boolean.
 */
var isBoolean = function(val) {
  return typeof val == 'boolean';
};

var _validateArguments = function(expectedNumberOfNonCommentArgs, args) {
  var valid = args.length == expectedNumberOfNonCommentArgs ||
      args.length == expectedNumberOfNonCommentArgs + 1 &&
      typeof args[0] == 'string';
  _assert(null, valid, 'Incorrect arguments passed to assert function');
};

var _assert = function(comment, booleanValue, failureMessage) {
  if (!booleanValue) {
    outln(comment + ": " + failureMessage);
  }
};

/**
 * @param {*} a The expected value (2 args) or the debug message (3 args).
 * @param {*} b The actual value (2 args) or the expected value (3 args).
 * @param {*=} opt_c The actual value (3 args only).
 */
var assertEquals = function(a, b, opt_c) {
  _validateArguments(2, arguments);
  var var1 = nonCommentArg(1, 2, arguments);
  var var2 = nonCommentArg(2, 2, arguments);
  _assert(commentArg(2, arguments), var1 === var2,
      getDefaultErrorMsg_(var1, var2));
};


/**
 * @param {*} a The value to assert (1 arg) or debug message (2 args).
 * @param {*=} opt_b The value to assert (2 args only).
 */
var assertTrue = function(a, opt_b) {
  _validateArguments(1, arguments);
  var comment = commentArg(1, arguments);
  var booleanValue = nonCommentArg(1, 1, arguments);

  _assert(comment, isBoolean(booleanValue),
      'Bad argument to assertTrue(boolean)');
  _assert(comment, booleanValue, 'Call to assertTrue(boolean) with false');
};


/**
 * @param {*} a The value to assert (1 arg) or debug message (2 args).
 * @param {*=} opt_b The value to assert (2 args only).
 */
var assertFalse = function(a, opt_b) {
  _validateArguments(1, arguments);
  var comment = commentArg(1, arguments);
  var booleanValue = nonCommentArg(1, 1, arguments);

  _assert(comment, isBoolean(booleanValue),
      'Bad argument to assertFalse(boolean)');
  _assert(comment, !booleanValue, 'Call to assertFalse(boolean) with true');
};


/**
 * @param {*} a The value to assert (1 arg) or debug message (2 args).
 * @param {*=} opt_b The value to assert (2 args only).
 */
var assertNull = function(a, opt_b) {
  _validateArguments(1, arguments);
  var aVar = nonCommentArg(1, 1, arguments);
  _assert(commentArg(1, arguments), aVar === null,
      getDefaultErrorMsg_(null, aVar));
};
