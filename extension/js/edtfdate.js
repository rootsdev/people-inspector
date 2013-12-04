// Copyright 2013 Google Inc. All Rights Reserved.

/**
 * @fileoverview Defines a Date object that supports the
 * Library of Congress Extended Date Time Format (EDTF).
 * Supports Level 1 Uncertain/Approximate, Unspecified, and Season.
 * Intervals are not supported.
 *
 * This implementation is adapted from
 * https://github.com/ptgolden/edtf-js/blob/master/src/parse.js
 *
 * @author Robert Gardner (rgardner@google.com)
 */

'use strict';


/**
 * Constructs an EdtfDate from an EDTF-compatible string.
 * @param {string} s The string being parsed.
 * @return {!EdtfDate} The resulting date.
 */
function edtfDateFromString(s) {
  var edtfData = {};
  // Check for supported format. If not, try to parse with Date.
  if (!s.match(
      /^-?[1-9u][0-9u]{0,3}((-[0-9u]{2})?-[0-9u]{2})?([?~]){0,2}?(T|$)/)) {
    var d = new Date(s);
    if (!isNaN(d)) {
      edtfData.year = '' + d.getFullYear();
      edtfData.month = '' + (d.getMonth() + 1);
      edtfData.day = '' + d.getDate();
    }
    return new EdtfDate(edtfData);
  }
  var tokens = s.
    replace(/(?!^)-/g, ' ').    // replace non-leading '-' with ' '
    replace(/([?~])/g, ' $1').  // pad '?' and '~' with leading ' '
    split(' ');

  if (tokens.indexOf('?') >= 0) {
    edtfData.uncertain = Boolean(tokens.splice(tokens.indexOf('?'), 1)[0]);
  }
  if (tokens.indexOf('~') >= 0) {
    edtfData.approximate = Boolean(tokens.splice(tokens.indexOf('~'), 1)[0]);
  }

  edtfData.year = tokens.splice(0, 1)[0];
  edtfData.month = tokens.splice(0, 1)[0] || null;
  edtfData.day = tokens.splice(0, 1)[0] || null;

  return new EdtfDate(edtfData);
}



/**
 * @type {string} year The 4-digit year this date represents.
 * @type {string} month The 2-digit month this date represents.
 * @type {string} day The 2-digit day of month this date represents.
 * @type {boolean} uncertain If this date is not certain.
 * @type {boolean} approximate If this date is approximate.
 * @param {!EdtfDate.EdtfData} data The values for the date's fields.
 * @constructor
 */
var EdtfDate = function(data) {
  this.year = data.year ? '' + data.year : null;
  this.month = data.year ? zeroPadded_(data.month) : null;
  this.day = data.year ? zeroPadded_(data.day) : null;
  this.uncertain = Boolean(data.uncertain);
  this.approximate = Boolean(data.approximate);
};


/**
 * @typedef {{
 *   year: ?string,
 *   month: ?string,
 *   day: ?string,
 *   uncertain: boolean,
 *   approximate: boolean
 * }}
 */
EdtfDate.EdtfData;


/**
 * Returns a string representation of the date in EDTF syntax.
 * @return {string} The date as EDTF.
 */
EdtfDate.prototype.toEdtfString = function() {
  var s = this.year;
  if (this.month) {
    s += '-' + this.month;
  }
  if (this.day) {
    s += '-' + this.day;
  }
  if (this.uncertain) {
    s += '?';
  }
  if (this.approximate) {
    s += '~';
  }
  return s;
};


/**
 * Returns a string of the date localized for the current locale.
 * @return {string} The localized date.
 */
EdtfDate.prototype.toLocaleDateString = function() {
  if (!this.year) {
    return '';
  }
  if (!this.month && !this.day) {
    var s = this.getFullYear();
  } else {
    var s = this.toDate().toLocaleDateString();
  }
  if (this.uncertain) {
    s += ' (uncertain)';
  }
  if (this.approximate) {
    s = 'abt ' + s;
  }
  return s;
};


/**
 * Returns a string representation of the date.
 * @return {string} A string representation of the date.
 */
EdtfDate.prototype.toString = function() {
  return this.toLocaleDateString();
};


/**
 * Returns the year of the date.
 * @return {number} The year of the date.
 */
EdtfDate.prototype.getFullYear = function() {
  return parseInt(this.year, 10);
};


/**
 * Returns the date in native JS Date format.
 * If date is approximate, uncertain, or not fully
 * specified, does the best it can.
 * @return {Date} The date in native format.
 */
EdtfDate.prototype.toDate = function() {
  // js Date type can't represent these cases
  if (this.year == null || this.year < -271820 || this.year > 275759) {
    return null;
  }
  if (this.year.indexOf('u') >= 0) {
    return null;
  }

  // Force the date to Jan 1 midnight to avoid date rollover problems
  var date = new Date(this.year, 0, 1);

  switch (this.month) {
    // If month is not set or is 'uu', pretend it's January 1.
    case null:
    case 'uu':
      date.setMonth(0);
      date.setDate(1);
      break;

    // Assuming northern hemisphere for seasons.
    case 21:
      date.setMonth(2);
      date.setDate(22);
      break;
    case 22:
      date.setMonth(5);
      date.setDate(22);
      break;
    case 23:
      date.setMonth(8);
      date.setDate(22);
      break;
    case 24:
      date.setMonth(11);
      date.setDate(22);
      break;

    // Month is set; if day is not set or is 'uu', pretend it's the first.
    default:
      date.setMonth(parseInt(this.month, 10) - 1);
      if (this.day === null || this.day === 'uu') {
        date.setDate(1);
      } else {
        date.setDate(parseInt(this.day, 10));
      }
      break;
  }

  return date;
};


/**
 * Returns the number as a string, padded with leading zeroes
 * if necessary to bring the length to 2 digits.
 * @param {number} i The number to be stringified.
 * @return {string} The number as a string, at least 2 digits in length.
 * @private
 */
function zeroPadded_(i) {
  var j = i;
  while (('' + j).length < 2) {
    j = '0' + j;
  }
  return j;
}
