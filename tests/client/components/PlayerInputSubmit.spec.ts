import {expect} from 'chai';
import {submitPlayerInput} from '@/client/utils/PlayerInputSubmit';
import {PlayerViewModel} from '@/common/models/PlayerModel';

describe('submitPlayerInput', () => {
  let originalFetch: typeof fetch;
  beforeEach(() => {
    originalFetch = (global as any).fetch;
  });
  afterEach(() => {
    (global as any).fetch = originalFetch;
  });

  it('posts the response merged with the run id to the player-input endpoint', () => {
    const calls: Array<{url: string, body: any}> = [];
    (global as any).fetch = (url: string, opts: any) => {
      calls.push({url, body: JSON.parse(opts.body)});
      return new Promise(() => {}); // never resolves; only assert the request
    };
    const playerView = {id: 'p-id', runId: 'run-1'} as unknown as PlayerViewModel;
    const response = {type: 'or', index: 2, response: {type: 'card', cards: ['X']}};

    submitPlayerInput({} as any, playerView, response as any);

    expect(calls).to.have.length(1);
    expect(calls[0].url).to.contain('player/input');
    expect(calls[0].url).to.contain('p-id');
    expect(calls[0].body).to.deep.eq({runId: 'run-1', type: 'or', index: 2, response: {type: 'card', cards: ['X']}});
  });
});
