// production config
const { resolve } = require("path")
const TerserJSPlugin = require("terser-webpack-plugin")
const OptimizeCSSAssetsPlugin = require("optimize-css-assets-webpack-plugin")
const MiniCssExtractPlugin = require("mini-css-extract-plugin")
const merge = require("webpack-merge")
const commonConfig = require("./common")

module.exports = merge(commonConfig, {
    optimization: {
        minimizer: [new TerserJSPlugin({}), new OptimizeCSSAssetsPlugin({})],
    },
    mode: "production",
    entry: "./src/index.tsx",
    output: {
        filename: "js/bundle.[contenthash].min.js",
        path: resolve(__dirname, "../build"),
        publicPath: "/",
    },
    devtool: "source-map",
    plugins: [
        new MiniCssExtractPlugin({
            filename: "main.[contenthash].css",
        }),
    ],
})
