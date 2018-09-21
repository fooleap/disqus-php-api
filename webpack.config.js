const webpack = require('webpack');
const autoprefixer = require('autoprefixer'); 
const path = require('path');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = function(env, argv) {

    return {

        devtool: argv.mode == 'production' ? 'source-maps' : 'eval',

        entry: {
            'iDisqus': './src/iDisqus.js',
        },

        output: {
            path: path.resolve(__dirname, 'dist'),
            filename: argv.mode == 'production' ? '[name].min.js' : '[name].js',
            libraryTarget: 'umd',
            library: '[name]'
        },

        stats: {
            entrypoints: false,
            children: false
        },

        module: {
            rules: [
                {
                    test: /\.scss$/,
                    use: [
                        argv.mode == 'production' ? MiniCssExtractPlugin.loader : 'style-loader',
                        'css-loader',
                        {
                            loader: 'postcss-loader',
                            options: { plugins: () => [ require('autoprefixer') ] }
                        },
                        'sass-loader'
                    ]
                }
            ]
        },

        plugins: [
            new MiniCssExtractPlugin({
                filename: argv.mode == 'production' ? '[name].min.css' : '[name].css',
                chunkFilename: '[name].css'
            }),
            new HtmlWebpackPlugin({
                template: './src/demo.html',
                filename: 'index.html',
                inject: 'head'
            })
        ],

        devServer: {
            contentBase: path.join(__dirname, 'dist'),
            compress: true,
            port: 9000,
            openPage: '/index.html'
        }
    }
};
