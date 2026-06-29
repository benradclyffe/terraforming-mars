import {mount} from '@vue/test-utils';
import {globalConfig} from './getLocalVue';
import {expect} from 'chai';
import ActionMenu from '@/client/components/ActionMenu.vue';
import PlayerInputFactory from '@/client/components/PlayerInputFactory.vue';
import {PreferencesManager} from '@/client/utils/PreferencesManager';
import {InputResponse} from '@/common/inputs/InputResponse';

function mountActionMenu(props: any) {
  return mount(ActionMenu, {
    ...globalConfig,
    global: {
      ...globalConfig.global,
      components: {'PlayerInputFactory': PlayerInputFactory},
    },
    props,
  });
}

describe('ActionMenu', () => {
  it('renders one button per option, filtering learner-mode-only cards', () => {
    PreferencesManager.INSTANCE.set('learner_mode', false);
    const component = mountActionMenu({
      playerView: {},
      playerinput: {
        type: 'or',
        title: 'Take your next action',
        menu: true,
        options: [
          {type: 'card', title: 'hide this', showOnlyInLearnerMode: true},
          {type: 'option', title: 'Standard projects', buttonLabel: 'Standard projects'},
          {type: 'option', title: 'Pass', buttonLabel: 'Pass'},
        ],
      },
      onsave: () => {},
    });
    const buttons = component.findAllComponents({name: 'AppButton'});
    expect(buttons.length).to.eq(2);
  });

  it('opens a modal hosting the selected option when its button is clicked', async () => {
    PreferencesManager.INSTANCE.set('learner_mode', false);
    const component = mountActionMenu({
      playerView: {},
      playerinput: {
        type: 'or',
        title: 'Take your next action',
        menu: true,
        options: [
          {type: 'option', title: 'select a', buttonLabel: 'a'},
          {type: 'option', title: 'select b', buttonLabel: 'b'},
        ],
      },
      onsave: () => {},
    });
    // No modal before clicking.
    expect(component.findComponent({name: 'PlayerInputFactory'}).exists()).to.be.false;

    await component.findAllComponents({name: 'AppButton'})[1].trigger('click');

    const factory = component.findComponent({name: 'PlayerInputFactory'});
    expect(factory.exists()).to.be.true;
    expect(factory.props('playerinput').title).to.eq('select b');
  });

  it('submitting the modal emits an or response with the original index', async () => {
    let savedData: InputResponse | undefined;
    PreferencesManager.INSTANCE.set('learner_mode', false);
    const component = mountActionMenu({
      playerView: {},
      playerinput: {
        type: 'or',
        title: 'Take your next action',
        menu: true,
        options: [
          {type: 'card', title: 'hide this', showOnlyInLearnerMode: true},
          {type: 'option', title: 'select a', buttonLabel: 'a'},
          {type: 'option', title: 'select b', buttonLabel: 'b'},
        ],
      },
      onsave: (data: InputResponse) => {
        savedData = data;
      },
    });
    // Two displayed buttons (card filtered): 'select a' (orig 1), 'select b' (orig 2).
    await component.findAllComponents({name: 'AppButton'})[1].trigger('click');

    // The modal's confirm button submits the option.
    const modal = component.find('.action-menu-modal');
    expect(modal.exists()).to.be.true;
    await modal.findComponent({name: 'AppButton'}).trigger('click');

    expect(savedData).to.deep.eq({type: 'or', index: 2, response: {type: 'option'}});
  });

  it('auto-submits a terminal option requested via requestOptionIndex', async () => {
    let savedData: InputResponse | undefined;
    PreferencesManager.INSTANCE.set('learner_mode', false);
    const component = mountActionMenu({
      playerView: {},
      playerinput: {
        type: 'or',
        title: 'Take your next action',
        menu: true,
        options: [
          {type: 'option', title: 'Convert heat', buttonLabel: 'Convert heat'},
        ],
      },
      onsave: (data: InputResponse) => {
        savedData = data;
      },
    });
    await component.setProps({requestOptionIndex: 0});
    expect(savedData).to.deep.eq({type: 'or', index: 0, response: {type: 'option'}});
    expect(component.find('.action-menu-modal').exists()).to.be.false;
    expect(component.emitted('request-handled')).to.have.length(1);
  });

  it('opens the modal for a non-terminal requested option', async () => {
    let savedData: InputResponse | undefined;
    PreferencesManager.INSTANCE.set('learner_mode', false);
    const component = mountActionMenu({
      playerView: {},
      playerinput: {
        type: 'or',
        title: 'Take your next action',
        menu: true,
        options: [
          {type: 'space', title: 'Convert plants', buttonLabel: 'Convert plants', spaces: []},
        ],
      },
      onsave: (data: InputResponse) => {
        savedData = data;
      },
    });
    await component.setProps({requestOptionIndex: 0});
    expect(component.find('.action-menu-modal').exists()).to.be.true;
    expect(savedData).to.be.undefined;
  });

  it('closes the modal without submitting when cancelled', async () => {
    let savedData: InputResponse | undefined;
    PreferencesManager.INSTANCE.set('learner_mode', false);
    const component = mountActionMenu({
      playerView: {},
      playerinput: {
        type: 'or',
        title: 'Take your next action',
        menu: true,
        options: [
          {type: 'option', title: 'select a', buttonLabel: 'a'},
        ],
      },
      onsave: (data: InputResponse) => {
        savedData = data;
      },
    });
    await component.findAllComponents({name: 'AppButton'})[0].trigger('click');
    expect(component.find('.action-menu-modal').exists()).to.be.true;

    await component.find('.action-menu-modal-close').trigger('click');

    expect(component.find('.action-menu-modal').exists()).to.be.false;
    expect(savedData).to.be.undefined;
  });
});
