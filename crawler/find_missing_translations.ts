import { findMissingFiles } from "./src/find_missing_texts";

const missingFiles = findMissingFiles()
for (const missingFile of missingFiles) {
    for (const missingTranslation of missingFile.missingTranslations) {
        console.warn(`No translation defined for data with id ${missingTranslation.id} (looking for "${missingTranslation.prefix}") ${missingTranslation.ref}`)
    }
}

process.exit(missingFiles.length)