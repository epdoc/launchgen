#!/usr/bin/env -S deno run -RWES
import { gray, green, red, white } from 'jsr:@std/fmt/colors';
import * as dfs from 'jsr:@std/fs';
import os from 'node:os';
import path from 'node:path';

console.log(green('Executing launchgen.ts'));

/**
 * Constants
 */

const HOME = os.userInfo().homedir;
const VSCODE = '.vscode';
const LAUNCH_DEFAULT: LaunchSpec = { version: '0.2.0', configurations: [] };
const LAUNCH_CONFIG = 'launch.config.json';

const template: LaunchSpecConfig = {
  type: 'node',
  request: 'launch',
  name: 'Debug tests',
  cwd: '${workspaceFolder}',
  env: { UNIT_TEST: '1' },
  runtimeExecutable: `${HOME}/.deno/bin/deno`,
  runtimeArgs: ['test', '--inspect-brk', '-A'],
  attachSimplePort: 9229,
};

/**
 * Type Declarations
 */

type Dict = { [key: string]: unknown };

type ConfigGeneric = Record<string, number | string | string[] | Record<string, string>>;
type LaunchSpecConfig = ConfigGeneric & {
  type: string;
  request: 'launch';
  name?: string;
  cwd?: string;
  env?: { UNIT_TEST?: '1' };
  runtimeExecutable?: string;
  runtimeArgs?: string[];
  attachSimplePort: number;
};

type LaunchSpec = {
  version: string;
  configurations: LaunchSpecConfig[];
};

type LaunchConfig = {
  groups?: LaunchConfigGroup[];
};

type LaunchConfigGroup = {
  program: string;
  runtimeArgs: string[];
  scriptArgs?: string;
  scripts: (string | string[])[];
};

/**
 * Main code
 */

const projectRoot: string | undefined = await findRoot(Deno.cwd());
if (!projectRoot) {
  console.error(red('Project root folder not found'));
  console.log(green('Your project folder must contain a'), VSCODE, green('folder.'));
  console.log(white('Exit'));
  Deno.exit(1);
}
console.log(green('Project root:'), projectRoot);

const denoFile = path.resolve(projectRoot, 'deno.json');
const launchfile = path.resolve(projectRoot, '.vscode', 'launch.json');
const configfile = path.resolve(projectRoot, LAUNCH_CONFIG);

// Read deno.json
const data0 = await Deno.readTextFile(denoFile);
const pkg = JSON.parse(data0);

// Read launch.json. This may contain entries that we do not want to delete.
let launchCode: LaunchSpec = LAUNCH_DEFAULT;
try {
  const data1 = await Deno.readTextFile(launchfile);
  launchCode = JSON.parse(data1);
} catch (_err) {
  launchCode = LAUNCH_DEFAULT;
}

// Read launch_config.json
let launchConfig: LaunchConfig = {};
try {
  const config = await Deno.readTextFile(configfile);
  launchConfig = JSON.parse(config);
} catch (_err) {
  launchConfig = {};
}

// Any entries in launch.json that were not auto-generated should be retained
launchCode.configurations = launchCode.configurations.filter((item: LaunchSpecConfig) => {
  return !isGenerated(item);
});
console.log(
  green('Retaining'),
  white(String(launchCode.configurations.length)),
  green('configurations from existing launch.json')
);
launchCode.configurations.forEach((config: LaunchSpecConfig) => {
  console.log(green('  Retaining'), config.name);
});

// Add launch scripts for all local test and run files
const additions: dfs.WalkEntry[] = [];
if (Array.isArray(pkg.workspace)) {
  await Promise.all(
    pkg.workspace.map(async (scope: string) => {
      for await (const entry of dfs.walk(path.resolve(projectRoot, scope), {
        match: [/(test|run)\.ts$/],
      })) {
        entry.name = `${scope}/${entry.name}`;
        additions.push(entry);
      }
    })
  );
} else {
  for await (const entry of dfs.walk(path.resolve(projectRoot), {
    match: [/(test|run)\.ts$/],
  })) {
    entry.name = `${entry.name}`;
    additions.push(entry);
  }
}

console.log(green('Adding'), white(String(additions.length)), green('test files'));
additions.forEach((entry: dfs.WalkEntry) => {
  addTest(entry);
});

// Add entries for all custom entries in launchConfig
const configAdditions: LaunchSpecConfig[] = [];
if (Array.isArray(launchConfig.groups)) {
  launchConfig.groups.forEach((group: LaunchConfigGroup) => {
    if (!group.scripts || group.scripts.length === 0) {
      group.scripts = [''];
    }
    group.scripts.forEach((script: string | string[]) => {
      const name = Array.isArray(script) ? script.join(' ') : script;
      const entry: LaunchSpecConfig = {
        type: 'node',
        request: 'launch',
        name: `Debug ${group.program} ${name}`,
        // skipFiles: ['<node_internals>/**'],
        program: '${workspaceFolder}/' + group.program,
        cwd: '${workspaceFolder}',
        env: { UNIT_TEST: '1' },
        runtimeExecutable: `${HOME}/.deno/bin/deno`,
        runtimeArgs: group.runtimeArgs,
        // .concat('--config', '/Users/jpravetz/dev/epdoc/fincp/config/project.settings.json'),
        attachSimplePort: 9229,
      };
      const argLog = Array.isArray(group.scriptArgs) ? group.scriptArgs : [];
      if (Array.isArray(script)) {
        entry.args = [...argLog, ...script];
      } else {
        entry.args = [...argLog, ...script.split(/\s+/)];
      }
      configAdditions.push(entry);
    });
  });
}

console.log(green('Adding'), white(String(configAdditions.length)), green(`from ${LAUNCH_CONFIG}`));
configAdditions.forEach((entry: LaunchSpecConfig) => {
  console.log(green('  Adding'), entry.name);
  launchCode.configurations.push(entry);
});

Deno.writeTextFileSync(launchfile, JSON.stringify(launchCode, null, 2));
console.log(green('Updated'), launchfile);

function addTest(entry: dfs.WalkEntry) {
  if (entry.isFile && (entry.name.endsWith('test.ts') || entry.name.endsWith('run.ts'))) {
    console.log(green('  Adding'), name, entry.name, gray(entry.path));
    const item = Object.assign({}, template, { name: `Debug ${entry.name}` });
    item.runtimeArgs = [];
    if (Array.isArray(template.runtimeArgs)) {
      template.runtimeArgs.forEach((arg) => {
        item.runtimeArgs!.push(arg);
      });
    }
    Deno.args.forEach((arg) => {
      item.runtimeArgs!.push(arg);
    });
    item.runtimeArgs.push(entry.path);
    launchCode.configurations.push(item as never);
  }
}

async function findRoot(cwd: string, levels: number = 2): Promise<string | undefined> {
  try {
    const root = path.resolve(cwd, VSCODE);
    const fileInfo = await Deno.lstat(root);
    if (fileInfo.isDirectory) {
      return cwd;
    }
  } catch (_err) {
    if (levels > 0) {
      return findRoot(path.resolve(cwd, '..'), levels - 1);
    }
    return undefined;
  }
}

function isGenerated(config: LaunchSpecConfig): boolean {
  return config && config.env && config.env['UNIT_TEST'] ? true : false;
}
