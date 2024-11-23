# @epdoc/launchgen

Generate a launch.json file for use with VSCode.

Execute from within your project folder. Walks the project folder and adds configurations for each test file found.
Supports monorepos.

## Usage

```
deno run -RWES launchgen.ts -RW
```

Or add launchgen.ts to your path and run it directly.

```
launchgen.ts -RW
```

## Options

Arguments are passed to the generated launch configurations. In the above examples, the `-RW` argument is passed to the
deno test command.

## Notes

- The project root is found by searching for a .vscode folder.

- The generated launch.json file is placed in the .vscode folder.

- If the launch.json file already exists, it will be updated to add new configurations.

- The generated configurations have a UNIT_TEST environment variable set to 1, and only these configurations will be
  updated.

## License

MIT