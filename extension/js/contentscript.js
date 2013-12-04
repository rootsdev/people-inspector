// Copyright 2013 Google Inc. All Rights Reserved.

/**
 * @fileoverview JavaScript for People Inspector content script.
 * Note: This file is a Chrome Extension and runs in its own sandbox.
 * Therefore it does not need to be in a separate namespace.
 *
 * @author Robert Gardner (rgardner@google.com)
 */

'use strict';

// Check to see whether the page contains historical-data.org microdata.
var hasHistoricalData = Boolean(document.querySelector(
    '[itemscope][itemtype^="http://historical-data.org/"],' +
    '[itemscope][itemtype="http://schema.org/Person"]'));

// Sends a single request to other listeners within the extension.
if (hasHistoricalData) {
  var items = $(document).items();
  var itemsJson = $.microdata.json(items, function(o) { return o; }).items;
}
chrome.extension.sendRequest({
  debug: $.microdata.json(items, function(o) {
    return JSON.stringify(o, undefined, 2);
  }),
  hasHistoricalData: hasHistoricalData,
  items: itemsJson
}, function(response) {});
