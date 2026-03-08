import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';

import {
  type SkillTemplate,
  getApplyChangeSkillTemplate,
  getArchiveChangeSkillTemplate,
  getBulkArchiveChangeSkillTemplate,
  getContinueChangeSkillTemplate,
  getExploreSkillTemplate,
  getFeedbackSkillTemplate,
  getFfChangeSkillTemplate,
  getNewChangeSkillTemplate,
  getOnboardSkillTemplate,
  getOpsxApplyCommandTemplate,
  getOpsxArchiveCommandTemplate,
  getOpsxBulkArchiveCommandTemplate,
  getOpsxContinueCommandTemplate,
  getOpsxExploreCommandTemplate,
  getOpsxFfCommandTemplate,
  getOpsxNewCommandTemplate,
  getOpsxOnboardCommandTemplate,
  getOpsxSyncCommandTemplate,
  getOpsxProposeCommandTemplate,
  getOpsxProposeSkillTemplate,
  getOpsxSddCommandTemplate,
  getOpsxVerifyCommandTemplate,
  getSddSkillTemplate,
  getSyncSpecsSkillTemplate,
  getVerifyChangeSkillTemplate,
} from '../../../src/core/templates/skill-templates.js';
import { generateSkillContent } from '../../../src/core/shared/skill-generation.js';

const EXPECTED_FUNCTION_HASHES: Record<string, string> = {
  getExploreSkillTemplate: '12259960d9d32aea162aca84d73fafd371eca7a746cb78e7bd56e87b0bd0b22f',
  getNewChangeSkillTemplate: 'a4994f86175bbd1b30c9b7ddbe0d1075ae19185a8033475cfb8d0e70352c8008',
  getContinueChangeSkillTemplate: '93e247688a344239877d9cc02ca102e46c2a9ddbe2980956272b389482e32d83',
  getApplyChangeSkillTemplate: '8466086f835a7d8f6aa2c1c863d424315f7805428aad812bc59de23ed232b689',
  getFfChangeSkillTemplate: 'e45497ad823cffc5325bb61d5df890c0d61df995e249ba4c06e4710232094e47',
  getSyncSpecsSkillTemplate: '1acec3ea343b1bfbc3e53e8b28c755e426d726934336235620df553d18602f0b',
  getOnboardSkillTemplate: '953007f18f9fdfa6db5f58be52b4ca34e5551ca4f0a86b18ad9a47e4a988aae6',
  getSddSkillTemplate: 'e144dbcae7a51875bd1209e0b1addc0f8bab182d873729c86b0b390f7a0f23da',
  getOpsxExploreCommandTemplate: '91353d9e8633a3a9ce7339e796f1283478fca279153f3807c92f4f8ece246b19',
  getOpsxNewCommandTemplate: 'c93ceb94ca6aaf6a67def78c68a58f32a850d7b4ef4620bdf53380bacae7bc03',
  getOpsxContinueCommandTemplate: '71f5e569c74420c134d403c97b2a41a3681895457dde4976ad7fdb35fd45520a',
  getOpsxApplyCommandTemplate: 'efbd61c210a019329cce1e4d5077935f095a2fe55fe6e3ad110544683350188b',
  getOpsxFfCommandTemplate: 'd73cb43acfe03b07a64a142948b2747f54cde3313968763f5e19ce4db3b17925',
  getArchiveChangeSkillTemplate: '38c3d6d41217b9be403b9e7add6dbba0622d4e0cd93944ba5a49a621a4c29f07',
  getBulkArchiveChangeSkillTemplate: '5bbe33f301a1071ec9a390ceb41b74989653de9fac89f9fb9734290f9da150ee',
  getOpsxSyncCommandTemplate: '378d035fe7cc30be3e027b66dcc4b8afc78ef1c8369c39479c9b05a582fb5ccf',
  getVerifyChangeSkillTemplate: '32c55cf3abbf240ccf01450f8bb524cd7f7d91136049a35083080b7d89a2e2ba',
  getOpsxArchiveCommandTemplate: 'eb01c44dfa8aa924239bc29c68d1f21c4276e62e23c30206f2613041a70993ea',
  getOpsxOnboardCommandTemplate: 'cab1b20b29a25bff7a4eb50bac4ad3337791555d7215e11c4c88c1fa98845ada',
  getOpsxBulkArchiveCommandTemplate: '0f0a5c6e9b5d0ccf9d4f2eb8ad23195e8d3b44db4969635c7a75067dda740518',
  getOpsxVerifyCommandTemplate: 'd03d9240232479c4bebbebb765416c12a37360c023d997478b8a1613cbd48e08',
  getOpsxProposeSkillTemplate: '3e10e7f52bd9bc3afe8a440983178b8b01dcf68dbc9479686bd482a5712e0ce0',
  getOpsxProposeCommandTemplate: '613731d8eef2dac9410a19ebc384c10ac466cefb06f94ca40e20236e61bf0465',
  getOpsxSddCommandTemplate: 'f37a46144c7ef07626ebd8699c493d2536de259f0a2705a161a8ec630e8f8d33',
  getFeedbackSkillTemplate: '7973cad67f0b571ce26861fe9d98b38440b522e9424bca55020761526096f77a',
};

const EXPECTED_GENERATED_SKILL_CONTENT_HASHES: Record<string, string> = {
  'openspec-explore': '1968060c1f756dbe7ee5ca6c4cc851b062101271ea9dfada5365432a87b265a0',
  'openspec-new-change': 'd7bbc8444874c8269b741475eca476cfba58932cd5a4ed8e89c4662855ff4be2',
  'openspec-continue-change': 'f4e4ebb500a23827e4e38b35ba7d48ce451101be91123eccf116ab17ab424ca4',
  'openspec-apply-change': '05c9de7b6f0169055a16669e5bcfa7d14513eb2d11314be4ada647ab10ad528f',
  'openspec-ff-change': '8245c65fc11fbf48dea69fd7551edf76b22b7a0eab856d478ad04fb1446b74ca',
  'openspec-sync-specs': 'e9d4f2bf575f293bc9018aa3848399fae365e72c293f9b5a9bc0791a3cea929b',
  'openspec-archive-change': 'fd498cf0f1518e53a3b9b27aaf14b27ceef06c0961a58a031530119157c11a42',
  'openspec-bulk-archive-change': 'c4afd2ad2a6c04f692c654f6ccb4e1a77c43769a5691acc731256450bf8b815e',
  'openspec-verify-change': '98703a23edc4c5b85705e0f75338a7bf2eac21b02f48ee7654d37ab64c7e18e6',
  'openspec-onboard': '1615fa5395b4d075f41c679d309b05f8315d7ae3386750767c8750feeb76ad86',
  'openspec-propose': '04752274773a1a6ce14a0fbfb40f87c1ec56a604213b6efdcc9874547a8c6977',
  'openspec-sdd': '9987dcac751f0f0be4d4ad8b95fef89f93d5252e1f56469a1bef35aabd6c7e2a',
};

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`;
  }

  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`);

    return `{${entries.join(',')}}`;
  }

  return JSON.stringify(value);
}

function hash(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

describe('skill templates split parity', () => {
  it('preserves all template function payloads exactly', () => {
    const functionFactories: Record<string, () => unknown> = {
      getExploreSkillTemplate,
      getNewChangeSkillTemplate,
      getContinueChangeSkillTemplate,
      getApplyChangeSkillTemplate,
      getFfChangeSkillTemplate,
      getSyncSpecsSkillTemplate,
      getOnboardSkillTemplate,
      getSddSkillTemplate,
      getOpsxExploreCommandTemplate,
      getOpsxNewCommandTemplate,
      getOpsxContinueCommandTemplate,
      getOpsxApplyCommandTemplate,
      getOpsxFfCommandTemplate,
      getArchiveChangeSkillTemplate,
      getBulkArchiveChangeSkillTemplate,
      getOpsxSyncCommandTemplate,
      getVerifyChangeSkillTemplate,
      getOpsxArchiveCommandTemplate,
      getOpsxOnboardCommandTemplate,
      getOpsxBulkArchiveCommandTemplate,
      getOpsxVerifyCommandTemplate,
      getOpsxProposeSkillTemplate,
      getOpsxProposeCommandTemplate,
      getOpsxSddCommandTemplate,
      getFeedbackSkillTemplate,
    };

    const actualHashes = Object.fromEntries(
      Object.entries(functionFactories).map(([name, fn]) => [name, hash(stableStringify(fn()))])
    );

    expect(actualHashes).toEqual(EXPECTED_FUNCTION_HASHES);
  });

  it('preserves generated skill file content exactly', () => {
    // Intentionally excludes getFeedbackSkillTemplate: skillFactories only models templates
    // deployed via generateSkillContent, while feedback is covered in function payload parity.
    const skillFactories: Array<[string, () => SkillTemplate]> = [
      ['openspec-explore', getExploreSkillTemplate],
      ['openspec-new-change', getNewChangeSkillTemplate],
      ['openspec-continue-change', getContinueChangeSkillTemplate],
      ['openspec-apply-change', getApplyChangeSkillTemplate],
      ['openspec-ff-change', getFfChangeSkillTemplate],
      ['openspec-sync-specs', getSyncSpecsSkillTemplate],
      ['openspec-archive-change', getArchiveChangeSkillTemplate],
      ['openspec-bulk-archive-change', getBulkArchiveChangeSkillTemplate],
      ['openspec-verify-change', getVerifyChangeSkillTemplate],
      ['openspec-onboard', getOnboardSkillTemplate],
      ['openspec-propose', getOpsxProposeSkillTemplate],
      ['openspec-sdd', getSddSkillTemplate],
    ];

    const actualHashes = Object.fromEntries(
      skillFactories.map(([dirName, createTemplate]) => [
        dirName,
        hash(generateSkillContent(createTemplate(), 'PARITY-BASELINE')),
      ])
    );

    expect(actualHashes).toEqual(EXPECTED_GENERATED_SKILL_CONTENT_HASHES);
  });
});
