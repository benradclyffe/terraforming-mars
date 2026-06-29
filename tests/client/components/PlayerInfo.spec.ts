import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from './getLocalVue';
import PlayerInfo from '@/client/components/overview/PlayerInfo.vue';
import {fakePlayerViewModel, fakePublicPlayerModel} from './testHelpers';
import {CardName} from '@/common/cards/CardName';

function mountInfo(section?: string) {
  const thisPlayer = fakePublicPlayerModel({color: 'blue', name: 'Me', tableau: [{name: CardName.ECOLINE}] as any});
  const playerView = fakePlayerViewModel({thisPlayer, players: [thisPlayer]});
  return mount(PlayerInfo, {
    ...globalConfig,
    props: {player: thisPlayer, playerView, actionLabel: '', playerIndex: -1, section},
  });
}

describe('PlayerInfo', () => {
  it('section=identity shows the name/corp/timer and not the resource body', () => {
    const wrapper = mountInfo('identity');
    expect(wrapper.find('.player-info-name').exists()).to.be.true;
    expect(wrapper.find('.player-info-corp').exists()).to.be.true;
    expect(wrapper.findComponent({name: 'PlayerStatus'}).exists()).to.be.true;
    // body parts are hidden
    expect(wrapper.find('.player-played-cards').exists()).to.be.false;
    expect(wrapper.findComponent({name: 'PlayerResources'}).exists()).to.be.false;
    expect(wrapper.findComponent({name: 'PlayerTags'}).exists()).to.be.false;
  });
});
