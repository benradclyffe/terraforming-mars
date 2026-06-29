import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from './getLocalVue';
import PlayerResources from '@/client/components/overview/PlayerResources.vue';
import {fakePublicPlayerModel} from './testHelpers';
import {Resource} from '@/common/Resource';

// Integration: convertResources must reach the heat resource square through the
// real PlayerResources -> PlayerResource chain.
describe('PlayerResources convert integration', () => {
  function mountResources(convertResources: Record<string, number>) {
    return mount(PlayerResources, {
      ...globalConfig,
      props: {
        player: fakePublicPlayerModel({color: 'blue', heat: 10}),
        convertResources,
      },
    });
  }

  it('renders a convert button on the heat square when heat is convertible', () => {
    const wrapper = mountResources({[Resource.HEAT]: 5});
    const heatSquare = wrapper.find('.resource_item--heat');
    expect(heatSquare.find('.resource-convert-button').exists()).to.be.true;
  });

  it('does not render a convert button on the heat square when heat is not convertible', () => {
    const wrapper = mountResources({});
    const heatSquare = wrapper.find('.resource_item--heat');
    expect(heatSquare.find('.resource-convert-button').exists()).to.be.false;
  });

  it('emits convert heat when that button is clicked', async () => {
    const wrapper = mountResources({[Resource.HEAT]: 5});
    await wrapper.find('.resource_item--heat .resource-convert-button').trigger('click');
    expect(wrapper.emitted('convert')).to.deep.eq([[Resource.HEAT]]);
  });
});
