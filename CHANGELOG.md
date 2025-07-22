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
