const merge = require("webpack-merge")
const webpack = require("webpack")
const MiniCssExtractPlugin = require("mini-css-extract-plugin")
const commonConfig = require("./common")

commonConfig.module.rules[0].oneOf[0].use[0] = "style-loader"
commonConfig.module.rules[0].oneOf[0].use[1] = {
    loader: "css-loader",
    options: {
        modules: { localIdentName: "[name]-[local]--[hash:base64:5]" },
    },
}

module.exports = merge(commonConfig, {
    mode: "development",
    entry: [
        "react-hot-loader/patch", // activate HMR for React
        "webpack-dev-server/client?http://localhost:8080", // bundle the client for webpack-dev-server and connect to the provided endpoint
        "webpack/hot/only-dev-server", // bundle the client for hot reloading, only- means to only hot reload for successful updates
        "./src/index.tsx", // the entry point of our app
    ],
    devServer: {
        hot: true, // enable HMR on the server
        historyApiFallback: true,
        port: 8000,
    },
    devtool: "cheap-module-eval-source-map",
    plugins: [
        new MiniCssExtractPlugin(),
        new webpack.HotModuleReplacementPlugin(), // enable HMR globally
        new webpack.NamedModulesPlugin(), // prints more readable module names in the browser console on HMR updates
    ],
})
