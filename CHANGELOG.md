### Version 0.7.0 Changes

- **Custom Runtime Arguments:** You can now add custom runtime arguments to all auto-discovered test files by adding a `tests.runtimeArgs` property to your `launch.config.json` file. These arguments are appended to the default runtime arguments.
- **Improved Documentation:** The `README.md` has been updated to clarify the use of `deno.json` and `launch.config.json`, and to provide a clearer explanation of how launch configurations are generated.
- **Enhanced Unit Tests:** The unit tests have been refactored for better clarity and maintainability, and a new test has been added to verify the custom runtime arguments functionality.

### Version 0.6.0 Changes

- **Test File Filtering:** You can now control which files are included and excluded from the test search by adding a
  `tests` object to your `deno.json` file. See the `README.md` for more details.
- **Hidden File Exclusion:** By default, all hidden files and directories (those starting with a `.`) are now excluded
  from the test search.

### Version 0.5.0 Changes

This release introduces significant improvements to `launchgen.ts` for enhanced flexibility, maintainability, and
usability.

**Key Changes for Users:**

- **Generated Configuration Identification:** Generated `launch.json` configurations are now identified by the presence
  of an environment variable `LAUNCHGEN: "true"`.
- **`launch.config.json` Enhancements:**
  - You can now specify a global `port` (default: `9229`) and `console` type (default: `integratedTerminal`) directly in
    your `launch.config.json` file.
- **Automatic Runtime Detection:** The script now automatically detects whether your project is Deno or Node.js based on
  `deno.json` or `package.json`, generating appropriate launch configurations.
- **Improved Usage:** The `README.md` has been updated with clearer instructions for direct execution (using the
  shebang) and for importing `launchgen.ts` as a module in other scripts.

**Internal Changes (for developers extending `launchgen`):**

- The script has been refactored into an object-oriented `LaunchGenerator` class. Key methods are now `protected`,
  allowing for easier extension and customization via subclassing.