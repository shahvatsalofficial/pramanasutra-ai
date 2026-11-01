import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { sum } from '../src/math.js';
test.only('example focused test: should be removed before release', () => assert.equal(sum(1,2), 3));
test.skip('example skipped test', () => {});
