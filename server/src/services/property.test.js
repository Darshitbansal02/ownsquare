import {test} from 'node:test';
import assert from 'node:assert/strict';
import {deriveFinancials} from './property.service.js';
import {fileType} from './upload.service.js';
import {propertyCreateSchema,publicQuery} from '../validators/properties.schema.js';
test('exact whole-rupee draft financials and strict trust boundaries',()=>{
  assert.equal(deriveFinancials({valuation:1000000000,totalUnits:1000}).unitPrice,1000000);
  assert.equal(deriveFinancials({valuation:1000000000}).unitPrice,null);
  assert.throws(()=>deriveFinancials({valuation:101,totalUnits:1}),{code:'VALIDATION_ERROR'});
  assert.throws(()=>deriveFinancials({valuation:10000,totalUnits:10,minUnits:11}),{code:'VALIDATION_ERROR'});
  assert.equal(propertyCreateSchema.safeParse({status:'LIVE'}).success,false);
  assert.equal(propertyCreateSchema.safeParse({valuation:Number.MAX_SAFE_INTEGER+1}).success,false);
  assert.equal(publicQuery.safeParse({minPrice:'2',maxPrice:'1'}).success,false);
  assert.equal(publicQuery.parse({}).page,1);
});
test('uploads inspect actual file signatures',()=>{
  assert.equal(fileType(Buffer.from([255,216,255,0])),'image/jpeg');
  assert.equal(fileType(Buffer.from('%PDF-1.7')),'application/pdf');
  assert.equal(fileType(Buffer.from('<script>fake image</script>')),null);
});
