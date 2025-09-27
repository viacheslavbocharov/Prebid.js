import { expect } from 'chai';
import { spec } from 'modules/bocharovBidAdapter.js';

describe('bocharovBidAdapter', function () {
  const bid = {
    bidId: '123',
    adUnitCode: 'div-1',
    params: { publisherId: 'demo-pub-123' },
    mediaTypes: { banner: { sizes: [[300, 250]] } }
  };

  it('validates bids', function () {
    expect(spec.isBidRequestValid(bid)).to.equal(true);
    expect(spec.isBidRequestValid({ ...bid, params: {} })).to.equal(false);
    expect(spec.isBidRequestValid({ ...bid, mediaTypes: { banner: { sizes: [] } } })).to.equal(false);
  });

  it('builds request', function () {
    const req = spec.buildRequests([bid], { refererInfo: { page: 'https://site.test' } });
    expect(req.method).to.equal('POST');
    expect(req.url).to.contain('bocharexchange.com/prebid');
    const body = JSON.parse(req.data);
    expect(body.bidder).to.equal('bocharov');
    expect(body.publisherId).to.equal('demo-pub-123');
    expect(body.bids).to.have.length(1);
    expect(body.bids[0].sizes).to.deep.equal(['300x250']);
  });

  it('interprets empty response', function () {
    const res = spec.interpretResponse({ body: null });
    expect(res).to.be.an('array').that.has.length(0);
  });

  it('interprets mock bids', function () {
    const mock = {
      body: {
        bids: [{
          requestId: '123',
          cpm: 0.5,
          width: 300,
          height: 250,
          creativeId: 'cr-1',
          currency: 'USD',
          ad: '<div>demo</div>'
        }]
      }
    };
    const parsed = spec.interpretResponse(mock, {});
    expect(parsed).to.have.length(1);
    expect(parsed[0].requestId).to.equal('123');
    expect(parsed[0].cpm).to.equal(0.5);
    expect(parsed[0].ad).to.contain('demo');
  });
});
