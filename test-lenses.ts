import { LENSES, validateDocumentAgainstLens } from './src/core/sdd/lenses.js';
import { TEMPLATE_1_SPEC_MD, TEMPLATE_2_PLAN_MD } from './src/core/sdd/default-bootstrap-files.js';

console.log("Validating TEMPLATE_1_SPEC_MD:");
console.log(validateDocumentAgainstLens(TEMPLATE_1_SPEC_MD, LENSES.feature_spec));

console.log("\nValidating TEMPLATE_2_PLAN_MD:");
console.log(validateDocumentAgainstLens(TEMPLATE_2_PLAN_MD, LENSES.feature_plan));
