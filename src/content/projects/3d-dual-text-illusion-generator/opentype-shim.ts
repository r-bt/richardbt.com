// opentype.js's ES build refers to a CommonJS `exports` global that doesn't
// exist in browsers or workers. Defining one before it loads avoids the crash.
// Import this before opentype.js; imports run in order.
(globalThis as { exports?: object }).exports ??= {};
