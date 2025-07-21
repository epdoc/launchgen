# Gemini Instructions

## Code Generation

### TypeScript

- Do not use the type 'any'. Instead use 'unknown'.
- Do not use switch statements.
- Do not add dependencies if it can be avoided, and reference all dependencies directly from `launchgen.ts` rather than
  adding them to `deno.json`.

## Code commenting

## JSDoc Commenting Guidelines (for TypeScript)

When generating or modifying TypeScript code, please adhere to the following JSDoc commenting standards:

1. **Purpose**: JSDoc comments improve code clarity, provide IDE IntelliSense, and support automated API documentation.
2. **Placement**: Use `/** ... */` block comments directly above the code element being documented.
3. **Required Documentation**:
   - All exported functions, classes, methods, and complex type definitions (interfaces, type aliases).
   - Internal helper functions if their logic is not immediately obvious.
   - File overview, only if the file is not a single class that is already sufficiently documented
4. **Content**:
   - Start with a concise summary sentence.
   - Follow with a more detailed explanation if necessary (complex logic, edge cases, context).
5. **Common JSDoc Tags**:
   - `@param {Type} [name] - Description.`: For function/method parameters. Use brackets `[]` for optional parameters
     and specify default values if applicable (e.g., `[name='default']`).
   - `@returns {Type} - Description.`: For what a function/method returns. Omit for `void` or `Promise<void>` returns.
   - `@example <caption>Optional Caption</caption>\nCode example here.`: Provide small, runnable code snippets.
   - `@throws {ErrorType} - Description.`: Document potential errors or exceptions.
   - `@deprecated [reason and/or alternative]`: Indicate deprecated elements.
   - `@see {@link otherFunction}` or `@see URL`: Link to related functions or external resources.
   - `{@link targetCode|displayText}`: For inline links within descriptions.
6. **Class-Specific Tags**:
   - `@extends {BaseClass}`: If the class extends another.
   - `@template T`: For generic classes, define type parameters.
7. **Method-Specifics**: Document all `public` and `protected` methods. `private` methods only if their logic isn't
   obvious.
8. **Consistency**: Ensure consistent style and tag usage throughout the code.
9. **Accuracy**: Comments must be kept up-to-date with code changes. Inaccurate comments are worse than no comments.
10. **Conciseness**: Avoid redundant comments that simply restate obvious code. Focus on the "why" and the API contract.

## Commit Messages

If generating commit messages, only use the work 'refactor' when a significant change has been made to how code is
organized or a class is implemented. Instead use the word 'modified' when changes are made.
