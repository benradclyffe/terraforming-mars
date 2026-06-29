import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from './getLocalVue';
import PlayerResource from '@/client/components/overview/PlayerResource.vue';
import {Resource} from '@/common/Resource';

function mountResource(props: Record<string, unknown> = {}) {
  return mount(PlayerResource, {
    ...globalConfig,
    props: {type: Resource.HEAT, count: 8, production: 0, ...props},
  });
}

describe('PlayerResource', () => {
  it('shows no convert button by default', () => {
    expect(mountResource().find('.resource-convert-button').exists()).to.be.false;
  });

  it('shows a convert button when the resource can be converted', () => {
    expect(mountResource({canConvert: true}).find('.resource-convert-button').exists()).to.be.true;
  });

  it('emits convert when the convert button is clicked', async () => {
    const wrapper = mountResource({canConvert: true});
    await wrapper.find('.resource-convert-button').trigger('click');
    expect(wrapper.emitted('convert')).to.have.length(1);
  });
});
