// Copyright 2013 Google Inc. All Rights Reserved.

/**
 * @fileoverview JavaScript for People Inspector background page.
 * Note: This file is a Chrome Extension and runs in its own sandbox.
 * Therefore it does not need to be in a separate namespace.
 *
 * @author Robert Gardner (rgardner@google.com)
 */

'use strict';

var pagesData = pagesData || {};


/**
 * Handles an onRequest message by storing data in local state.
 * @param {Object} request The request message with:
 *     hasHistoricalData {boolean}, true if the page has HistoricalData markup
 *     items {Object}, the HistoricalData microdata items on the page
 *     debug {string}, any debug data to display in the popup
 *     These are passed to the popup.
 * @param {Object} sender The sender (ignored).
 * @param {function(Object)} sendResponse Called to receive the response,
 *     which will be empty.
 */
function onRequest(request, sender, sendResponse) {
  if (request.hasHistoricalData) {
    var tabId = sender.tab.id;
    pagesData[tabId] = {
      debug: request.debug,
      hasHistoricalData: request.hasHistoricalData,
      items: request.items
    };
    chrome.pageAction.show(tabId);
  }

  // Return nothing to let the connection be cleaned up.
  sendResponse({});
}

// Listen for the content script to send a message to the background page.
chrome.extension.onRequest.addListener(onRequest);
