// Copyright 2013 Google Inc. All Rights Reserved.

/**
 * @fileoverview JavaScript for People Insepctor popup.
 * Note: This file is a Chrome Extension and runs in its own sandbox.
 * Therefore it does not need to be in a separate namespace.
 *
 * The technique in this implementation is taken from the Chrome Extensions
 * tutorial for building popup windows in an extension. The tutorial is at:
 * http://developer.chrome.com/extensions/samples.html in the tutorial named
 * "Page action by content".
 *
 * This extension puts an icon in the Chrome address bar. When the user clicks
 * it Chrome creates a window (defined in popup.html). The popup.html file
 * includes popup.js in its script tags, so this file is loaded and executed.
 *
 * @author Robert Gardner (rgardner@google.com)
 */

'use strict';

/**
 * Text that can be used to separate links that will be opened in
 * separate tabs. Needs to be a unique string that won't be URL encoded.
 * @type {string}
 */
var LINK_SEPARATOR = '+++++';

/**
 * The element class for a Tab link that opens a URL in a new Chrome tab.
 * @type {string}
 */
var TAB_LINK_CLASS = 'el-class';

/**
 * The element class for a Clipboard link that copies text to clipboard.
 * @type {string}
 */
var CLIP_LINK_CLASS = 'clip-class';


// Get the selected tab from Chrome and display the tab's data in the popup.
// This call is asynchronous. The work of displaying the window is done in the
// callback function.
chrome.tabs.query(
    {windowId: chrome.windows.WINDOW_ID_CURRENT, active: true}, displayPopup);


/**
 * Displays the popup window with the data held in the background page for
 * the current tab. The data is extracted in a contentscript.js which Chrome
 * injects at the bottom of each page it loads. That script scans the page for
 * the data to display (specifically, historical-data.org microdata markup).
 * If it finds it, it extracts it and holds onto it for use by this script.
 * Unfortunately, due to Chrome's sandboxing, there is no way to access the data
 * directly. Instead, it is retrieved from the extension's background page,
 * by calling chrome.extension.getBackgroundPage(). That page contains the data
 * in pageData, which is indexed by tab ID.
 * @param {!Array.<!chrome.tabs.Tab>} tabs The tabs from chrome.tabs.query.
 */
function displayPopup(tabs) {
  formatResults(tabs[0]);
}


/**
 * Formats the results for the current tab, placing them in the appropriate
 * elements in the popup.html page, such as the '#results' div element.
 * @param {!chrome.tabs.Tab} tab The tab that contains the results.
 */
function formatResults(tab) {
  // Retrieve the Historical-data.org Extension background page.
  var backgroundPage = chrome.extension.getBackgroundPage();
  // Retrieve the background page data object.
  var pageData = backgroundPage.pagesData[tab.id];
  var items = pageData.items;

  var html = '<table>' +
      '<thead><tr>' +
        '<th>Name</th><th>Birth</th><th>Death</th><th>Copy</th>' +
        '<th colspan="5">Search</th>' +
      '</tr></thead>' +
      '<tbody>';
  for (var i = 0, item; item = items[i]; i++) {
    html += formatItem(item);
  }
  html += '</tbody></table>';

  // Note that when jQuery-microdata parsed the HTML to begin with
  // all HTML tags were stripped so this is safe.
  var resultsEl = document.querySelector('#results');
  resultsEl.innerHTML = html;
  decorateTabLinks(resultsEl);
  decorateClipboardLinks(resultsEl);

  var share = buildLink(TAB_LINK_CLASS,
      buildGooglePlusUrl(tab.url),
      '<img src="https://www.gstatic.com/images/icons/gplus-16.png"/>');
  var shareEl = document.querySelector('#share');
  shareEl.innerHTML = share;
  decorateTabLinks(shareEl, true);

  // Add debug info
  var debugEl = document.querySelector('#debug');
  debugEl.style.display = 'none';
  debugEl.innerHTML = '<pre>' + pageData.debug + '</pre>';
  var showDebugEl = document.querySelector('#showDebug');
  showDebugEl.addEventListener('click', function(e) {
    debugEl.style.display = debugEl.style.display == 'block' ?
        'none' : 'block';
  });
}


/**
 * Formats a single item to HTML. Recursively extracts all items
 * referenced by this item and includes them in the formatted result.
 * @param {!Object} item The microdata item that is to be formatted.
 * @return {string} The resulting HTML.
 */
function formatItem(item) {
  var html = '';
  if (item.type && item.type[0]) {
    var person = extractPerson(item);
    if (person) {
      html += formatPerson(person);
    } else {
      // Try all the subitems
      for (var i = 0, property; property = item.properties[i]; i++) {
        for (var j = 0, itemP; itemP = property[j]; j++) {
          if (itemP.type) {
            html += formatItem(itemP);
          }
        }
      }
    }
  }
  return html;
}


/**
 * Formats a Schema.org Person to HTML as a single table row.
 * @param {!Person} person The person that is to be formatted.
 * @return {string} The resulting HTML.
 */
function formatPerson(person) {
  var html = '<tr>';
  html += '<td>' + (person.name || 'Unknown') + '</td>';
  html += '<td>';
  if (person.birthDate) {
    html += '<div>' + person.birthDate.toLocaleDateString() + '</div>';
  }
  if (person.birthPlace) {
    html += '<div>' + person.birthPlace + '</div>';
  }
  html += '</td>';

  html += '<td>';
  if (person.deathDate) {
    html += '<div>' + person.deathDate.toLocaleDateString() + '</div>';
  }
  if (person.deathPlace) {
    html += '<div>' + person.deathPlace + '</div>';
  }
  html += '</td>';

  html += buildLinkButtons(person);

  if (person.parents) {
    for (var i = 0, parent; parent = person.parents[i]; i++) {
      html += formatPerson(parent);
    }
  }
  if (person.spouses) {
    for (var i = 0, spouse; spouse = person.spouses[i]; i++) {
      html += formatPerson(spouse);
    }
  }
  if (person.children) {
    for (var i = 0, child; child = person.children[i]; i++) {
      html += formatPerson(child);
    }
  }
  return html;
}


/**
 * Builds the link buttons for a person, placing them into
 * the proper columns in a table. That is, the resulting
 * HTML will include surrounding cell tags.
 * @param {Person} person The person for whom to create links.
 * @return {string} The buttons as HTML.
 */
function buildLinkButtons(person) {
  var html = '';
  // Copy
  html += '<td>';
  html += buildLink(CLIP_LINK_CLASS,
      '#',
      '<img src="images/copy.png"/><span style="display:none">' +
      buildPersonClipboard(person) + '</span>');
  html += '</td>';

  // Family Search search
  html += '<td>';
  html += buildLink(TAB_LINK_CLASS,
      buildFamilySearchUrl(person),
      '<img src="images/familysearch.png"/>');
  html += '</td>';

  // We Relate search
  html += '<td>';
  html += buildLink(TAB_LINK_CLASS,
      buildWeRelateUrl(person),
      '<img width="15" src="images/werelate.png"/>');
  html += '</td>';

  // MyHeritage search
  html += '<td>';
  html += buildLink(TAB_LINK_CLASS,
      buildMyHeritageUrl(person),
      '<img src="images/myheritage.ico"/>');
  html += '</td>';

  // Geni search
  html += '<td>';
  html += buildLink(TAB_LINK_CLASS,
      buildGeniSearchUrl(person),
      '<img src="images/geni.png"/>');
  html += '</td>';

  // Google search
  html += '<td>';
  html += buildLink(TAB_LINK_CLASS,
      buildGoogleSearchUrl(person),
      '<img src="images/google.png"/></a>');
  html += '</td>';
  return html;
}


/**
 * Builds a Link in HTML.
 * @param {string} element_class The class the link should have.
 * @param {string} url The URL the link points to.
 * @param {string} content The content of the link, HTML is OK.
 * @return {string} The link in HTML.
 */
function buildLink(element_class, url, content) {
  var html = '<a ';
  if (element_class) {
    html += 'class="' + element_class + '" ';
  }
  html += 'href="' + url + '">';

  if (content) {
    html += content;
  }
  html += '</a>';
  return html;
}


/**
 * Builds a query URL to send to Family Search for a person.
 * @param {!Person} person The person being queried.
 * @return {string} The resulting query URL.
 */
function buildFamilySearchUrl(person) {
  var query = '';
  var nameParts = person.name.split(' ');
  if (nameParts && nameParts[0]) {
    query += '+givenname:"' + nameParts[0] + '"~ ';
  }
  if (nameParts && nameParts[nameParts.length - 1]) {
    query += '+surname:"' + nameParts[nameParts.length - 1] + '"~ ';
  }
  if (person.birthPlace) {
    query += '+birth_place:"' + person.birthPlace + '"~ ';
  }
  if (person.birthDate) {
    query += '+birth_year:' + person.birthDate.getFullYear() + '~ ';
  }
  if (person.deathPlace) {
    query += '+death_place:"' + person.deathPlace + '"~ ';
  }
  if (person.deathDate) {
    query += '+death_year:' + person.deathDate.getFullYear() + '~ ';
  }
  var url = 'https://www.familysearch.org/search/records/index' +
    '#count=50&query=' + encodeURIComponent(query);
  return url;
}


/**
 * Builds a query URL to send to WeRelate.org for a person.
 * @param {!Person} person The person being queried.
 * @return {string} The resulting query URL.
 */
function buildWeRelateUrl(person) {
  var query = '';
  var keywords = [];
  var nameParts = person.name.split(' ');
  if (nameParts && nameParts[0]) {
    var givenName = encodeURIComponent(nameParts[0]);
    query += '&g=' + givenName;
    keywords.push(givenName);
  }
  if (nameParts && nameParts[nameParts.length - 1]) {
    var surname = encodeURIComponent(nameParts[nameParts.length - 1]);
    query += '&s=' + surname;
    keywords.push(surname);
  }
  if (person.birthDate) {
    query += '&bd=' + encodeURIComponent(person.birthDate.getFullYear()) +
        '&br=0';
  }
  if (person.birthPlace) {
    query += '&bp=' + encodeURIComponent(person.birthPlace);
  }
  if (person.deathDate) {
    query += '&dd=' + encodeURIComponent(person.deathDate.getFullYear()) +
        '&dr=0';
  }
  if (person.deathPlace) {
    query += '&dp=' + encodeURIComponent(person.deathPlace);
  }
  var search = 'http://www.werelate.org/wiki/Special:Search?ns=Person' + query;
  search += '&k=' + encodeURIComponent(keywords.join(' ')) + '&rows=20&ecp=p';
  return search;
}


/**
 * Builds a query URL to send to MyHeritage to search for a person.
 * @param {!Person} person The person being queried.
 * @return {string} The resulting query URL.
 */
function buildMyHeritageUrl(person) {
  var url = 'http://www.myheritage.com/FP/API/Search/get-search-results.php' +
      '?partner=google';

  var name = person.name.split(' ');
  if (name && name[0]) {
    url += '&first=' + encodeURIComponent(name[0]);
  }
  if (name && name[name.length - 1]) {
    url += '&last=' + encodeURIComponent(name[name.length - 1]);
  }
  if (person.birthDate) {
    url += '&birth_year=' + encodeURIComponent(person.birthDate.getFullYear());
  }
  if (person.deathDate) {
    url += '&death_year=' + encodeURIComponent(person.deathDate.getFullYear());
  }
  return url;
}


/**
 * Builds a query URL to send to Geni to search for a person.
 * @param {!Person} person The person being queried.
 * @return {string} The resulting query URL.
 */
function buildGeniSearchUrl(person) {
  return 'http://www.geni.com/search?search_type=people&names=' +
      encodeURI(person.name);
}


/**
 * Builds the entire URL for a Google search for a person.
 * @param {Person} person The person being searched for.
 * @return {string} The resulting query URL.
 */
function buildGoogleSearchUrl(person) {
  var url = buildPeopleSearchUrl(person) +
      LINK_SEPARATOR +
      buildImageSearchUrl(person) +
      LINK_SEPARATOR +
      buildBookSearchUrl(person) +
      LINK_SEPARATOR +
      buildNewsSearchUrl(person);
  if (person.deathPlace || person.birthPlace) {
    url += LINK_SEPARATOR + buildMapsUrl(person);
  }
  return url;
}


/**
 * Builds a query URL to send to Google Search for a person.
 * @param {!Person} person The person being queried.
 * @return {string} The resulting query URL.
 */
function buildPeopleSearchUrl(person) {
  return 'https://www.google.com/search?' +
      'tbs=ppl:1&amp;e=ForceExperiment&amp;expid=52793&amp;q=' +
      buildGoogleQuery(person) + '+~genealogy';
}


/**
 * Builds a query URL to send to Google Image Search for a person.
 * @param {!Person} person The person being queried.
 * @return {string} The resulting query URL.
 */
function buildImageSearchUrl(person) {
  return 'https://www.google.com/search?tbm=isch&amp;q=' +
      buildGoogleQuery(person) + '+~genealogy';
}


/**
 * Builds a query URL to send to Google Book Search for a person.
 * @param {!Person} person The person being queried.
 * @return {string} The resulting query URL.
 */
function buildBookSearchUrl(person) {
  return 'https://www.google.com/search?tbm=bks&amp;q=' +
      buildGoogleQuery(person);
}


/**
 * Builds a query URL to send to Google News Search for a person.
 * @param {!Person} person The person being queried.
 * @return {string} The resulting query URL.
 */
function buildNewsSearchUrl(person) {
  return 'https://www.google.com/search?tbm=nws&amp;tbs=ar:1&amp;q=' +
      buildGoogleQuery(person, true);
}


/**
 * Builds a query URL to send to Google Maps for a place. If two places
 * exist, it will show directions between the two places. Otherwise,
 * it will just bring up a map of the one place.
 * @param {!Person} person Contains place(s) being queried.
 * @return {string} The resulting query URL.
 */
function buildMapsUrl(person) {
  var url = 'https://maps.google.com/maps';
  if (person.deathPlace && person.birthPlace) {
    url += '?saddr=' + encodeURIComponent(person.birthPlace);
    url += '&amp;daddr=' + encodeURIComponent(person.deathPlace);
  } else if (person.deathPlace) {
    url += '?q=' + encodeURIComponent(person.deathPlace);
  } else if (person.birthPlace) {
    url += '?q=' + encodeURIComponent(person.birthPlace);
  }
  return url;
}


/**
 * Builds the query string for a Google query.
 * @param {!Person} person The person being queried.
 * @param {boolean=} opt_excludeDate Whether to exclude dates in the query.
 * @return {string} The resulting query string.
 */
function buildGoogleQuery(person, opt_excludeDate) {
  var opt_excludeDate = opt_excludeDate || false;
  var q = encodeURIComponent(person.name);
  if (!opt_excludeDate && (person.birthDate || person.deathDate)) {
    q += '+';
    if (person.birthDate) {
      q += person.birthDate.getFullYear();
    }
    if (person.birthDate && person.deathDate) {
      q += '..';
    }
    if (person.deathDate) {
      q += person.deathDate.getFullYear();
    }
  }
  return q;
}


/**
 * Builds a query URL to share this page on Google+.
 * @param {string} page The URL of the current page.
 * @return {string} The resulting query URL.
 */
function buildGooglePlusUrl(page) {
  return 'https://plus.google.com/share?url=' + encodeURIComponent(page);
}


/**
 * Builds a string representing a person to copy to the clipboard.
 * @param {!Person} person The person being queried.
 * @return {string} The resulting clipboard HTML.
 */
function buildPersonClipboard(person) {
  var html = person.name;
  if (person.birthDate) {
    html += '<br><b>Birth</b>: ' + person.birthDate.toLocaleDateString();
  }
  if (person.birthPlace) {
    html += '<br><b>Birth Place</b>: ' + person.birthPlace;
  }
  if (person.deathDate) {
    html += '<br><b>Death</b>: ' + person.deathDate.toLocaleDateString();
  }
  if (person.deathPlace) {
    html += '<br><b>Death Place</b>: ' + person.deathPlace;
  }
  return html;
}


/**
 * Decorates the tab-class links in an element by adding a click listener that
 * opens the link in a new Chrome tab. If the link's href contains multiple
 * links (separated by LINK_SEPARATOR) then each will be opened into a
 * separate tab.
 * @param {!Element} el The element to be decorated.
 * @param {boolean=} opt_selected Indicates if created tab should be selected.
 */
function decorateTabLinks(el, opt_selected) {
  var opt_selected = opt_selected || false;
  var anchors = el.querySelectorAll('a.' + TAB_LINK_CLASS);
  for (var i = 0, a; a = anchors[i]; i++) {
    a.addEventListener('click', function(e) {
      e.preventDefault();
      var links = this.href.split(LINK_SEPARATOR);
      for (var j = 0, link; link = links[j]; j++) {
        chrome.tabs.create({selected: opt_selected, url: link});
      }
      if (opt_selected) {
        close();
      }
    });
  }
}


/**
 * Decorates the clipboard-class links in an element by adding a click listener
 * that copies the link's content to the clipboard. Note that the content must
 * be inside a 'span' element inside link. Usually this 'span' will be hidden.
 * @param {!Element} el The element to be decorated.
 * @param {boolean=} opt_selected Indicates if created tab should be selected.
 */
function decorateClipboardLinks(el, opt_selected) {
  var opt_selected = opt_selected || false;
  var anchors = el.querySelectorAll('a.' + CLIP_LINK_CLASS);
  for (var i = 0, a; a = anchors[i]; i++) {
    a.addEventListener('click', function(e) {
      e.preventDefault();
      var text = this.querySelector('span').innerHTML;
      copyToClipboard(text);
      if (opt_selected) {
        close();
      }
    });
  }
}


/**
 * Copies text to the clipboard.
 * @param {string} text The text to copy. HTML is allowed.
 */
function copyToClipboard(text) {
  var copyDiv = document.createElement('div');
  copyDiv.contentEditable = true;
  document.body.appendChild(copyDiv);
  copyDiv.innerHTML = text;
  copyDiv.unselectable = 'off';
  copyDiv.focus();
  document.execCommand('SelectAll');
  document.execCommand('Copy', false, null);
  document.body.removeChild(copyDiv);
}
