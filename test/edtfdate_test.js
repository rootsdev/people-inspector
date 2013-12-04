/**
 * @fileoverview Tests for edtfdate.js.
 */


function testEdtfDateFromString() {
  // Full legal date
  var result = edtfDateFromString('1848-11-13');
  assertEquals('1848', result.year);
  assertEquals('11', result.month);
  assertEquals('13', result.day);
  assertFalse(result.uncertain);
  assertFalse(result.approximate);

  // Just a year
  var result = edtfDateFromString('2001');
  assertEquals('2001', result.year);
  assertNull(result.month);
  assertNull(result.day);
  assertFalse(result.uncertain);
  assertFalse(result.approximate);

  // Date not in ISO8601 format
  var result = edtfDateFromString('Feb. 23, 2010');
  assertEquals('2010', result.year);
  assertEquals('02', result.month);
  assertEquals('23', result.day);
  assertFalse(result.uncertain);
  assertFalse(result.approximate);

  // Illegal date
  var result = edtfDateFromString('Not a date');
  assertEquals(null, result.year);
  assertEquals(null, result.month);
  assertEquals(null, result.day);
  assertFalse(result.uncertain);
  assertFalse(result.approximate);
}


function testEdtfDateFromString_Uncertain() {
  var result = edtfDateFromString('2001-05-23?');
  assertEquals('2001', result.year);
  assertEquals('05', result.month);
  assertEquals('23', result.day);
  assertTrue(result.uncertain);
  assertFalse(result.approximate);

  var result = edtfDateFromString('2001?');
  assertEquals('2001', result.year);
  assertNull(result.month);
  assertNull(result.day);
  assertTrue(result.uncertain);
  assertFalse(result.approximate);
}


function testEdtfDateFromString_Approx() {
  var result = edtfDateFromString('2001-05-23~');
  assertEquals('2001', result.year);
  assertEquals('05', result.month);
  assertEquals('23', result.day);
  assertFalse(result.uncertain);
  assertTrue(result.approximate);

  var result = edtfDateFromString('2001~');
  assertEquals('2001', result.year);
  assertNull(result.month);
  assertNull(result.day);
  assertFalse(result.uncertain);
  assertTrue(result.approximate);
}


function testEdtfDateFromString_UncertainApprox() {
  var result = edtfDateFromString('2001-05-23?~');
  assertEquals('2001', result.year);
  assertEquals('05', result.month);
  assertEquals('23', result.day);
  assertTrue(result.uncertain);
  assertTrue(result.approximate);

  var result = edtfDateFromString('2001?~');
  assertEquals('2001', result.year);
  assertNull(result.month);
  assertNull(result.day);
  assertTrue(result.uncertain);
  assertTrue(result.approximate);
}


function testEdtfDateToEdtfString() {
  var d = edtfDateFromString('2001-05-23');
  assertEquals('2001-05-23', d.toEdtfString());

  var d = edtfDateFromString('2001-05-23?');
  assertEquals('2001-05-23?', d.toEdtfString());

  var d = edtfDateFromString('2001-05-23~');
  assertEquals('2001-05-23~', d.toEdtfString());

  var d = edtfDateFromString('2001-05-23?~');
  assertEquals('2001-05-23?~', d.toEdtfString());

  var d = edtfDateFromString('2001?~');
  assertEquals('2001?~', d.toEdtfString());
}


function testEdtfDateToLocaleDateString() {
  var d = edtfDateFromString('2001-05-23');
  assertEquals('5/23/2001', d.toLocaleDateString());

  var d = edtfDateFromString('2001-05-23?');
  assertEquals('5/23/2001 (uncertain)', d.toLocaleDateString());

  var d = edtfDateFromString('2001-05-23~');
  assertEquals('abt 5/23/2001', d.toLocaleDateString());

  var d = edtfDateFromString('2001-05-23?~');
  assertEquals('abt 5/23/2001 (uncertain)', d.toLocaleDateString());

  var d = edtfDateFromString('2001?~');
  assertEquals('abt 2001 (uncertain)', d.toLocaleDateString());

  // An illegal date
  var d = new EdtfDate({});
  assertEquals('', d.toLocaleDateString());
}


function testEdtfDateToDate() {
  // A month with 31 days
  var d = edtfDateFromString('2001-05-23');
  assertEquals(new Date('5/23/2001').toDateString(), d.toDate().toDateString());

  // A month with 30 days
  var d = edtfDateFromString('1848-11-03');
  assertEquals(new Date('11/3/1848').toDateString(), d.toDate().toDateString());

  var d = edtfDateFromString('2001-05-23?');
  assertEquals(new Date('5/23/2001').toDateString(), d.toDate().toDateString());

  var d = edtfDateFromString('2001-05-23~');
  assertEquals(new Date('5/23/2001').toDateString(), d.toDate().toDateString());

  var d = edtfDateFromString('2001-05-23?~');
  assertEquals(new Date('5/23/2001').toDateString(), d.toDate().toDateString());

  var d = edtfDateFromString('2001~');
  assertEquals(new Date('1/1/2001').toDateString(), d.toDate().toDateString());

  var d = edtfDateFromString('2001-05-uu');
  assertEquals(new Date('5/1/2001').toDateString(), d.toDate().toDateString());

  var d = edtfDateFromString('2001-uu');
  assertEquals(new Date('1/1/2001').toDateString(), d.toDate().toDateString());

  // An illegal date
  var d = new EdtfDate({});
  assertEquals(null, d.toDate());
}
