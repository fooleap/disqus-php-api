const webpack = require('webpack');
const autoprefixer = require('autoprefixer'); 
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');

module.exports = {
    entry: {
        'iDisqus': './index.js',
    },
    output: {
        path: __dirname + '/dist',
        filename: '[name].min.js',
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
                test: /\.(scss|css)$/,
                use: [
                    MiniCssExtractPlugin.loader,
                    'css-loader',
                    {loader: 'postcss-loader', options: { plugins: () => [ require('autoprefixer') ] }},
                    'sass-loader'
                ]
            },
            {
                test: /\.html$/,
                use: [{
                    loader: 'file-loader',
                    options: {
                        name: '[name].[ext]'
                    }  
                }]
            }
        ],
    },
    plugins: [
        new MiniCssExtractPlugin({
            filename: 'iDisqus.min.css'
        })
    ],
    optimization: {
        minimizer: [
            new UglifyJSPlugin({
                uglifyOptions: { 
                    warnings: false,
                    output: {
                        comments: false,
                        beautify: false
                    },
                    ie8: false
                }
            })
        ]
    }
};
