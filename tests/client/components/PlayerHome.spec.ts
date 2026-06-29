import {shallowMount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from './getLocalVue';
import PlayerHome from '@/client/components/PlayerHome.vue';
import Drawer from '@/client/components/common/Drawer.vue';
import PlayerDashboardBar from '@/client/components/PlayerDashboardBar.vue';
import OtherPlayersStrip from '@/client/components/OtherPlayersStrip.vue';
import Sidebar from '@/client/components/Sidebar.vue';
import {fakePlayerViewModel, fakePublicPlayerModel} from './testHelpers';
import {FakeLocalStorage} from './FakeLocalStorage';
import {CardName} from '@/common/cards/CardName';
import raw_settings from '@/genfiles/settings.json';

// A player who is in the game (has a tableau) so PlayerHome renders the
// single-screen dashboard rather than the setup view.
function inGameView() {
  const thisPlayer = fakePublicPlayerModel({
    color: 'blue',
    tableau: [{name: CardName.ECOLINE}] as any,
  });
  const opponent = fakePublicPlayerModel({color: 'red', name: 'Red'});
  return fakePlayerViewModel({thisPlayer, players: [thisPlayer, opponent]});
}

function mountHome(playerView = inGameView()) {
  return shallowMount(PlayerHome, {
    ...globalConfig,
    parentComponent: {
      methods: {
        getVisibilityState: () => true,
        setVisibilityState: () => {},
      },
    } as any,
    props: {playerView, settings: raw_settings},
  });
}

describe('PlayerHome', () => {
  let localStorage: FakeLocalStorage;

  beforeEach(() => {
    localStorage = new FakeLocalStorage();
    FakeLocalStorage.register(localStorage);
  });

  afterEach(() => {
    FakeLocalStorage.deregister(localStorage);
  });

  it('mounts without errors', () => {
    expect(mountHome().exists()).to.be.true;
  });

  it('shows no drawer until an icon is clicked', () => {
    expect(mountHome().findComponent(Drawer).exists()).to.be.false;
  });

  it('opens the cards-in-hand drawer when the bar emits toggle hand', async () => {
    const wrapper = mountHome();
    wrapper.findComponent(PlayerDashboardBar).vm.$emit('toggle', 'hand');
    await wrapper.vm.$nextTick();
    const drawer = wrapper.findComponent(Drawer);
    expect(drawer.exists()).to.be.true;
    expect(drawer.props('title')).to.eq('Cards in hand');
  });

  it('opens the played-cards drawer when the bar emits toggle played', async () => {
    const wrapper = mountHome();
    wrapper.findComponent(PlayerDashboardBar).vm.$emit('toggle', 'played');
    await wrapper.vm.$nextTick();
    expect(wrapper.findComponent(Drawer).props('title')).to.eq('Played cards');
  });

  it('toggling the same drawer twice closes it', async () => {
    const wrapper = mountHome();
    const bar = wrapper.findComponent(PlayerDashboardBar);
    bar.vm.$emit('toggle', 'hand');
    await wrapper.vm.$nextTick();
    bar.vm.$emit('toggle', 'hand');
    await wrapper.vm.$nextTick();
    expect(wrapper.findComponent(Drawer).exists()).to.be.false;
  });

  it('opens the log drawer when the sidebar emits toggle-log', async () => {
    const wrapper = mountHome();
    wrapper.findComponent(Sidebar).vm.$emit('toggle-log');
    await wrapper.vm.$nextTick();
    expect(wrapper.findComponent(Drawer).props('title')).to.eq('Game log');
  });

  it('opens the corporation drawer when the bar emits toggle corp', async () => {
    const wrapper = mountHome();
    wrapper.findComponent(PlayerDashboardBar).vm.$emit('toggle', 'corp');
    await wrapper.vm.$nextTick();
    expect(wrapper.findComponent(Drawer).props('title')).to.eq('Corporation');
  });

  it('opens an opponent drawer when the strip emits select', async () => {
    const wrapper = mountHome();
    wrapper.findComponent(OtherPlayersStrip).vm.$emit('select', 'red');
    await wrapper.vm.$nextTick();
    expect(wrapper.findComponent(Drawer).exists()).to.be.true;
  });
});
