"use strict";

const path = require("path");
const {from} = require("webpack-config-builder");

const pathBuild = path.resolve(__dirname, "build");

const externals = {
    react: "React",
};

module.exports = [
    from("./src/index.ts")
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
        .to("web", pathBuild, "inconel.js")
        .build(),
];