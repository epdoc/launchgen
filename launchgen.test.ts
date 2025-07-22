import { assertEquals } from 'jsr:@std/assert/equals';
import { LaunchGenerator } from './launchgen.ts';
import * as path from 'node:path';

Deno.test('LaunchGenerator for Deno', async (t) => {
  const projectRoot = await Deno.makeTempDir();
  const vscodeDir = path.join(projectRoot, '.vscode');
  await Deno.mkdir(vscodeDir);

  const denoJsonPath = path.join(projectRoot, 'deno.json');
  await Deno.writeTextFile(denoJsonPath, JSON.stringify({ workspace: ['./'] }));

  const testFilePath = path.join(projectRoot, 'my.test.ts');
  await Deno.writeTextFile(testFilePath, '// test file');

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
  const projectRoot = await Deno.makeTempDir();
  const vscodeDir = path.join(projectRoot, '.vscode');
  await Deno.mkdir(vscodeDir);

  const packageJsonPath = path.join(projectRoot, 'package.json');
  await Deno.writeTextFile(packageJsonPath, JSON.stringify({ workspaces: ['./'] }));

  const testFilePath = path.join(projectRoot, 'my.test.js');
  await Deno.writeTextFile(testFilePath, '// test file');

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
  const projectRoot = await Deno.makeTempDir();
  const vscodeDir = path.join(projectRoot, '.vscode');
  await Deno.mkdir(vscodeDir);

  const denoJson = {
    tests: {
      include: ['src'],
      exclude: ['src/ignore'],
    },
  };
  const denoJsonPath = path.join(projectRoot, 'deno.json');
  await Deno.writeTextFile(denoJsonPath, JSON.stringify(denoJson));

  // Create files and directories
  const srcDir = path.join(projectRoot, 'src');
  await Deno.mkdir(srcDir);
  const ignoreDir = path.join(srcDir, 'ignore');
  await Deno.mkdir(ignoreDir);
  const hiddenDir = path.join(projectRoot, '.hidden');
  await Deno.mkdir(hiddenDir);
  const notIncludedDir = path.join(projectRoot, 'not_included');
  await Deno.mkdir(notIncludedDir);

  // Create test files
  await Deno.writeTextFile(path.join(srcDir, 'my.test.ts'), '// test');
  await Deno.writeTextFile(path.join(ignoreDir, 'ignore.test.ts'), '// test');
  await Deno.writeTextFile(path.join(hiddenDir, 'hidden.test.ts'), '// test');
  await Deno.writeTextFile(path.join(notIncludedDir, 'not_included.test.ts'), '// test');

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