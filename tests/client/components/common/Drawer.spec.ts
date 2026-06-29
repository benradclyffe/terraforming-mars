import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {h} from 'vue';
import {globalConfig} from '../getLocalVue';
import Drawer from '@/client/components/common/Drawer.vue';

function mountDrawer(props: Record<string, unknown>) {
  return mount(Drawer, {
    ...globalConfig,
    props: {side: 'right', title: 'Log', ...props},
    slots: {default: () => h('div', {class: 'drawer-content'}, 'hello')},
  });
}

describe('Drawer', () => {
  it('renders slot content when open', () => {
    const wrapper = mountDrawer({open: true});
    expect(wrapper.find('.drawer-content').exists()).to.be.true;
  });

  it('does not render content when closed', () => {
    const wrapper = mountDrawer({open: false});
    expect(wrapper.find('.drawer-content').exists()).to.be.false;
  });

  it('emits close when the close button is clicked', async () => {
    const wrapper = mountDrawer({open: true});
    await wrapper.find('.drawer-close').trigger('click');
    expect(wrapper.emitted('close')).to.have.length(1);
  });

  it('emits close when the backdrop is clicked', async () => {
    const wrapper = mountDrawer({open: true});
    await wrapper.find('.drawer-backdrop').trigger('click');
    expect(wrapper.emitted('close')).to.have.length(1);
  });

  it('emits close when Escape is pressed while open', async () => {
    const wrapper = mountDrawer({open: true});
    window.dispatchEvent(new window.KeyboardEvent('keydown', {key: 'Escape'}));
    await wrapper.vm.$nextTick();
    expect(wrapper.emitted('close')).to.have.length(1);
  });

  it('applies a side class so it can slide in from the requested edge', () => {
    const wrapper = mountDrawer({open: true, side: 'bottom'});
    expect(wrapper.find('.drawer--bottom').exists()).to.be.true;
  });
});
