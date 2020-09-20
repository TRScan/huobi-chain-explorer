#!/usr/bin/env node
require('@muta-extra/hermit-purple').loadEnvFile();

import { Options, typescriptOfSchema } from '@homura/schemats';
import { envStr } from '@muta-extra/hermit-purple';
import { writeFileSync } from 'fs';
import { join } from 'path';

class PreventReservedWordsOptions extends Options {
  transformColumnName(columnName: string): string {
    columnName = columnName.startsWith('f_')
      ? columnName.substring(2)
      : columnName;
    return super.transformColumnName(columnName);
  }

  transformTypeName(typename: string): string {
    typename = typename.startsWith('t_') ? typename.substring(2) : typename;
    return super.transformTypeName(typename);
  }
}

async function main() {
  const connection = envStr('HERMIT_DATABASE_URL', '');

  if (!connection)
    throw new Error(
      'HERMIT_DATABASE_URL is required, try to config it to environment variable',
    );

  const schema = await typescriptOfSchema(
    connection,
    undefined,
    undefined,
    new PreventReservedWordsOptions({ camelCase: true, writeHeader: false }),
  );
  writeFileSync(
    join(__dirname, '../generated/types.ts'),
    `// AUTO-GENERATED FILE - DO NOT EDIT! \n// @ts-nocheck \n${schema}`,
  );
  process.exit(0);
}

main();
