# @epdoc/launchgen

Generate or update a `launch.json` file for use with VSCode.

Execute from within your project folder. 

- Walks the project folder and adds configurations for each test file found. 
- Adds a launch configurations for each configuration found in `launch.config.json`.
- Supports monorepos.

Any files ending with `test.ts` or `.run.ts` will be added to `launch.json`.

## Requirements

- Deno 2.1.1 or later

## Usage

```ts
cd MYFOLDER
git clone git@github.com:epdoc/launchgen.git
export PATH=$PATH:MYFOLDER/launchgen.ts
launchgen.ts -RW
```

Or

```ts
deno run -RWES launchgen.ts -RW
```

## Options

Arguments are passed to the generated launch configurations. In the above examples, the `-RW` argument is passed to the
deno test command.

Additional tests may be specified by adding a `launch.config.json` file to your project root folder. This can be used to
add commands for command line programs.

## launch.config.json

This example will result in entries for `finsync.ts -TA`, `finsync.ts -TA -h`, `finsync.ts -TA --log trace`, etc..

**Contents of `launch.config.json`:**

```json
{
  "groups": [
    {
      "program": "finsync.ts",
      "runtimeArgs": ["run", "--inspect-wait", "--allow-all"],
      "scriptArgs": "-TA",
      "scripts": [
        "",
        "-h",
        "--log trace",
        "-f",
        "-fa",
        "-a",
        "-e",
        "-feu",
        "--clean"
      ]
    }
  ]
}
```

**Resultant entries in `.vscode/launch.json`:**

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug main.ts ",
      "program": "${workspaceFolder}/main.ts",
      "cwd": "${workspaceFolder}",
      "env": {
        "UNIT_TEST": "1"
      },
      "runtimeExecutable": "/Users/jpravetz/.deno/bin/deno",
      "runtimeArgs": [
        "run",
        "--inspect-wait",
        "--allow-all",
        "--unstable-kv"
      ],
      "attachSimplePort": 9229,
      "args": [
        ""
      ]
    },
    {
      "type": "node",
      "request": "launch",
      "name": "Debug main.ts -h",
      "program": "${workspaceFolder}/main.ts",
      "cwd": "${workspaceFolder}",
      "env": {
        "UNIT_TEST": "1"
      },
      "runtimeExecutable": "/Users/jpravetz/.deno/bin/deno",
      "runtimeArgs": [
        "run",
        "--inspect-wait",
        "--allow-all",
        "--unstable-kv"
      ],
      "attachSimplePort": 9229,
      "args": [
        "-h"
      ]
    },
    {
      "type": "node",
      "request": "launch",
      "name": "Debug main.ts --log trace",
      "program": "${workspaceFolder}/main.ts",
      "cwd": "${workspaceFolder}",
      "env": {
        "UNIT_TEST": "1"
      },
      "runtimeExecutable": "/Users/jpravetz/.deno/bin/deno",
      "runtimeArgs": [
        "run",
        "--inspect-wait",
        "--allow-all",
        "--unstable-kv"
      ],
      "attachSimplePort": 9229,
      "args": [
        "--log",
        "trace"
      ]
    },
```

## Notes

- The project root is found by searching for a `.vscode` folder.

- The generated `launch.json` file is placed in the `.vscode` folder.

- If the `launch.json` file already exists, it will be updated to add new configurations.

- The generated configurations will have a `UNIT_TEST` environment variable set to 1. Any entry that does not have this
  set is assumed to have been manually created and will not be modified.

- Consider adding the path to the `launchgen.ts` executable to your `PATH` environment variable, or creating a symlink
  to `launchgen.ts`.

## License

MIT
