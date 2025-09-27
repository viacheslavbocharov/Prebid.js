# Bocharov Bid Adapter (learning/demo)

**Status:** demo/learning  
**Media types:** Banner

## Params
| Param        | Type   | Required | Example         |
|--------------|--------|----------|-----------------|
| `publisherId`| string | yes      | `demo-pub-123`  |

## Example adUnit
```js
const adUnits = [{
  code: 'div-gpt-bocharov-1',
  mediaTypes: { banner: { sizes: [[300, 250], [336, 280]] } },
  bids: [{ bidder: 'bocharov', params: { publisherId: 'demo-pub-123' } }]
}];
