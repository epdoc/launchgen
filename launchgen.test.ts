import { assertEquals } from 'jsr:@std/assert/equals';
import { LaunchGenerator } from './launchgen.ts';
import * as path from 'node:path';

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
  const projectRoot = await setupTest([
    'src/my.test.ts',
    'src/ignore/ignore.test.ts',
    '.hidden/hidden.test.ts',
    'not_included/not_included.test.ts',
  ], undefined, denoJson);
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