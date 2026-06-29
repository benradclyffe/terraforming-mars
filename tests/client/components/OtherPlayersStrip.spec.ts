import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from './getLocalVue';
import OtherPlayersStrip from '@/client/components/OtherPlayersStrip.vue';

const players = [
  {color: 'red', name: 'Me', terraformRating: 20},
  {color: 'blue', name: 'Blue', terraformRating: 25},
  {color: 'green', name: 'Green', terraformRating: 22},
] as any;

function mountStrip() {
  return mount(OtherPlayersStrip, {
    ...globalConfig,
    props: {players, thisPlayerColor: 'red'},
  });
}

describe('OtherPlayersStrip', () => {
  it('renders one entry per opponent, excluding the current player', () => {
    expect(mountStrip().findAll('.other-player-entry').length).to.eq(2);
  });

  it('shows each opponent name and terraform rating', () => {
    const text = mountStrip().text();
    expect(text).to.include('Blue');
    expect(text).to.include('25');
    expect(text).to.include('Green');
    expect(text).to.include('22');
  });

  it('emits select with the opponent color when an entry is clicked', async () => {
    const wrapper = mountStrip();
    await wrapper.findAll('.other-player-entry')[0].trigger('click');
    expect(wrapper.emitted('select')).to.deep.eq([['blue']]);
  });
});
