import { findMissingFiles } from "./src/find_missing_texts";

const missingFiles = findMissingFiles();
const uniqueKeys = new Set<string>();

for (const missingFile of missingFiles) {
    for (const missingTranslation of missingFile.missingTranslations) {
        // console.warn(`No translation defined for data with id ${missingTranslation.id} (looking for "${missingTranslation.prefix}") ${missingTranslation.ref}`)
        if (missingTranslation.key !== null && !uniqueKeys.has(missingTranslation.key)) {
            uniqueKeys.add(missingTranslation.key);
            console.warn(`"${missingTranslation.key}": "",`);
        }
    }
}

process.exit(missingFiles.length)