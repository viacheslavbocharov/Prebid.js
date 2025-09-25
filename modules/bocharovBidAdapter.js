// const AUCTION_PATH = 'https://auction.bocharexchange.com/prebid';
// const BIDDER_CODE = 'bocharov';
// export const spec = {
//     code: BIDDER_CODE,
//     supportedMediaTypes: [BANNER],
//     isBidRequestValid: function(bid) {
//         // return if bid invalide
//     },
//     buildRequests: (validBidRequests) => {},
//     interpretResponse: (serverResponse, bidRequest) => {},
// }

// registerBidder(spec);

import {registerBidder} from '../src/adapters/bidderFactory.js';
import {BANNER} from '../src/mediaTypes.js';
import { logInfo, deepAccess, parseSizesInput } from '../src/utils.js';

const BIDDER_CODE = 'bocharov';
const AUCTION_PATH = 'https://auction.bocharexchange.com/prebid';

export const spec = {
  code: BIDDER_CODE,
  supportedMediaTypes: [BANNER],

  /**
   * Требуем минимальные параметры: publisherId (строка)
   * и хотя бы один banner size.
   */
  isBidRequestValid(bid) {
    const pubId = deepAccess(bid, 'params.publisherId');
    const sizes = deepAccess(bid, 'mediaTypes.banner.sizes') || bid.sizes;
    const ok = !!pubId && Array.isArray(sizes) && sizes.length > 0;
    if (!ok) {
      logInfo(`[${BIDDER_CODE}] invalid bid`, { bidId: bid.bidId, pubId, sizes });
    }
    return ok;
  },

  /**
   * Формируем один POST-запрос (chunking не делаем).
   * В учебных целях главное — увидеть, что запрос "ушёл".
   */
  buildRequests(validBidRequests, bidderRequest) {
    const payload = {
      bidder: BIDDER_CODE,
      publisherId: validBidRequests[0]?.params?.publisherId,
      referer: bidderRequest?.refererInfo?.page,
      gpp: bidderRequest?.gppConsent?.gppString || bidderRequest?.ortb2?.regs?.gpp,
      gppSid: bidderRequest?.gppConsent?.applicableSections?.toString() || bidderRequest?.ortb2?.regs?.gpp_sid,
      bids: validBidRequests.map(bid => ({
        requestId: bid.bidId,
        adUnitCode: bid.adUnitCode,
        sizes: parseSizesInput(
          deepAccess(bid, 'mediaTypes.banner.sizes') || bid.sizes
        ),
        params: bid.params
      })),
    };

    // Просто логируем, чтобы в консоли видеть отправку
    logInfo(`[${BIDDER_CODE}] buildRequests ->`, payload);

    return {
      method: 'POST',
      url: AUCTION_PATH,
      data: JSON.stringify(payload),
      options: { contentType: 'application/json' }
    };
  },

  /**
   * Разбираем ответ сервера. Если сервера пока нет, вернём пусто.
   * Для тестов предусмотрим "мок" формата:
   * {
   *   bids: [{
   *     requestId, cpm, width, height, creativeId, currency, ad
   *   }]
   * }
   */
  interpretResponse(serverResponse, bidRequest) {
    const body = serverResponse?.body;
    if (!body || !Array.isArray(body.bids)) {
      logInfo(`[${BIDDER_CODE}] empty response`, { serverResponse });
      return [];
    }
    const result = body.bids
      .filter(b => b && b.cpm > 0)
      .map(b => ({
        requestId: b.requestId,
        cpm: b.cpm,
        width: b.width,
        height: b.height,
        creativeId: b.creativeId || 'bocharov-demo',
        currency: b.currency || 'USD',
        netRevenue: true,
        ttl: 60,
        ad: b.ad || '<div style="background:#eee;width:100%;height:100%;display:flex;align-items:center;justify-content:center;">Bocharov Demo Creative</div>'
      }));

    logInfo(`[${BIDDER_CODE}] interpretResponse ->`, result);
    return result;
  },

  /**
   * (Опционально) user sync — здесь пусто для простоты.
   */
  getUserSyncs() { return []; }
};

registerBidder(spec);
export default spec;
