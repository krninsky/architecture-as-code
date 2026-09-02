import { selectChoices, type CalmChoice } from './components/options.js';
import { instantiate } from './components/instantiate';
import { flattenAllOf } from './components/flatten-allof';
import { SchemaDirectory } from '../../schema-directory.js';

export { instantiate } from './components/instantiate';
export { flattenAllOf } from './components/flatten-allof';
export { selectChoices, extractOptions } from './components/options.js';
export type { CalmChoice, CalmOption } from './components/options.js';
export { SchemaDirectory } from '../../schema-directory.js';

/**
 * Run the CALM generate pipeline in memory (no filesystem write).
 * Same flatten → optional selectChoices → instantiate steps as `runGenerate`.
 */
export async function generateArchitecture(
    pattern: object,
    debug: boolean,
    schemaDirectory: SchemaDirectory,
    chosenChoices?: CalmChoice[]
): Promise<unknown> {
    await schemaDirectory.loadSchemas();
    let flattenedPattern = await flattenAllOf(
        pattern as Record<string, unknown>,
        schemaDirectory,
        debug
    );

    if (chosenChoices) {
        flattenedPattern = selectChoices(flattenedPattern, chosenChoices, debug);
    }

    return instantiate(flattenedPattern, debug, schemaDirectory);
}
