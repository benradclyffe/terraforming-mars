import {shallowMount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from './getLocalVue';
import SelectCard from '@/client/components/SelectCard.vue';
import CardNameSearch from '@/client/components/CardNameSearch.vue';
import {fakePlayerViewModel, fakePublicPlayerModel} from './testHelpers';
import {PreferencesManager} from '@/client/utils/PreferencesManager';
import {CardName} from '@/common/cards/CardName';

function mountSelectCard(playerView = fakePlayerViewModel()) {
  return shallowMount(SelectCard, {
    ...globalConfig,
    global: {...globalConfig.global, components: {CardNameSearch}},
    props: {
      playerView,
      playerinput: {
        title: 'Select a card',
        buttonLabel: 'Save',
        type: 'card',
        cards: [{name: CardName.BIRDS, isDisabled: false}, {name: CardName.TARDIGRADES, isDisabled: false}],
        max: 1,
        min: 1,
        showOnlyInLearnerMode: false,
        selectBlueCardAction: false,
        showOwner: false,
        showSelectAll: false,
      },
      onsave: () => {},
      showsave: true,
      showtitle: true,
    },
  });
}

describe('SelectCard', () => {
  it('mounts without errors', () => {
    PreferencesManager.INSTANCE.set('sandbox_card_search', false);
    expect(mountSelectCard().exists()).to.be.true;
  });

  it('shows no replace controls unless the sandbox preference is on', () => {
    PreferencesManager.INSTANCE.set('sandbox_card_search', false);
    expect(mountSelectCard().findAll('.card-replace-icon').length).to.eq(0);
  });

  it('shows a replace icon per card when the sandbox preference is on in solo', () => {
    PreferencesManager.INSTANCE.set('sandbox_card_search', true);
    expect(mountSelectCard().findAll('.card-replace-icon').length).to.eq(2);
  });

  it('hides the replace controls in multiplayer even when the sandbox preference is on', () => {
    PreferencesManager.INSTANCE.set('sandbox_card_search', true);
    const p1 = fakePublicPlayerModel({color: 'red'});
    const p2 = fakePublicPlayerModel({color: 'blue'});
    const multiplayer = fakePlayerViewModel({thisPlayer: p1, players: [p1, p2]});
    expect(mountSelectCard(multiplayer).findAll('.card-replace-icon').length).to.eq(0);
  });

  it('posts a replace request when a replacement is chosen', async () => {
    PreferencesManager.INSTANCE.set('sandbox_card_search', true);
    const calls: Array<{url: string, body: any}> = [];
    (global as any).fetch = (url: string, opts: any) => {
      calls.push({url, body: JSON.parse(opts.body)});
      return new Promise(() => {}); // never resolves; we only assert the request
    };

    const wrapper = mountSelectCard();
    await wrapper.findAll('.card-replace-icon')[0].trigger('click');
    wrapper.findComponent(CardNameSearch).vm.$emit('select', CardName.SEARCH_FOR_LIFE);
    await wrapper.vm.$nextTick();

    expect(calls.length).to.eq(1);
    expect(calls[0].url).to.contain('player/replace-card');
    expect(calls[0].body.targetCardName).to.eq(CardName.BIRDS);
    expect(calls[0].body.replacementCardName).to.eq(CardName.SEARCH_FOR_LIFE);
  });
});
