const path = require("path")

module.exports = {
    mode: "production",
    target: 'node',
    entry: "./src/index.ts",
    output: {
        filename: "bundle.js",
        path: path.resolve(__dirname, "build"),
        publicPath: "/",
    },
    resolve: {
        // Add '.ts' and '.tsx' as resolvable extensions.
        extensions: [".ts", ".tsx", ".js"],
    },
    module: {
        rules: [
            {
                test: /\.ts(x?)$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: "ts-loader",
                    },
                ],
            },
        ],
    },
    externals: {
        "express": "require('express')",
        "body-parser": "require('body-parser')",
        "cors": "require('cors')",
        "firebase-admin": "require('firebase-admin')",
        "@google-cloud/logging": "require('@google-cloud/logging')",
        "@google-cloud/error-reporting": "require('@google-cloud/error-reporting')"
    }
}
