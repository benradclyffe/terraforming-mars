import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from './getLocalVue';
import PlayerDashboardBar from '@/client/components/PlayerDashboardBar.vue';

const thisPlayer = {color: 'red', name: 'Me', tableau: []} as any;

const playerView = {
  thisPlayer,
  players: [thisPlayer],
  game: {phase: 'action', gameOptions: {}},
} as any;

function mountBar(props: Record<string, unknown> = {}) {
  return mount(PlayerDashboardBar, {
    ...globalConfig,
    global: {
      ...globalConfig.global,
      stubs: {PlayerInfo: {template: '<div class="stub-playerinfo"></div>'}},
    },
    props: {playerView, handCount: 3, playedCount: 5, coloniesCount: 0, ...props},
  });
}

describe('PlayerDashboardBar', () => {
  it('renders the current player info', () => {
    expect(mountBar().find('.stub-playerinfo').exists()).to.be.true;
  });

  it('shows the cards-in-hand count on its icon', () => {
    expect(mountBar().find('.dashboard-icon--hand .dashboard-count').text()).to.eq('3');
  });

  it('shows the played-cards count on its icon', () => {
    expect(mountBar().find('.dashboard-icon--played .dashboard-count').text()).to.eq('5');
  });

  it('emits toggle "hand" when the hand icon is clicked', async () => {
    const wrapper = mountBar();
    await wrapper.find('.dashboard-icon--hand').trigger('click');
    expect(wrapper.emitted('toggle')).to.deep.eq([['hand']]);
  });

  it('emits toggle "played" when the played icon is clicked', async () => {
    const wrapper = mountBar();
    await wrapper.find('.dashboard-icon--played').trigger('click');
    expect(wrapper.emitted('toggle')).to.deep.eq([['played']]);
  });

  it('emits toggle "corp" when the corporation icon is clicked', async () => {
    const wrapper = mountBar();
    await wrapper.find('.dashboard-icon--corp').trigger('click');
    expect(wrapper.emitted('toggle')).to.deep.eq([['corp']]);
  });

  it('hides the colonies icon when there are no colonies', () => {
    expect(mountBar({coloniesCount: 0}).find('.dashboard-icon--colonies').exists()).to.be.false;
  });

  it('shows the colonies icon when colonies are in play', () => {
    expect(mountBar({coloniesCount: 2}).find('.dashboard-icon--colonies').exists()).to.be.true;
  });
});
