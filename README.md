# @epdoc/launchgen

Generate or update a `launch.json` file for use with VSCode.

Execute from within your project folder. Walks the project folder and adds configurations for each test file found.
Supports monorepos.

## Requirements

- Deno 2.1.1 or later

## Usage

```ts
cd MYFOLDER
git clone git@github.com:epdoc/launchgen.git
export PATH=$PATH:MYFOLDER/launchgen
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

This example will result in entries for `finsync.ts`, `finsync.ts -h`, `finsync.ts --log trace`, etc..

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
