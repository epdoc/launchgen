import { assertEquals } from '@std/assert/equals';
import * as path from 'node:path';
import { LaunchGenerator } from './launchgen.ts';

async function setupTest(files: string[], config?: object, denoJson?: object) {
  const projectRoot = await Deno.makeTempDir();
  const vscodeDir = path.join(projectRoot, '.vscode');
  await Deno.mkdir(vscodeDir);

  if (denoJson) {
    const denoJsonPath = path.join(projectRoot, 'deno.json');
    await Deno.writeTextFile(denoJsonPath, JSON.stringify(denoJson));
  } else {
    const packageJsonPath = path.join(projectRoot, 'package.json');
    await Deno.writeTextFile(packageJsonPath, JSON.stringify({ workspaces: ['./'] }));
  }

  for (const file of files) {
    const filePath = path.join(projectRoot, file);
    await Deno.mkdir(path.dirname(filePath), { recursive: true });
    await Deno.writeTextFile(filePath, '// test file');
  }

  if (config) {
    const launchConfigPath = path.join(projectRoot, 'launch.config.json');
    await Deno.writeTextFile(launchConfigPath, JSON.stringify(config));
  }

  return projectRoot;
}

Deno.test('LaunchGenerator for Deno', async (t) => {
  const projectRoot = await setupTest(['my.test.ts'], undefined, { workspace: ['./'] });
  const vscodeDir = path.join(projectRoot, '.vscode');

  await t.step('should generate a Deno launch configuration', async () => {
    const generator = new LaunchGenerator(projectRoot);
    await generator.run();

    const launchJsonPath = path.join(vscodeDir, 'launch.json');
    const launchJsonContent = await Deno.readTextFile(launchJsonPath);
    const launchJson = JSON.parse(launchJsonContent);

    assertEquals(launchJson.configurations.length, 1);
    assertEquals(launchJson.configurations[0].name, 'Debug my.test.ts');
    assertEquals(launchJson.configurations[0].runtimeExecutable, 'deno');
    assertEquals(launchJson.configurations[0].env.LAUNCHGEN, 'true');
    assertEquals(launchJson.configurations[0].attachSimplePort, 9229);
    assertEquals(launchJson.configurations[0].console, 'integratedTerminal');
  });

  await t.step('should use custom port and console', async () => {
    const launchConfigPath = path.join(projectRoot, 'launch.config.json');
    await Deno.writeTextFile(launchConfigPath, JSON.stringify({ port: 9230, console: 'internalConsole' }));

    const generator = new LaunchGenerator(projectRoot);
    await generator.run();

    const launchJsonPath = path.join(vscodeDir, 'launch.json');
    const launchJsonContent = await Deno.readTextFile(launchJsonPath);
    const launchJson = JSON.parse(launchJsonContent);

    assertEquals(launchJson.configurations[0].attachSimplePort, 9230);
    assertEquals(launchJson.configurations[0].console, 'internalConsole');

    await Deno.remove(launchConfigPath);
  });
});

Deno.test('LaunchGenerator for Node', async (t) => {
  const projectRoot = await setupTest(['my.test.js']);
  const vscodeDir = path.join(projectRoot, '.vscode');

  await t.step('should generate a Node launch configuration', async () => {
    const generator = new LaunchGenerator(projectRoot);
    await generator.run();

    const launchJsonPath = path.join(vscodeDir, 'launch.json');
    const launchJsonContent = await Deno.readTextFile(launchJsonPath);
    const launchJson = JSON.parse(launchJsonContent);

    assertEquals(launchJson.configurations.length, 1);
    assertEquals(launchJson.configurations[0].name, 'Debug my.test.js');
    assertEquals(launchJson.configurations[0].runtimeExecutable, 'node');
    assertEquals(launchJson.configurations[0].env.LAUNCHGEN, 'true');
  });
});

Deno.test('LaunchGenerator with include/exclude', async (t) => {
  const denoJson = {
    tests: {
      include: ['src/**/*.ts'],
      exclude: ['src/ignore'],
    },
  };
  const projectRoot = await setupTest(
    [
      'src/my.test.ts',
      'src/ignore/ignore.test.ts',
      '.hidden/hidden.test.ts',
      'not_included/not_included.test.ts',
    ],
    undefined,
    denoJson,
  );
  const vscodeDir = path.join(projectRoot, '.vscode');

  await t.step('should only include specified files', async () => {
    const generator = new LaunchGenerator(projectRoot);
    await generator.run();

    const launchJsonPath = path.join(vscodeDir, 'launch.json');
    const launchJsonContent = await Deno.readTextFile(launchJsonPath);
    const launchJson = JSON.parse(launchJsonContent);

    assertEquals(launchJson.configurations.length, 1);
    assertEquals(launchJson.configurations[0].name, 'Debug src/my.test.ts');
  });
});

Deno.test('LaunchGenerator with custom runtime args', async (t) => {
  const projectRoot = await setupTest(['my.test.ts'], { tests: { runtimeArgs: ['--check'] } }, { workspace: ['./'] });
  const vscodeDir = path.join(projectRoot, '.vscode');
  const testFilePath = path.join(projectRoot, 'my.test.ts');

  await t.step('should add custom runtime args', async () => {
    const generator = new LaunchGenerator(projectRoot);
    await generator.run();

    const launchJsonPath = path.join(vscodeDir, 'launch.json');
    const launchJsonContent = await Deno.readTextFile(launchJsonPath);
    const launchJson = JSON.parse(launchJsonContent);

    assertEquals(launchJson.configurations.length, 1);
    assertEquals(launchJson.configurations[0].runtimeArgs, ['test', '--inspect-brk', '-A', testFilePath, '--check']);
  });
});

Deno.test('LaunchGenerator with duplicate runtime args', async (t) => {
  const projectRoot = await setupTest(['my.test.ts'], { tests: { runtimeArgs: ['-A'] } }, { workspace: ['./'] });

  await t.step('should inform user of duplicate runtime args', async () => {
    const generator = new LaunchGenerator(projectRoot);
    const consoleLog: string[] = [];
    const originalLog = console.log;
    console.log = (...args) => {
      consoleLog.push(args.join(' '));
    };

    await generator.run();

    console.log = originalLog;

    assertEquals(
      consoleLog.some((line) => line.includes('Info: runtimeArg "-A" is already in the default list')),
      true,
    );
  });
});

Deno.test('LaunchGenerator with workspace glob', async (t) => {
  const denoJson = {
    workspace: ['packages/*'],
  };
  const projectRoot = await setupTest(
    [],
    undefined,
    denoJson,
  );
  const vscodeDir = path.join(projectRoot, '.vscode');

  // Create workspace directories
  const workspace1 = path.join(projectRoot, 'packages', 'workspace1');
  await Deno.mkdir(workspace1, { recursive: true });
  await Deno.writeTextFile(path.join(workspace1, 'deno.json'), '{\n  "name": "workspace1"\n}');
  await Deno.writeTextFile(path.join(workspace1, 'my.test.ts'), '// test file');

  const workspace2 = path.join(projectRoot, 'packages', 'workspace2');
  await Deno.mkdir(workspace2, { recursive: true });
  await Deno.writeTextFile(path.join(workspace2, 'deno.json'), '{\n  "name": "workspace2"\n}');
  await Deno.writeTextFile(path.join(workspace2, 'my.test.ts'), '// test file');

  // This workspace should be ignored because it does not contain a deno.json file
  const workspace3 = path.join(projectRoot, 'packages', 'workspace3');
  await Deno.mkdir(workspace3, { recursive: true });
  await Deno.writeTextFile(path.join(workspace3, 'my.test.ts'), '// test file');

  await t.step('should discover workspaces from glob', async () => {
    const generator = new LaunchGenerator(projectRoot);
    await generator.run();

    const launchJsonPath = path.join(vscodeDir, 'launch.json');
    const launchJsonContent = await Deno.readTextFile(launchJsonPath);
    const launchJson = JSON.parse(launchJsonContent);

    assertEquals(launchJson.configurations.length, 2);
    assertEquals(launchJson.configurations[0].name, 'Debug packages/workspace1/my.test.ts');
    assertEquals(launchJson.configurations[1].name, 'Debug packages/workspace2/my.test.ts');
  });
});

Deno.test('LaunchGenerator with workspace glob', async (t) => {
  const denoJson = {
    workspace: ['packages/*'],
  };
  const projectRoot = await setupTest(
    [],
    undefined,
    denoJson,
  );
  const vscodeDir = path.join(projectRoot, '.vscode');

  // Create workspace directories
  const workspace1 = path.join(projectRoot, 'packages', 'workspace1');
  await Deno.mkdir(workspace1, { recursive: true });
  await Deno.writeTextFile(path.join(workspace1, 'deno.json'), '{\n  "name": "workspace1"\n}');
  await Deno.writeTextFile(path.join(workspace1, 'my.test.ts'), '// test file');

  const workspace2 = path.join(projectRoot, 'packages', 'workspace2');
  await Deno.mkdir(workspace2, { recursive: true });
  await Deno.writeTextFile(path.join(workspace2, 'deno.json'), '{\n  "name": "workspace2"\n}');
  await Deno.writeTextFile(path.join(workspace2, 'my.test.ts'), '// test file');

  // This workspace should be ignored because it does not contain a deno.json file
  const workspace3 = path.join(projectRoot, 'packages', 'workspace3');
  await Deno.mkdir(workspace3, { recursive: true });
  await Deno.writeTextFile(path.join(workspace3, 'my.test.ts'), '// test file');

  await t.step('should discover workspaces from glob', async () => {
    const generator = new LaunchGenerator(projectRoot);
    await generator.run();

    const launchJsonPath = path.join(vscodeDir, 'launch.json');
    const launchJsonContent = await Deno.readTextFile(launchJsonPath);
    const launchJson = JSON.parse(launchJsonContent);

    assertEquals(launchJson.configurations.length, 2);
    assertEquals(launchJson.configurations[0].name, 'Debug packages/workspace1/my.test.ts');
    assertEquals(launchJson.configurations[1].name, 'Debug packages/workspace2/my.test.ts');
  });
});
