import { ncp } from 'ncp';
import { join } from 'path';

const outDir = 'dist';

async function main() {
  ncp(
    join(__dirname, '../../src'),
    outDir,
    { filter: (name) => !name.endsWith('.ts') },
    (err) => {
      if (err) console.error('build failed');
    },
  );
}

main();
