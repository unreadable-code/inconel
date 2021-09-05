"use strict";

const path = require("path");
const {newConfigBuilder} = require("webpack-config-builder");

const pathBuild = path.resolve(__dirname, "build");

const externals = {
    react: "React",
};

module.exports = [
    newConfigBuilder()
        .withReact()
        .withExternals(externals)
        .asLibrary("umd", "inconel")
        .withExternals({
            react: {          
                commonjs: "react",          
                commonjs2: "react",          
                amd: "React",
                root: "React",
            },
        })
        .compile("web", "./src/index.ts", pathBuild, "inconel.js"),
];