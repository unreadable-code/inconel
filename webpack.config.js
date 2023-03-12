"use strict";

const {newConfigBuilder} = require("webpack-config-builder");
const path = require("path");

const pathBuild = path.resolve(__dirname, "build");

const externals = {
    react: "React",
};

module.exports = newConfigBuilder()
    .withReact()
    .withExternals(externals)
    .withExternals({
        react: {          
            commonjs: "react",          
            commonjs2: "react",          
            amd: "React",
            root: "React",
        },
    })
    .asLibrary("umd", "inconel")
    .compile("web", "./src/index.ts", pathBuild, "inconel.js");
