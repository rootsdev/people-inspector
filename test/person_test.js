/**
 * @fileoverview Tests for person.js.
 */


function testExtractPerson_HistoricalPerson() {
  var person = {
    'type': ['http://historical-data.org/HistoricalPerson'],
    'properties': {
      'name': ['Historical Person'],
      'birth': [{
        'type': ['http://schema.org/Event'],
        'properties': {
          'startDate': ['1925-07-27'],
          'location': [{
            'type': ['http://schema.org/Place'],
            'properties': {
              'address': [{
                'type': ['http://schema.org/PostalAddress'],
                'properties': {
                  'name': ['Southwold Bay, England']
                }
              }]
            }
          }]
        }
      }],
      'death': [{
        'type': ['http://schema.org/Event'],
        'properties': {
          'startDate': ['1960-09-12'],
          'location': [{
            'type': ['http://schema.org/Place'],
            'properties': {
              'address': [{
                'type': ['http://schema.org/PostalAddress'],
                'properties': {
                  'name': ['Northwold Bay, England']
                }
              }]
            }
          }]
        }
      }],
      'parents': [{
        'type': ['http://historical-data.org/HistoricalPerson'],
        'properties': {
          'name': ['Historical Parent']
        }
      }]
    }
  };
  var result = extractPerson(person);
  assertEquals('name', 'Historical Person', result.name);
  assertEquals('birthDate',
      edtfDateFromString('1925-07-27').toString(), result.birthDate.toString());
  assertEquals('birthPlace', 'Southwold Bay, England', result.birthPlace);
  assertEquals('deathDate',
      edtfDateFromString('1960-09-12').toString(), result.deathDate.toString());
  assertEquals('deathPlace', 'Northwold Bay, England', result.deathPlace);
  assertEquals('parent name', 'Historical Parent', result.parents[0].name);
}


function testExtractPerson_SchemaPerson() {
  var person = {
    'type': ['http://schema.org/Person'],
    'properties': {
      'name': ['First Middle Last'],
      'birthDate': ['1925-07-27'],
      'deathDate': ['1960-09-12'],
      'parent': [{
        'type': ['http://schema.org/Person'],
        'properties': {
          'name': ['Parent'],
          'deathDate': ['1930-06-21']
        }
      }]
    }
  };
  var result = extractPerson(person);
  assertEquals('name', 'First Middle Last', result.name);
  assertEquals('givenName', 'First Middle', result.givenName);
  assertEquals('familyName', 'Last', result.familyName);
  assertEquals('birthDate',
      edtfDateFromString('1925-07-27').toString(), result.birthDate.toString());
  assertEquals('birthPlace', '', result.birthPlace);
  assertEquals('deathDate',
      edtfDateFromString('1960-09-12').toString(), result.deathDate.toString());
  assertEquals('deathPlace', '', result.deathPlace);
  var parent = result.parents[0];
  assertEquals('parent name', 'Parent', parent.name);
  assertEquals('parent death',
      edtfDateFromString('1930-06-21').toString(), parent.deathDate.toString());
}


function testUpdateName_Name() {
  var person = new Person();
  var item = {};
  item.properties = {
    'name': ['First Middle Last']
  };
  updateName_(person, item);
  assertEquals('name', 'First Middle Last', person.name);
  assertEquals('givenName', 'First Middle', person.givenName);
  assertEquals('familyName', 'Last', person.familyName);
}


function testUpdateName_Name_Single() {
  var person = new Person();
  var item = {};
  item.properties = {
    'name': ['Last']
  };
  updateName_(person, item);
  assertEquals('name', 'Last', person.name);
  assertEquals('givenName', '', person.givenName);
  assertEquals('familyName', 'Last', person.familyName);
}


function testUpdateName_Name_InternalSpaces() {
  var person = new Person();
  var item = {};
  item.properties = {
    'name': ['First   \nLast']
  };
  updateName_(person, item);
  assertEquals('name', 'First Last', person.name);
  assertEquals('givenName', 'First', person.givenName);
  assertEquals('familyName', 'Last', person.familyName);
}


function testUpdateName_FamilyName() {
  var person = new Person();
  var item = {};
  item.properties = {
    'givenName': ['First Middle'],
    'familyName': ['Last']
  };
  updateName_(person, item);
  assertEquals('name', 'First Middle Last', person.name);
  assertEquals('givenName', 'First Middle', person.givenName);
  assertEquals('familyName', 'Last', person.familyName);

  // Try again with multiple given and family names
  person = new Person();
  item = {};
  item.properties = {
    'givenName': ['Second', 'Middle1', 'Middle2'],
    'familyName': ['Lastly', 'Last']
  };
  updateName_(person, item);
  assertEquals('name', 'Second Middle1 Middle2 Lastly Last', person.name);
  assertEquals('givenName', 'Second Middle1 Middle2', person.givenName);
  assertEquals('familyName', 'Lastly Last', person.familyName);
}


function testUpdateName_FamilyName_Single() {
  var person = new Person();
  var item = {};
  item.properties = {
    'familyName': ['Last']
  };
  updateName_(person, item);
  assertEquals('name', 'Last', person.name);
  assertEquals('givenName', '', person.givenName);
  assertEquals('familyName', 'Last', person.familyName);

  person = new Person();
  item = {};
  item.properties = {
    'givenName': ['First']
  };
  updateName_(person, item);
  assertEquals('name', 'First', person.name);
  assertEquals('givenName', 'First', person.givenName);
  assertEquals('familyName', '', person.familyName);
}


function testUpdateName_FamilyName_InternalSpaces() {
  var person = new Person();
  var item = {};
  item.properties = {
    'givenName': ['First    \t     Middle1     Middle2'],
    'familyName': ['Last']
  };
  updateName_(person, item);
  assertEquals('name', 'First Middle1 Middle2 Last', person.name);
  assertEquals('givenName', 'First Middle1 Middle2', person.givenName);
  assertEquals('familyName', 'Last', person.familyName);
}


function testExtractLocation_Place() {
  var place = {
    'type': ['http://schema.org/Place'],
    'properties': {
      'address': [{
        'type': ['http://schema.org/PostalAddress'],
        'properties': {
          'name': ['Southwold Bay, England'],
          'addressLocality': ['locality'],
          'addressRegion': ['region'],
          'addressCountry': ['country']
        }
      }]
    }
  };
  var result = extractLocation(place);
  var expectedResult = 'Southwold Bay, England, locality, region, country';
  assertEquals(expectedResult, result);
}


function testExtractLocation_PostalAddress() {
  var addr = {
    'type': ['http://schema.org/PostalAddress'],
    'properties': {
      'name': ['Southwold Bay, England'],
      'addressLocality': ['locality'],
      'addressRegion': ['region'],
      'addressCountry': ['country']
    }
  };
  var result = extractLocation(addr);
  var expectedResult = 'Southwold Bay, England, locality, region, country';
  assertEquals(expectedResult, result);
}
