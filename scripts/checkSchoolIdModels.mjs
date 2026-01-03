import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const defaultSchemaPath = '/home/yosuf/Pictures/School/prisma/schema.prisma';
const [schemaArg, ...rawFlags] = process.argv.slice(2);

const flags = rawFlags.reduce((acc, current) => {
  const [key, value] = current.split('=');
  if (key && value) {
    acc[key.replace(/^--/, '')] = value;
  } else if (key?.startsWith('--')) {
    acc[key.replace(/^--/, '')] = true;
  }
  return acc;
}, {});

const ignoredModels = new Set(
  (flags.ignore ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean),
);

const schemaPath = schemaArg
  ? path.resolve(schemaArg)
  : path.resolve(defaultSchemaPath);

if (!fs.existsSync(schemaPath)) {
  console.error(`Schema file not found at ${schemaPath}`);
  process.exitCode = 1;
  process.exit();
}

const schemaContent = fs.readFileSync(schemaPath, 'utf8');

const modelPattern = /model\s+(\w+)\s*\{/g;

const models = [];
let match;

while ((match = modelPattern.exec(schemaContent)) !== null) {
  const [matchedText, modelName] = match;
  let cursor = match.index + matchedText.length;
  let braceDepth = 1;

  while (cursor < schemaContent.length && braceDepth > 0) {
    const character = schemaContent[cursor];
    if (character === '{') {
      braceDepth += 1;
    } else if (character === '}') {
      braceDepth -= 1;
    }
    cursor += 1;
  }

  const body = schemaContent.slice(match.index + matchedText.length, cursor - 1);
  models.push({ name: modelName, body });
}

const analyzeModel = ({ name, body }) => {
  const bodyLines = body
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('//'));

  const hasSchoolIdField = bodyLines.some((line) =>
    /^schoolId\s+/.test(line),
  );

  const hasSchoolRelation = bodyLines.some((line) =>
    /^school\s+School\??\s+@relation/.test(line),
  );

  const hasSchoolIdIndex = /@@index\(\s*\[[^\]]*\bschoolId\b/.test(body);

  return {
    name,
    hasSchoolIdField,
    hasSchoolRelation,
    hasSchoolIdIndex,
  };
};

const results = models
  .filter(({ name }) => !ignoredModels.has(name))
  .map(analyzeModel);

const offenders = results.filter(
  ({ hasSchoolIdField, hasSchoolRelation, hasSchoolIdIndex }) =>
    !hasSchoolIdField || !hasSchoolRelation || !hasSchoolIdIndex,
);

if (offenders.length === 0) {
  console.log('✅ All models include the schoolId field, school relation, and schoolId index.');
  process.exit();
}

console.log('⚠️ Models missing schoolId requirements:');
for (const offender of offenders) {
  const missing = [];
  if (!offender.hasSchoolIdField) missing.push('field');
  if (!offender.hasSchoolRelation) missing.push('relation');
  if (!offender.hasSchoolIdIndex) missing.push('index');
  console.log(`- ${offender.name}: missing ${missing.join(', ')}`);
}

if (ignoredModels.size > 0) {
  console.log(
    `\nℹ️ Ignored models: ${Array.from(ignoredModels).join(', ')}`,
  );
}

