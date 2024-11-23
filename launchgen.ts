#!/usr/bin/env -S deno run -RWES
import { gray, green, red, white } from 'jsr:@std/fmt/colors';
import * as dfs from 'jsr:@std/fs';
import os from 'node:os';
import path from 'node:path';

console.log(green('Executing launchgen.ts'));

const HOME = os.userInfo().homedir;
const VSCODE = '.vscode';
const LAUNCH_DEFAULT = { version: '0.2.0', configurations: [] };

type LaunchConfig = Dict & {
  request: 'launch';
  env: Dict;
  runtimeArgs: string[];
};

const template: LaunchConfig = {
  request: 'launch',
  name: 'Debug tests',
  type: 'node',
  cwd: '${workspaceFolder}',
  env: { UNIT_TEST: '1' },
  runtimeExecutable: `${HOME}/.deno/bin/deno`,
  runtimeArgs: ['test', '--inspect-brk'],
  attachSimplePort: 9229,
};

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

// Read deno.json
const data0 = await Deno.readTextFile(denoFile);
const pkg = JSON.parse(data0);

let launchCode = LAUNCH_DEFAULT;

// Read launch.json
try {
  const data1 = await Deno.readTextFile(launchfile);
  launchCode = JSON.parse(data1);
} catch (_err) {
  launchCode = LAUNCH_DEFAULT;
}
launchCode.configurations = launchCode.configurations.filter((item) => {
  return !isGenerated(item);
});
console.log(
  green('Retaining'),
  white(String(launchCode.configurations.length)),
  green('configurations from existing launch.json')
);

if (Array.isArray(pkg.workspace)) {
  await Promise.all(
    pkg.workspace.map(async (scope: string) => {
      for await (const entry of dfs.walk(path.resolve(projectRoot, scope), {
        match: [/test\.ts$/],
      })) {
        entry.name = `${scope}/${entry.name}`;
        addTest(entry);
      }
    })
  );
} else {
  for await (const entry of Deno.readDir(path.resolve(projectRoot))) {
    (entry as dfs.WalkEntry).path = path.resolve(projectRoot, entry.name);
    addTest(entry as dfs.WalkEntry);
  }
}

Deno.writeTextFileSync(launchfile, JSON.stringify(launchCode, null, 2));
console.log(green('Updated'), launchfile);

function addTest(entry: dfs.WalkEntry) {
  if (entry.isFile && entry.name.endsWith('test.ts')) {
    console.log(green('  Adding'), name, entry.name, gray(entry.path));
    const item = Object.assign({}, template, { name: `Debug ${entry.name}` });
    item.runtimeArgs = [];
    template.runtimeArgs.forEach((arg) => {
      item.runtimeArgs.push(arg);
    });
    Deno.args.forEach((arg) => {
      item.runtimeArgs.push(arg);
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

function isGenerated(config: LaunchConfig): boolean {
  return config && config.env && config.env['UNIT_TEST'] ? true : false;
}

export type Dict = { [key: string]: unknown };

// function isDict(val: unknown): val is Dict {
//   if (!isObject(val)) {
//     return false;
//   }
//   return true;
// }

// function isObject(val: unknown): val is object {
//   return (
//     hasValue(val) &&
//     typeof val === 'object' &&
//     !Array.isArray(val) &&
//     !(val instanceof Date) &&
//     !(val instanceof RegExp)
//   );
// }

// export function hasValue(val: unknown): boolean {
//   return val !== null && val !== undefined;
// }
