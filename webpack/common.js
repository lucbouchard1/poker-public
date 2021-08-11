const path = require("path")
const HtmlWebpackPlugin = require("html-webpack-plugin")
const BundleAnalyzerPlugin = require("webpack-bundle-analyzer")
    .BundleAnalyzerPlugin
const DynamicCdnWebpackPlugin = require("dynamic-cdn-webpack-plugin")
const MiniCssExtractPlugin = require("mini-css-extract-plugin")
const CopyWebpackPlugin = require("copy-webpack-plugin")

module.exports = {
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
                test: /\.s?css$/,
                oneOf: [
                    {
                        test: /\.module\.s?css$/,
                        use: [
                            MiniCssExtractPlugin.loader,
                            {
                                loader: "css-loader",
                                options: {
                                    modules: true,
                                },
                            },
                            "sass-loader",
                            "postcss-loader",
                        ],
                    },
                    {
                        use: [
                            MiniCssExtractPlugin.loader,
                            "css-loader",
                            "sass-loader",
                            "postcss-loader",
                        ],
                    },
                ],
            },
            {
                test: /\.(png|svg|jpg|gif|mp3)$/,
                use: ["file-loader"],
            },
            {
                test: /\.ts(x?)$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: "ts-loader",
                    },
                ],
            },
            // All output '.js' files will have any sourcemaps re-processed by 'source-map-loader'.
            {
                enforce: "pre",
                test: /\.js$/,
                loader: "source-map-loader",
            },
        ],
    },

    externals: {
        firebase: "firebase",
    },

    plugins: [
        new HtmlWebpackPlugin({ template: "./src/index.html.ejs" }),
        new BundleAnalyzerPlugin({
            analyzerMode: "static",
            reportFilename: "../report.html",
            openAnalyzer: false,
        }),
        new DynamicCdnWebpackPlugin(),
        new CopyWebpackPlugin({ patterns: [{ from: "./public" }] }),
    ],
}
