// Copyright 2013 Google Inc. All Rights Reserved.

/**
 * @fileoverview Defines a Person object for manipulation by the extension.
 *
 * @author Robert Gardner (rgardner@google.com)
 */

'use strict';



// These constants define the Item Types the Person class extracts.

/**
 * The Schema.org Item Type for a person.
 * @type {string}
 */
var SCHEMA_PERSON = 'http://schema.org/Person';

/**
 * The Schema.org Item Type for the (obsolete) historical-data person.
 * @type {string}
 */
var HISTORICAL_DATA_PERSON = 'http://historical-data.org/HistoricalPerson';

/**
 * A common (but incorrect) variant of the Schema.org Item Type for the
 * (obsolete) historical-data person.
 * @type {string}
 */
var HISTORICAL_DATA_PERSON_VARIANT =
    'http://historical-data.org/HistoricalPerson.html';

/**
 * The Schema.org Item Type for a place.
 * @type {string}
 */
var SCHEMA_PLACE = 'http://schema.org/Place';

/**
 * The Schema.org Item Type for a postal address.
 * @type {string}
 */
var SCHEMA_POSTAL_ADDRESS = 'http://schema.org/PostalAddress';


/** @constructor */
var Person = function() {
  /**
   * The person's name: given name followed by family name.
   * @type {string}
   */
  this.name = '';

  /**
   * The person's given name.
   * @type {string}
   */
  this.givenName = '';

  /**
   * The person's family name.
   * @type {string}
   */
  this.familyName = '';

  /**
   * The person's birth date.
   * @type {EdtfDate}
   */
  this.birthDate = null;

  /**
   * The person's birth place.
   * @type {string}
   */
  this.birthPlace = '';

  /**
   * The person's death date.
   * @type {EdtfDate}
   */
  this.deathDate = null;

  /**
   * The person's death place.
   * @type {string}
   */
  this.deathPlace = '';

  /**
   * The person's parents.
   * @type {!Array.<!Person>}
   */
  this.parents = [];

  /**
   * The person's spouses.
   * @type {!Array.<!Person>}
   */
  this.spouses = [];

  /**
   * The person's children.
   * @type {!Array.<!Person>}
   */
  this.children = [];
};


/**
 * Extracts a person from a Json item. If the item is a schema.org person,
 * a Person is returned. Otherwise, returns null.
 * @param {!Object} item The microdata item containing the person.
 * @return {Person} The Person or null.
 */
function extractPerson(item) {
  switch (item.type[0]) {
    case SCHEMA_PERSON:
    case HISTORICAL_DATA_PERSON:
    case HISTORICAL_DATA_PERSON_VARIANT:
      var person = new Person();
      updateName_(person, item);
      updateBirthInfo_(person, item);
      updateDeathInfo_(person, item);

      var parents = item.properties.parent || item.properties.parents;
      if (parents) {
        for (var i = 0, parent; parent = parents[i]; i++) {
          person.parents.push(extractPerson(parent));
        }
      }
      var spouses = item.properties.spouse || item.properties.spouses;
      if (spouses) {
        for (var i = 0, spouse; spouse = spouses[i]; i++) {
          person.spouses.push(extractPerson(spouse));
        }
      }
      var children = item.properties.children;
      if (children) {
        for (var i = 0, child; child = children[i]; i++) {
          person.children.push(extractPerson(child));
        }
      }
      return person;
  }
  return null;
}


/**
 * Updates a Person by setting the name fields.
 * @param {!Person} person The Person to update.
 * @param {!Object} item The microdata item containing the person.
 * @private
 */
function updateName_(person, item) {
  var props = item.properties;
  if (props.givenName && props.givenName[0] ||
      props.familyName && props.familyName[0]) {
    var names = [];
    if (props.givenName) {
      for (var i = 0, name; name = props.givenName[i]; i++) {
        names.push(trim(props.givenName[i]));
      }
      person.givenName = names.join(' ');
    }
    if (props.familyName) {
      var fnames = [];
      for (var i = 0, name; name = props.familyName[i]; i++) {
        var n = trim(props.familyName[i]);
        fnames.push(n);
        names.push(n);
      }
      person.familyName = fnames.join(' ');
    }
    person.name = names.join(' ');
  } else if (props.name && props.name[0]) {
    person.name = trim(props.name[0]);
    var names = person.name.split(/\s+/);
    person.familyName = names.splice(-1, 1)[0];
    person.givenName = names.join(' ');
  }
}


/**
 * Updates a Person by adding birth information from a schema.org/Person.
 * @param {!Person} person The Person to update.
 * @param {!Object} item The microdata item containing the person.
 * @private
 */
function updateBirthInfo_(person, item) {
  var birthProps = item.properties.birth &&
      item.properties.birth[0] && item.properties.birth[0].properties;
  if (birthProps) {
    if (birthProps.startDate && birthProps.startDate[0]) {
      try {
        person.birthDate = edtfDateFromString(birthProps.startDate[0]);
      } catch (err) {}
    }
    if (birthProps.location && birthProps.location[0]) {
      person.birthPlace = extractLocation(birthProps.location[0]);
    }
  } else if (item.properties.birthDate && item.properties.birthDate[0]) {
    person.birthDate = edtfDateFromString(item.properties.birthDate[0]);
  }
}


/**
 * Updates a Person by adding death information from a schema.org/Person.
 * @param {!Person} person The Person to update.
 * @param {!Object} item The microdata item containing the person.
 * @private
 */
function updateDeathInfo_(person, item) {
  var deathProps = item.properties.death &&
      item.properties.death[0] && item.properties.death[0].properties;
  if (deathProps) {
    if (deathProps.startDate && deathProps.startDate[0]) {
      try {
        person.deathDate = edtfDateFromString(deathProps.startDate[0]);
      } catch (err) {}
    }
    if (deathProps.location && deathProps.location[0]) {
      person.deathPlace = extractLocation(deathProps.location[0]);
    }
  } else if (item.properties.deathDate && item.properties.deathDate[0]) {
    person.deathDate = edtfDateFromString(item.properties.deathDate[0]);
  }
}


/**
 * Extracts a person's location. The location can be a Place or a PostalAddress.
 * @param {!Object} location The Schema.org Location that is to be parsed.
 * @return {string} The resulting location as text or ''.
 */
function extractLocation(location) {
  var text = [];
  if (location.type && location.type[0] && location.properties) {
    switch (location.type[0]) {
      case SCHEMA_PLACE:
        if (location.properties.address && location.properties.address[0]) {
          var properties = location.properties.address[0].properties;
        } else {
          var properties = location.properties;
        }
        if (location.properties.name && location.properties.name[0]) {
          text.push(trim(location.properties.name[0]));
        }
        break;
      case SCHEMA_POSTAL_ADDRESS:
        var properties = location.properties;
        break;
    }
    if (properties) {
      if (properties.name && properties.name[0]) {
        text.push(trim(properties.name[0]));
      }
      if (properties.addressLocality && properties.addressLocality[0]) {
        text.push(trim(properties.addressLocality[0]));
      }
      if (properties.addressRegion && properties.addressRegion[0]) {
        text.push(trim(properties.addressRegion[0]));
      }
      if (properties.addressCountry && properties.addressCountry[0]) {
        text.push(trim(properties.addressCountry[0]));
      }
    }
  }
  return text.join(', ');
}


/**
 * Trims leading, trailing, and multiple internal spaces.
 * @param {string} s The string to trim.
 * @return {string} The trimmed string.
 */
function trim(s) {
  return s.trim().replace(/\s\s+/g, ' ');
}
