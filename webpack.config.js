const webpack = require('webpack');
const autoprefixer = require('autoprefixer'); 
const path = require('path');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');

module.exports = function(env, argv) {

    return {

        devtool: argv.mode == 'production' ? 'source-maps' : 'eval',

        entry: {
            'iDisqus': './index.js',
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
                        MiniCssExtractPlugin.loader,
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
                filename: argv.mode == 'production' ? '[name].min.css' : '[name].css'
            }),
            new CleanWebpackPlugin(['dist'], {
                watch: true
            }),
            new HtmlWebpackPlugin({
                template: './src/demo.html',
                filename: 'disqus-php-api.html',
                inject: 'head'
            })
        ],

        devServer: {
            contentBase: path.join(__dirname, 'dist'),
            compress: true,
            port: 9000,
            openPage: '/disqus-php-api.html'
        }
    }
};
