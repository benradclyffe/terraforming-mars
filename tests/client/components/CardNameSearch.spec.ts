import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from './getLocalVue';
import CardNameSearch from '@/client/components/CardNameSearch.vue';
import {CardName} from '@/common/cards/CardName';

function mountSearch() {
  return mount(CardNameSearch, {
    ...globalConfig,
    props: {cards: ['Tardigrades', 'Birds', 'Bushes'] as Array<CardName>},
  });
}

describe('CardNameSearch', () => {
  it('shows no results before typing', () => {
    expect(mountSearch().findAll('.card-name-search-result').length).to.eq(0);
  });

  it('filters card names case-insensitively by substring', async () => {
    const wrapper = mountSearch();
    await wrapper.find('input').setValue('bir');
    const results = wrapper.findAll('.card-name-search-result');
    expect(results.length).to.eq(1);
    expect(results[0].text()).to.contain('Birds');
  });

  it('emits select with the chosen card name', async () => {
    const wrapper = mountSearch();
    await wrapper.find('input').setValue('bu');
    await wrapper.find('.card-name-search-result').trigger('click');
    expect(wrapper.emitted('select')).to.deep.eq([['Bushes']]);
  });
});
