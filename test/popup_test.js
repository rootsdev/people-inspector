/**
 * @fileoverview Tests for popup.js.
 */

var NAME_FORMATTED = 'Some%20Person';
var DATE_FORMATTED = '1914..1990';


function testBuildFamilySearchUrl() {
  var person = getTestPerson();

  var expected = 'https://www.familysearch.org/search/records/index' +
      '#count=50&query=' +
      '%2Bgivenname%3A%22Some%22~%20%2Bsurname%3A%22Person%22~%20' +
      '%2Bbirth_place%3A%22Abernathy%2C%20Main%22~%20%2Bbirth_year%3A1914~%20' +
      '%2Bdeath_place%3A%22Main%2C%20Abernathy%22~%20%2Bdeath_year%3A1990~%20';
  assertEquals(expected, buildFamilySearchUrl(person));
}


function testBuildWeRelateUrl() {
  var person = getTestPerson();

  var expected = 'http://www.werelate.org/wiki/Special:Search?ns=Person' +
      '&g=Some&s=Person' +
      '&bd=1914&br=0&bp=Abernathy%2C%20Main' +
      '&dd=1990&dr=0&dp=Main%2C%20Abernathy' +
      '&k=Some%20Person&rows=20&ecp=p';
  assertEquals(expected, buildWeRelateUrl(person));
}


function testBuildMyHeritageUrl() {
  var person = getTestPerson();

  var expected = 'http://www.myheritage.com/FP/API/Search/' +
      'get-search-results.php?partner=google' +
      '&first=Some&last=Person&birth_year=1914&death_year=1990';
  assertEquals(expected, buildMyHeritageUrl(person));
}


function testBuildMyHeritageUrl_NoDates() {
  var person = getTestPerson();
  person.birthDate = null;
  person.deathDate = null;

  var expected = 'http://www.myheritage.com/FP/API/Search/' +
      'get-search-results.php?partner=google' +
      '&first=Some&last=Person';
  assertEquals(expected, buildMyHeritageUrl(person));
}


function testBuildGeniSearchUrl() {
  var person = getTestPerson();

  var expected = 'http://www.geni.com/search?search_type=people&names=' +
      NAME_FORMATTED;
  assertEquals(expected, buildGeniSearchUrl(person));
}


function testBuildPeopleSearchUrl() {
  var person = getTestPerson();

  var expected = 'https://www.google.com/search' +
      '?tbs=ppl:1&amp;e=ForceExperiment&amp;expid=52793&amp;q=' +
      NAME_FORMATTED + '+' +
      DATE_FORMATTED + '+~genealogy';
  assertEquals(expected, buildPeopleSearchUrl(person));
}


function testBuildImageSearchUrl() {
  var person = getTestPerson();

  var expected = 'https://www.google.com/search' +
      '?tbm=isch&amp;q=' +
      NAME_FORMATTED + '+' +
      DATE_FORMATTED + '+~genealogy';
  assertEquals(expected, buildImageSearchUrl(person));
}


function testBuildBookSearchUrl() {
  var person = getTestPerson();

  var expected = 'https://www.google.com/search' +
      '?tbm=bks&amp;q=' +
      NAME_FORMATTED + '+' +
      DATE_FORMATTED;
  assertEquals(expected, buildBookSearchUrl(person));
}


function testBuildNewsSearchUrl() {
  var person = getTestPerson();

  var expected = 'https://www.google.com/search' +
      '?tbm=nws&amp;tbs=ar:1&amp;q=' +
      NAME_FORMATTED;
  assertEquals(expected, buildNewsSearchUrl(person));
}


function testBuildMapsUrl_both() {
  var person = getTestPerson();

  var expected = 'https://maps.google.com/maps' +
      '?saddr=Abernathy%2C%20Main' +
      '&amp;daddr=Main%2C%20Abernathy';
  assertEquals(expected, buildMapsUrl(person));
}


function testBuildMapsUrl_birth() {
  var person = getTestPerson();
  person.deathPlace = null;

  var expected = 'https://maps.google.com/maps' +
      '?q=Abernathy%2C%20Main';
  assertEquals(expected, buildMapsUrl(person));
}


function testBuildMapsUrl_death() {
  var person = getTestPerson();
  person.birthPlace = null;

  var expected = 'https://maps.google.com/maps' +
      '?q=Main%2C%20Abernathy';
  assertEquals(expected, buildMapsUrl(person));
}


function testBuildGooglePlusUrl() {
  var url = 'http://mypage.com';

  var expected = 'https://plus.google.com/share' +
      '?url=' +
      'http%3A%2F%2Fmypage.com';
  assertEquals(expected, buildGooglePlusUrl(url));
}


function testBuildGoogleQuery() {
  var person = getTestPerson();
  var expected = NAME_FORMATTED + '+' + DATE_FORMATTED;
  assertEquals(expected, buildGoogleQuery(person));
}


function testBuildGoogleQuery_excludeData() {
  var person = getTestPerson();
  var expected = NAME_FORMATTED;
  assertEquals(expected, buildGoogleQuery(person, true));
}


function getTestPerson() {
  var person = new Person();
  person.name = 'Some Person';
  person.birthDate = new Date('1914-05-18');
  person.birthPlace = 'Abernathy, Main';
  person.deathDate = new Date('1990-01-05');
  person.deathPlace = 'Main, Abernathy';
  return person;
}
