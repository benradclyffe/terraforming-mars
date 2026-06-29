import {mount} from '@vue/test-utils';
import {globalConfig} from './getLocalVue';
import {expect} from 'chai';
import {CardName} from '@/common/cards/CardName';
import SortableCards from '@/client/components/SortableCards.vue';
import CardNameSearch from '@/client/components/CardNameSearch.vue';
import {FakeLocalStorage} from './FakeLocalStorage';
import {fakePlayerViewModel} from './testHelpers';
import {PreferencesManager} from '@/client/utils/PreferencesManager';

describe('SortableCards', () => {
  let localStorage: FakeLocalStorage;

  beforeEach(() => {
    localStorage = new FakeLocalStorage();
    FakeLocalStorage.register(localStorage);
  });
  afterEach(() => {
    FakeLocalStorage.deregister(localStorage);
  });

  it('does not show the sandbox hint without a playerView', () => {
    PreferencesManager.INSTANCE.set('sandbox_card_search', true);
    const sortable = mount(SortableCards, {
      ...globalConfig,
      props: {cards: [{name: CardName.ANTS}], playerId: 'foo'},
    });
    expect(sortable.find('.card-replace-hint').exists()).to.be.false;
  });

  it('replaces a card in hand via right-click + search when sandbox is on', async () => {
    PreferencesManager.INSTANCE.set('sandbox_card_search', true);
    const calls: Array<{url: string, body: any}> = [];
    (global as any).fetch = (url: string, opts: any) => {
      calls.push({url, body: JSON.parse(opts.body)});
      return new Promise(() => {});
    };
    const sortable = mount(SortableCards, {
      ...globalConfig,
      global: {...globalConfig.global, components: {CardNameSearch}},
      props: {
        cards: [{name: CardName.ANTS}, {name: CardName.CARTEL}],
        playerId: 'foo',
        playerView: fakePlayerViewModel(),
      },
    });
    expect(sortable.findComponent(CardNameSearch).exists()).to.be.false;
    await sortable.findAll('.cardbox')[0].trigger('contextmenu');
    expect(sortable.findComponent(CardNameSearch).exists()).to.be.true;
    sortable.findComponent(CardNameSearch).vm.$emit('select', CardName.BIRDS);
    await sortable.vm.$nextTick();
    expect(calls.length).to.eq(1);
    expect(calls[0].url).to.contain('player/replace-card');
    expect(calls[0].body.targetCardName).to.eq(CardName.ANTS);
    expect(calls[0].body.replacementCardName).to.eq(CardName.BIRDS);
  });

  it('allows sorting after initial loading with no local storage', async () => {
    const sortable = mount(SortableCards, {
      ...globalConfig,
      props: {
        cards: [{
          name: CardName.ANTS,
        }, {
          name: CardName.CARTEL,
        }],
        playerId: 'foo',
      },
    });
    let cards = sortable.findAllComponents({
      name: 'Card',
    });
    expect(cards).has.length(2);
    expect(cards[0].props().card.name).to.eq(CardName.ANTS);
    expect(cards[1].props().card.name).to.eq(CardName.CARTEL);
    const draggers = sortable.findAll('[draggable=true]');
    await draggers[1].trigger('dragstart');
    await sortable.vm.$nextTick();
    const droppers = sortable.findAll('.drop-target');
    await droppers[0].trigger('dragover');
    await draggers[1].trigger('dragend');
    cards = sortable.findAllComponents({
      name: 'Card',
    });
    expect(cards[0].props().card.name).to.eq(CardName.CARTEL);
    expect(cards[1].props().card.name).to.eq(CardName.ANTS);
    const order = localStorage.getItem('cardOrderfoo');
    expect(order).not.to.be.undefined;
    expect(JSON.parse(order!)).to.deep.eq({
      [CardName.ANTS]: 2,
      [CardName.CARTEL]: 1,
    });
  });
  it('puts new cards at end of order and removes old', async () => {
    localStorage.setItem('cardOrderfoo', JSON.stringify({
      [CardName.ANTS]: 2,
      [CardName.CARTEL]: 1,
      [CardName.DECOMPOSERS]: 3,
    }));
    const sortable = mount(SortableCards, {
      ...globalConfig,
      props: {
        cards: [{
          name: CardName.ANTS,
        }, {
          name: CardName.CARTEL,
        }, {
          name: CardName.BIRDS,
        }],
        playerId: 'foo',
      },
    });
    let cards = sortable.findAllComponents({
      name: 'Card',
    });
    expect(cards).has.length(3);
    expect(cards[0].props().card.name).to.eq(CardName.CARTEL);
    expect(cards[1].props().card.name).to.eq(CardName.ANTS);
    expect(cards[2].props().card.name).to.eq(CardName.BIRDS);
    const draggers = sortable.findAll('[draggable=true]');
    await draggers[0].trigger('dragstart');
    await sortable.vm.$nextTick();
    const droppers = sortable.findAll('.drop-target');
    await droppers[2].trigger('dragover');
    await draggers[0].trigger('dragend');
    cards = sortable.findAllComponents({
      name: 'Card',
    });
    expect(cards[0].props().card.name).to.eq(CardName.ANTS);
    expect(cards[1].props().card.name).to.eq(CardName.CARTEL);
    expect(cards[2].props().card.name).to.eq(CardName.BIRDS);
    const order = localStorage.getItem('cardOrderfoo');
    expect(order).not.to.be.undefined;
    expect(JSON.parse(order!)).to.deep.eq({
      [CardName.ANTS]: 2,
      [CardName.CARTEL]: 3,
      [CardName.BIRDS]: 4,
    });
  });
});
